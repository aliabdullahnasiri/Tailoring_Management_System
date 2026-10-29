#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::{
    io::{BufRead, BufReader},
    process::{Child, Command, Stdio},
    sync::{
        atomic::{AtomicBool, Ordering},
        mpsc, Arc, Mutex,
    },
    thread,
    time::{Duration, Instant, SystemTime, UNIX_EPOCH},
};
use tauri::{webview::DownloadEvent, Manager, WebviewUrl, WebviewWindowBuilder};
use tauri_plugin_dialog::DialogExt;

#[derive(Default)]
struct Preferences(Mutex<()>);

fn preference_key(key: &str) -> bool {
    matches!(
        key,
        "thread-ledger-theme"
            | "thread-ledger-language"
            | "thread-ledger-appearance"
            | "thread-ledger-sidebar-mini"
    ) || (key.starts_with("thread-ledger-notifications:") && key.len() <= 256)
}

fn read_preferences(
    path: &std::path::Path,
) -> Result<std::collections::BTreeMap<String, String>, String> {
    match std::fs::read(path) {
        Ok(bytes) => serde_json::from_slice(&bytes).map_err(|error| error.to_string()),
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => Ok(Default::default()),
        Err(error) => Err(error.to_string()),
    }
}

#[tauri::command]
fn save_preference(
    app: tauri::AppHandle,
    state: tauri::State<Preferences>,
    key: String,
    value: Option<String>,
) -> Result<(), String> {
    if !preference_key(&key)
        || value
            .as_ref()
            .is_some_and(|value| value.len() > 1024 * 1024)
    {
        return Err("Invalid desktop preference".into());
    }
    let _guard = state.inner().0.lock().map_err(|error| error.to_string())?;
    let directory = app
        .path()
        .app_config_dir()
        .map_err(|error| error.to_string())?;
    std::fs::create_dir_all(&directory).map_err(|error| error.to_string())?;
    let path = directory.join("preferences.json");
    let mut preferences = read_preferences(&path)?;
    if let Some(value) = value {
        preferences.insert(key, value);
    } else {
        preferences.remove(&key);
    }
    let temporary = directory.join("preferences.json.tmp");
    std::fs::write(
        &temporary,
        serde_json::to_vec(&preferences).map_err(|error| error.to_string())?,
    )
    .map_err(|error| error.to_string())?;
    std::fs::rename(temporary, path).map_err(|error| error.to_string())
}

#[derive(Default)]
struct Backend {
    child: Mutex<Option<Child>>,
    stopping: AtomicBool,
}

impl Backend {
    fn stop(&self) {
        self.stopping.store(true, Ordering::SeqCst);
        if let Some(mut child) = self.child.lock().unwrap().take() {
            // EOF asks Python to stop Uvicorn cleanly. It also works through the
            // PyInstaller one-file bootloader and when this desktop process dies.
            drop(child.stdin.take());
            let deadline = Instant::now() + Duration::from_secs(5);
            loop {
                match child.try_wait() {
                    Ok(Some(_)) => break,
                    Ok(None) if Instant::now() < deadline => {
                        thread::sleep(Duration::from_millis(50))
                    }
                    _ => {
                        let _ = child.kill();
                        let _ = child.wait();
                        break;
                    }
                }
            }
        }
    }
}

#[tauri::command]
async fn print_receipt(window: tauri::WebviewWindow) -> Result<(), String> {
    window.print().map_err(|error| error.to_string())
}

fn report_error(app: &tauri::AppHandle, message: &str) {
    eprintln!("Desktop error: {message}");
    if app.state::<Arc<Backend>>().stopping.load(Ordering::SeqCst) {
        return;
    }
    for label in ["main", "startup"] {
        if let Some(window) = app.get_webview_window(label) {
            let message = serde_json::to_string(message).unwrap();
            let _ = window.eval(format!(
                "document.body.replaceChildren(); const main = document.createElement('main'); \
                 main.style.cssText='padding:40px;font:16px system-ui;white-space:pre-wrap'; \
                 main.textContent={message}; document.body.append(main);"
            ));
        }
    }
    app.dialog()
        .message(message)
        .title("Could not open your shop")
        .show(|_| {});
}

