"""HTTP smoke test for the actual built frontend and a fresh backend process."""
import os,sys,subprocess,socket,time,json,urllib.request,http.cookiejar
from pathlib import Path

def test_real_server_with_bundled_assets(tmp_path):
    root=Path(__file__).resolve().parents[2]
    with socket.socket() as s:s.bind(('127.0.0.1',0));port=s.getsockname()[1]
    env={**os.environ,'TMS_DATA_DIR':str(tmp_path/'shop')}
    process=subprocess.Popen([sys.executable,'-m','uvicorn','app:app','--host','127.0.0.1','--port',str(port)],cwd=root/'backend',env=env,stdout=subprocess.DEVNULL,stderr=subprocess.PIPE)
    try:
        base=f'http://127.0.0.1:{port}'
        opener=urllib.request.build_opener(urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))
        for _ in range(50):
            try:
                with opener.open(base+'/api/auth/status',timeout=1) as r:status=json.load(r)
                break
            except OSError:time.sleep(.1)
        else:raise AssertionError('Server failed to start')
        assert status['signup_allowed']
        request=urllib.request.Request(base+'/api/auth/signup',data=json.dumps({'username':'smokeowner','password':'smoke-password-123'}).encode(),headers={'Content-Type':'application/json'})
        with opener.open(request,timeout=3) as r:csrf=json.load(r)['csrf']
        with opener.open(base+'/api/state',timeout=2) as r:assert json.load(r)['customers']==[]
        with urllib.request.urlopen(base,timeout=2) as r:html=r.read().decode()
        assert 'Thread &amp; Ledger' in html or 'Thread & Ledger' in html
        import re
        assets=re.findall(r'(?:src|href)="(/assets/[^"]+)"',html)
        assert len(assets)>=2
        for asset in assets:
            with urllib.request.urlopen(base+asset,timeout=2) as r:assert r.status==200 and len(r.read())>100
        request=urllib.request.Request(base+'/api/customers',data=json.dumps({'name':'Persistent Customer'}).encode(),headers={'Content-Type':'application/json','X-TMS-CSRF':csrf},method='POST')
        with opener.open(request,timeout=2) as r:assert r.status==200
    finally:
        process.terminate();process.wait(timeout=10)
    # A completely new process reads the same persistent database.
    process=subprocess.Popen([sys.executable,'-m','uvicorn','app:app','--host','127.0.0.1','--port',str(port)],cwd=root/'backend',env=env,stdout=subprocess.DEVNULL,stderr=subprocess.PIPE)
    try:
        for _ in range(50):
            try:
                with opener.open(base+'/api/state',timeout=1) as r:state=json.load(r)
                break
            except OSError:time.sleep(.1)
        else:raise AssertionError('Server failed to restart')
        assert state['customers'][0]['name']=='Persistent Customer'
    finally:process.terminate();process.wait(timeout=10)