fn valid_backend_url(value: &str) -> Option<tauri::Url> {
    let url = tauri::Url::parse(value).ok()?;
    (url.scheme() == "http"
        && url.host_str() == Some("127.0.0.1")
        && url.port().is_some()
        && url.path() == "/"
        && url.query().is_none()
        && url.fragment().is_none()
        && url.username().is_empty()
        && url.password().is_none())
    .then_some(url)
}

fn open_shop(app: &tauri::AppHandle, url: tauri::Url) -> Result<(), Box<dyn std::error::Error>> {
    // Only this backend's exact origin may call our native commands. The
    // frontend has no shell, arbitrary filesystem, or process permissions.
    let capability = serde_json::json!({
        "identifier": "shop-printing", "local": false, "windows": ["main"],
        "remote": { "urls": [format!("{}/*", url.origin().ascii_serialization())] },
        "permissions": ["allow-print-receipt", "allow-save-preference"]
    });
    app.add_capability(capability.to_string())?;
    let preferences = read_preferences(&app.path().app_config_dir()?.join("preferences.json"))
        .map_err(std::io::Error::other)?;
    let preferences_script = format!(
        "({})({}, {}, {});",
        include_str!("preferences.js"),
        serde_json::to_string(&preferences)?,
        serde_json::to_string(&url.origin().ascii_serialization())?,
        serde_json::to_string(
            &SystemTime::now()
                .duration_since(UNIX_EPOCH)?
                .as_nanos()
                .to_string()
        )?
    );
    let origin = url.origin();
    let download_origin = origin.clone();
    let download_path = Arc::new(Mutex::new(None::<std::path::PathBuf>));
    let app_download = app.clone();
    WebviewWindowBuilder::new(app, "main", WebviewUrl::External(url))
        .title("Thread & Ledger")
        .inner_size(1280.0, 840.0)
        .min_inner_size(360.0, 480.0)
        .initialization_script(preferences_script)
        .on_navigation(move |target| target.origin() == origin)
        .initialization_script(
            // Keep window.print intact: WebView2 calls it from its native print command.
            "window.__TMS_PRINT_RECEIPT__ = () => window.__TAURI_INTERNALS__.invoke('print_receipt');",
        )
        .on_download(move |_webview, event| {
            match event {
                DownloadEvent::Requested { url, destination } => {
                    if url.origin() != download_origin || url.path() != "/api/backup" {
                        return false;
                    }
                    let Ok(directory) = app_download.path().download_dir() else {
                        return false;
                    };
                    if std::fs::create_dir_all(&directory).is_err() {
                        return false;
                    }
                    let timestamp = SystemTime::now()
                        .duration_since(UNIX_EPOCH)
                        .unwrap_or_default()
                        .as_nanos();
                    let path = directory.join(format!("tailoring-backup-{timestamp}.db"));
                    *destination = path.clone();
                    *download_path.lock().unwrap() = Some(path);
                }
                DownloadEvent::Finished { path, success, .. } => {
                    let selected = path.or_else(|| download_path.lock().unwrap().take());
                    let message = if success {
                        format!(
                            "Backup saved to:\n{}",
                            selected
                                .map(|p| p.display().to_string())
                                .unwrap_or_else(|| "Downloads".into())
                        )
                    } else {
                        "The backup could not be saved. Please try again.".into()
                    };
                    app_download
                        .dialog()
                        .message(message)
                        .title("Shop backup")
                        .show(|_| {});
                }
                _ => {}
            }
            true
        })
        .build()?;
    if let Some(startup) = app.get_webview_window("startup") {
        startup.destroy()?;
    }
    Ok(())
}

fn start_backend(
    app: tauri::AppHandle,
    backend: Arc<Backend>,
) -> Result<(), Box<dyn std::error::Error>> {
    // Tauri copies externalBin beside the executable on all desktop platforms,
    // including target/debug for development, removing the target-triple suffix.
    let executable = std::env::current_exe()?.with_file_name(if cfg!(windows) {
        "tms-backend.exe"
    } else {
        "tms-backend"
    });
    let mut command = Command::new(executable);
    command
        .args(["--desktop", "--no-browser", "--port", "0"])
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .env_remove("TMS_PUBLIC_ORIGIN")
        .env_remove("TMS_SETUP_KEY");
    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        command.creation_flags(0x08000000); // CREATE_NO_WINDOW
    }
    let mut slot = backend.child.lock().unwrap();
    if backend.stopping.load(Ordering::SeqCst) {
        return Ok(());
    }
    let mut child = command.spawn()?;
    let stdout = child.stdout.take().unwrap();
    let stderr = child.stderr.take().unwrap();
    *slot = Some(child);
    drop(slot);
    let diagnostics = Arc::new(Mutex::new(std::collections::VecDeque::new()));
    let log = diagnostics.clone();
    thread::spawn(move || {
        for line in BufReader::new(stderr).lines().map_while(Result::ok) {
            eprintln!("{line}");
            let mut log = log.lock().unwrap();
            if log.len() == 20 {
                log.pop_front();
            }
            log.push_back(line);
        }
    });
    let (sender, receiver) = mpsc::channel();
    thread::spawn(move || {
        for line in BufReader::new(stdout).lines().map_while(Result::ok) {
            if let Some(address) = line.strip_prefix("TMS_READY ") {
                if sender.send(address.to_owned()).is_err() {
                    break;
                }
            }
        }
        // Closing this sender also reports unexpected backend termination.
    });
    let address = receiver
        .recv_timeout(Duration::from_secs(90))
        .map_err(|error| {
            format!(
                "The Python backend could not start ({error}).\n{}",
                diagnostics
                    .lock()
                    .unwrap()
                    .iter()
                    .cloned()
                    .collect::<Vec<_>>()
                    .join("\n")
            )
        })?;
    let url = valid_backend_url(&address).ok_or("Backend returned an invalid address")?;
    if backend.stopping.load(Ordering::SeqCst) {
        return Ok(());
    }
    open_shop(&app, url.clone())?;
    eprintln!("Desktop window ready at {url}");
    // Keep watching after startup so a backend crash is visible to the user.
    let _ = receiver.recv();
    if !backend.stopping.load(Ordering::SeqCst) {
        return Err(
            "The local backend stopped. Close and reopen Thread & Ledger to continue.".into(),
        );
    }
    Ok(())
}

fn main() {
    let backend = Arc::new(Backend::default());
    let state = backend.clone();
    let app = tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|app, _, _| {
            if let Some(window) = app
                .get_webview_window("main")
                .or_else(|| app.get_webview_window("startup"))
            {
                let _ = window.unminimize();
                let _ = window.set_focus();
            }
        }))
        .plugin(tauri_plugin_dialog::init())
        .manage(backend.clone())
        .manage(Preferences::default())
        .invoke_handler(tauri::generate_handler![print_receipt, save_preference])
        .setup(move |app| {
            WebviewWindowBuilder::new(app, "startup", WebviewUrl::App("index.html".into()))
                .title("Thread & Ledger")
                .inner_size(640.0, 420.0)
                .build()?;
            let handle = app.handle().clone();
            let state = state.clone();
            thread::spawn(move || {
                if let Err(error) = start_backend(handle.clone(), state.clone()) {
                    report_error(&handle, &error.to_string());
                    state.stop();
                }
            });
            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("Could not initialize Thread & Ledger");
    app.run(move |_app, event| {
        if let tauri::RunEvent::Exit = event {
            backend.stop();
        }
    });
}

#[cfg(test)]
mod tests {
    use super::valid_backend_url;

    #[test]
    fn accept_only_the_local_backend_address() {
        assert!(valid_backend_url("http://127.0.0.1:43021").is_some());
        for value in [
            "https://example.com:8000",
            "http://localhost:8000",
            "http://127.0.0.1",
            "http://user@127.0.0.1:8000",
            "http://127.0.0.1:8000/path",
            "http://127.0.0.1:8000/?x=1",
        ] {
            assert!(valid_backend_url(value).is_none(), "{value}");
        }
    }
}
