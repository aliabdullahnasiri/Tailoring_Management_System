import "./fabric.css";
import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  ArrowDownToLine,
  BarChart3,
  ClipboardList,
  Factory,
  Plus,
  PieChart,
  Recycle,
  Send,
  Undo2,
  X,
} from "lucide-react";
import type {
  Order,
  State,
  FabricAssignment,
  FabricLot,
  FabricTransaction,
} from "./types";
import { formatDate, formatNumber, t, useLanguage } from "./i18n";
import { AppSelect } from "./ReactControls";
import { useAnimatedClose } from "./useAnimatedClose";

type Api = (path: string, body?: unknown, method?: string) => Promise<any>;
type Props = {
  data: State;
  api: Api;
  refresh: () => Promise<void>;
  setToast: (message: string) => void;
};
type FabricAction = "catalog" | "lot" | "assignment";
type FabricPage =
  "Overview" | "Inventory" | "Customer Fabrics" | "Assignments" | "Ledger";

const units = ["meter", "yard", "gaz", "piece"];
const fabricPages: FabricPage[] = [
  "Overview",
  "Inventory",
  "Customer Fabrics",
  "Assignments",
  "Ledger",
];
const request = () => crypto.randomUUID();
const pageTitles: Record<FabricPage, string> = {
  Overview: "Fabric Management",
  Inventory: "Fabric inventory",
  "Customer Fabrics": "Customer fabrics",
  Assignments: "Fabric assignments",
  Ledger: "Fabric transaction ledger",
};
const pageDescriptions: Record<FabricPage, string> = {
  Overview: "Follow every piece from receiving to cutting, return, or waste.",
  Inventory: "Shop-owned stock available for sale or tailoring orders.",
  "Customer Fabrics":
    "Keep each customer’s remaining fabric separate and returnable.",
  Assignments:
    "Reserve fabric before cutting, then record actual use and waste.",
  Ledger:
    "Every receipt, reservation, use, return, and waste event remains visible.",
};

function Field({ label, children }: { label: string; children: ReactNode }) {
  const id = React.useId();
  const control = React.isValidElement<{
    placeholder?: string;
    type?: string;
    id?: string;
  }>(children)
    ? children
    : null;
  const customControl = control?.type === AppSelect;
  const textControl = control?.type === "input" || control?.type === "textarea";
  return (
    <label
      htmlFor={id}
      className={`field floating-field${customControl ? " field-custom" : ""}`}
    >
      {control
        ? React.cloneElement(control, {
            id,
            ...(textControl
              ? { placeholder: control.props.placeholder ?? " " }
              : {}),
          })
        : children}
      <span>{t(label)}</span>
    </label>
  );
}

function ActionForm({
  title,
  children,
  onSubmit,
  onClose,
  busy,
  notice,
}: {
  title: string;
  children: ReactNode;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
  busy: boolean;
  notice: string;
}) {
  return (
    <section
      className="modal wide fabric-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="fabric-modal-title"
    >
      <div className="modal-scroll">
        <header className="modal-heading">
          <div>
            <span className="eyebrow">{t("TRACEABLE FABRIC WORKSPACE")}</span>
            <h2 id="fabric-modal-title">{t(title)}</h2>
          </div>
          <button
            className="icon"
            type="button"
            aria-label={t("Close dialog")}
            disabled={busy}
            onClick={onClose}
          >
            <X size={22} />
          </button>
        </header>
        {notice && (
          <div className="error" role="alert">
            {t(notice)}
          </div>
        )}
        <form onSubmit={onSubmit}>
          <div className="fabric-form-grid">{children}</div>
          <footer className="form-footer">
            <button
              className="secondary"
              type="button"
              disabled={busy}
              onClick={onClose}
            >
              {t("Cancel")}
            </button>
            <button className="primary" disabled={busy} type="submit">
              <Plus size={16} />
              {t(busy ? "Saving…" : "Save record")}
            </button>
          </footer>
        </form>
      </div>
    </section>
  );
}

function localDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
function transactionDayKey(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value.slice(0, 10) : localDateKey(date);
}

function FabricOverviewCharts({
  transactions,
  lots,
}: {
  transactions: FabricTransaction[];
  lots: FabricLot[];
}) {
  const [movementIndex, setMovementIndex] = useState<number | null>(null),
    [allocationIndex, setAllocationIndex] = useState<number | null>(null);
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() - 6 + index);
    const key = localDateKey(date);
    const total = transactions
      .filter((tx) => transactionDayKey(tx.created) === key)
      .reduce((sum, tx) => sum + Math.abs(tx.quantity), 0);
    return { date, total };
  });
  const peak = Math.max(1, ...days.map((day) => day.total));
  const allocation = [
    {
      label: "Shop available",
      value: lots
        .filter((lot) => lot.owner_type === "Shop")
        .reduce((sum, lot) => sum + lot.quantity_available, 0),
      color: "var(--fabric-chart-shop)",
    },
    {
      label: "Customer held",
      value: lots
        .filter((lot) => lot.owner_type === "Customer")
        .reduce((sum, lot) => sum + lot.quantity_available, 0),
      color: "var(--fabric-chart-customer)",
    },
    {
      label: "Reserved",
      value: lots.reduce((sum, lot) => sum + lot.quantity_reserved, 0),
      color: "var(--fabric-chart-reserved)",
    },
  ];
  const allocationTotal = allocation.reduce((sum, item) => sum + item.value, 0);
  let offset = 0;
  const segments = allocation.map((item) => {
    const share = allocationTotal ? (item.value / allocationTotal) * 100 : 0;
    const segment = { ...item, share, start: offset };
    offset += share;
    return segment;
  });
  const selectedAllocation =
    allocationIndex === null ? null : segments[allocationIndex];
  return (
    <div className="fabric-overview-charts">
      <section className="card fabric-chart-card">
        <div className="card-heading">
          <div>
            <h3 className="chart-title">
              <BarChart3 size={18} aria-hidden="true" />
              {t("Fabric movement")}
            </h3>
            <p>{t("Units recorded in the last 7 days.")}</p>
          </div>
          <strong>
            {formatNumber(days.reduce((sum, day) => sum + day.total, 0))}
          </strong>
        </div>
        <div className="fabric-bar-chart" aria-label={t("Fabric movement")}>
          <div className="fabric-bar-axis" aria-hidden="true">
            <span>{formatNumber(peak)}</span>
            <span>{formatNumber(Math.round(peak / 2))}</span>
            <span>0</span>
          </div>
          <div className="fabric-bar-plot">
            {days.map((day, index) => (
              <button
                type="button"
                className={`fabric-bar-slot${movementIndex === index ? " is-active" : ""}`}
                key={day.date.toISOString()}
                aria-label={`${formatDate(day.date)}: ${t("Units moved")} ${formatNumber(day.total)}`}
                onMouseEnter={() => setMovementIndex(index)}
                onMouseLeave={() => setMovementIndex(null)}
                onFocus={() => setMovementIndex(index)}
                onBlur={() => setMovementIndex(null)}
              >
                <span
                  className="fabric-bar"
                  style={{ height: `${(day.total / peak) * 100}%` }}
                />
                {movementIndex === index && (
                  <span className="fabric-chart-tooltip" role="status">
                    <strong>{formatDate(day.date)}</strong>
                    <span>
                      {t("Units moved")}: {formatNumber(day.total)}
                    </span>
                  </span>
                )}
                <small>
                  {formatDate(day.date).replace(/\s+[۰-۹0-9]{4}$/, "")}
                </small>
              </button>
            ))}
          </div>
        </div>
        {!days.some((day) => day.total > 0) && (
          <p className="fabric-chart-empty">{t("No fabric movement yet")}</p>
        )}
        <details className="fabric-chart-table">
          <summary>{t("View data table")}</summary>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>{t("Date")}</th>
                  <th>{t("Units moved")}</th>
                </tr>
              </thead>
              <tbody>
                {days.map((day) => (
                  <tr key={`movement-${day.date.toISOString()}`}>
                    <td>{formatDate(day.date)}</td>
                    <td>
                      <strong>{formatNumber(day.total)}</strong>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </section>
      <section className="card fabric-chart-card">
        <div className="card-heading">
          <div>
            <h3 className="chart-title">
              <PieChart size={18} aria-hidden="true" />
              {t("Fabric allocation")}
            </h3>
            <p>{t("Current stock allocation")}</p>
          </div>
          <span className="muted">
            {formatNumber(allocationTotal)} {t("Units")}
          </span>
        </div>
        <div className="fabric-allocation-chart">
          <div className="fabric-donut-wrap">
            <svg viewBox="0 0 120 120" aria-label={t("Fabric allocation")}>
              {
                <circle
                  cx="60"
                  cy="60"
                  r="44"
                  fill="none"
                  stroke="var(--field-border)"
                  strokeWidth="16"
                />
              }
              {segments
                .filter((segment) => segment.value > 0)
                .map((segment) => {
                  const segmentIndex = segments.indexOf(segment);
                  return (
                    <circle
                      key={segment.label}
                      cx="60"
                      cy="60"
                      r="44"
                      fill="none"
                      stroke={segment.color}
                      strokeWidth={
                        selectedAllocation?.label === segment.label ? 20 : 16
                      }
                      pathLength="100"
                      strokeDasharray={`${segment.share} ${100 - segment.share}`}
                      strokeDashoffset={-segment.start}
                      transform="rotate(-90 60 60)"
                      className="fabric-donut-segment"
                      tabIndex={0}
                      role="button"
                      aria-label={`${t(segment.label)}: ${formatNumber(segment.value)}`}
                      onMouseEnter={() => setAllocationIndex(segmentIndex)}
                      onMouseLeave={() => setAllocationIndex(null)}
                      onFocus={() => setAllocationIndex(segmentIndex)}
                      onBlur={() => setAllocationIndex(null)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          setAllocationIndex(segmentIndex);
                        }
                      }}
                    />
                  );
                })}
            </svg>
            <div className="fabric-donut-caption">
              <strong>
                {formatNumber(selectedAllocation?.value ?? allocationTotal)}
              </strong>
              <small>{t(selectedAllocation?.label ?? "Units")}</small>
            </div>
          </div>
          <ul className="fabric-chart-legend">
            {segments.map((segment, index) => (
              <li key={segment.label}>
                <button
                  type="button"
                  className={
                    selectedAllocation?.label === segment.label
                      ? "is-active"
                      : ""
                  }
                  onMouseEnter={() => setAllocationIndex(index)}
                  onMouseLeave={() => setAllocationIndex(null)}
                  onFocus={() => setAllocationIndex(index)}
                  onBlur={() => setAllocationIndex(null)}
                >
                  <i style={{ background: segment.color }} />
                  <span>{t(segment.label)}</span>
                  <strong>{formatNumber(segment.value)}</strong>
                </button>
              </li>
            ))}
          </ul>
        </div>
        <details className="fabric-chart-table">
          <summary>{t("View data table")}</summary>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>{t("Category")}</th>
                  <th>{t("Quantity")}</th>
                </tr>
              </thead>
              <tbody>
                {allocation.map((item) => (
                  <tr key={`allocation-${item.label}`}>
                    <td>{t(item.label)}</td>
                    <td>
                      <strong>{formatNumber(item.value)}</strong>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </section>
    </div>
  );
}

export function FabricManagement({ data, api, refresh, setToast }: Props) {
  useLanguage();
  const fabrics = data.fabrics || {
    catalog: [],
    lots: [],
    assignments: [],
    transactions: [],
  };
  const [view, setView] = useState<FabricPage>("Overview"),
    [busy, setBusy] = useState(false),
    [action, setAction] = useState<FabricAction | null>(null);
  const [notice, setNotice] = useState("");
  const modalRoot = useRef<HTMLDivElement>(null),
    busyRef = useRef(false);
  const modalExit = useAnimatedClose(() => {
    setAction(null);
    setNotice("");
  });
  busyRef.current = busy;
  const closeAction = () => {
    if (!busy) modalExit.close();
  };
  const openAction = (next: FabricAction) => {
    modalExit.cancel();
    setNotice("");
    setAction(next);
  };
  useEffect(() => {
    if (!action) return;
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const root = modalRoot.current;
    const focusFirst = () =>
      root
        ?.querySelector<HTMLElement>(".modal input,.modal select,.modal button")
        ?.focus();
    const timer = window.setTimeout(focusFirst, 0);
    const key = (event: KeyboardEvent) => {
      const dialog = root?.querySelector<HTMLElement>(".modal");
      if (event.key === "Escape" && !busyRef.current) {
        event.preventDefault();
        closeAction();
        return;
      }
      if (event.key !== "Tab" || !dialog) return;
      const all = Array.from(
        dialog.querySelectorAll<HTMLElement>(
          'button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex="0"]',
        ),
      );
      const first = all[0],
        last = all[all.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener("keydown", key);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("keydown", key);
      document.body.style.overflow = overflow;
      previous?.focus({ preventScroll: true });
    };
  }, [action]);
  const shopLots = fabrics.lots.filter((l) => l.owner_type === "Shop");
  const customerLots = fabrics.lots.filter((l) => l.owner_type === "Customer");
  const available = shopLots.reduce((n, l) => n + l.quantity_available, 0);
  const customerAvailable = customerLots.reduce(
    (n, l) => n + l.quantity_available,
    0,
  );
  const consumed = fabrics.lots.reduce((n, l) => n + l.quantity_consumed, 0);
  const reserved = fabrics.lots.reduce((n, l) => n + l.quantity_reserved, 0);
  const wasted = fabrics.lots.reduce((n, l) => n + l.quantity_wasted, 0);
  const submit = async (
    actionFn: () => Promise<unknown>,
    closeModal = false,
  ) => {
    if (busy) return;
    setBusy(true);
    setNotice("");
    try {
      await actionFn();
      await refresh();
      if (closeModal) modalExit.close();
      setToast("Fabric record saved.");
    } catch (e) {
      setNotice((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const catalogById = useMemo(
    () => new Map(fabrics.catalog.map((c) => [c.id, c])),
    [fabrics.catalog],
  );
  const customer = (id: string | null) =>
    id
      ? data.customers.find((c) => c.id === id)?.name || t("Record not found")
      : "";
  return (
    <div className="fabric-module fabric-module-refined">
      <header className="fabric-intro fabric-intro-refined">
        <div className="fabric-intro-copy">
          <span className="eyebrow">{t("TRACEABLE FABRIC WORKSPACE")}</span>
          <h2>{t(pageTitles[view])}</h2>
          <p>{t(pageDescriptions[view])}</p>
        </div>
        <div className="fabric-intro-actions" aria-label={t("Fabric actions")}>
          <button
            className="primary"
            type="button"
            aria-haspopup="dialog"
            onClick={() => openAction("catalog")}
          >
            <Plus size={17} />
            {t("Add fabric to registry")}
          </button>
          <button
            className="secondary"
            type="button"
            aria-haspopup="dialog"
            onClick={() => openAction("lot")}
          >
            <ArrowDownToLine size={17} />
            {t("Receive a fabric lot")}
          </button>
          <button
            className="secondary"
            type="button"
            aria-haspopup="dialog"
            onClick={() => openAction("assignment")}
          >
            <Send size={17} />
            {t("Assign fabric to an order")}
          </button>
        </div>
      </header>
      <nav
        className="fabric-page-nav fabric-tabs"
        aria-label={t("Fabric Management")}
      >
        {fabricPages.map((page) => (
          <button
            type="button"
            key={page}
            aria-current={view === page ? "page" : undefined}
            className={view === page ? "active" : ""}
            onClick={() => setView(page)}
          >
            {t(page)}
          </button>
        ))}
      </nav>
      {notice && !action && (
        <div className="error" role="alert">
          {t(notice)}
        </div>
      )}
      {action && (
        <div
          ref={modalRoot}
          className={`modal-backdrop fabric-modal-backdrop${modalExit.closing ? " is-closing" : ""}`}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeAction();
          }}
        >
          {action === "catalog" ? (
            <ActionForm
              title="Add fabric to registry"
              busy={busy}
              notice={notice}
              onClose={closeAction}
              onSubmit={(e) => {
                e.preventDefault();
                const f = new FormData(e.currentTarget);
                void submit(
                  () =>
                    api("/fabrics/catalog", {
                      code: f.get("code"),
                      name: f.get("name"),
                      fabric_type: f.get("fabric_type"),
                      color: f.get("color"),
                      quality: f.get("quality"),
                      unit: f.get("unit"),
                      default_purchase_cost: Number(
                        f.get("purchase_cost") || 0,
                      ),
                      default_selling_price: Number(
                        f.get("selling_price") || 0,
                      ),
                      notes: f.get("notes"),
                    }),
                  true,
                );
              }}
            >
              <Field label="Code">
                <input name="code" required maxLength={40} />
              </Field>
              <Field label="Fabric name">
                <input name="name" required maxLength={120} />
              </Field>
              <Field label="Type">
                <input
                  name="fabric_type"
                  required
                  placeholder={t("Cotton, silk, wool…")}
                />
              </Field>
              <Field label="Color">
                <input name="color" />
              </Field>
              <Field label="Quality">
                <input name="quality" />
              </Field>
              <Field label="Unit">
                <AppSelect name="unit" defaultValue="meter">
                  {units.map((u) => (
                    <option key={u} value={u}>
                      {t(u)}
                    </option>
                  ))}
                </AppSelect>
              </Field>
              <Field label="Purchase cost (AFN)">
                <input
                  name="purchase_cost"
                  type="number"
                  min="0"
                  step="1"
                  defaultValue="0"
                />
              </Field>
              <Field label="Selling price (AFN)">
                <input
                  name="selling_price"
                  type="number"
                  min="0"
                  step="1"
                  defaultValue="0"
                />
              </Field>
              <Field label="Notes">
                <input name="notes" />
              </Field>
            </ActionForm>
          ) : action === "lot" ? (
            <ActionForm
              title="Receive a fabric lot"
              busy={busy}
              notice={notice}
              onClose={closeAction}
              onSubmit={(e) => {
                e.preventDefault();
                const f = new FormData(e.currentTarget);
                void submit(
                  () =>
                    api("/fabrics/lots", {
                      catalog_id: f.get("catalog_id"),
                      owner_type: f.get("owner_type"),
                      customer_id: f.get("customer_id") || null,
                      supplier: f.get("supplier"),
                      quantity: Number(f.get("quantity")),
                      unit: f.get("unit") || null,
                      purchase_cost: f.get("purchase_cost")
                        ? Number(f.get("purchase_cost"))
                        : null,
                      selling_price: f.get("selling_price")
                        ? Number(f.get("selling_price"))
                        : null,
                      notes: f.get("notes"),
                      request_id: request(),
                    }),
                  true,
                );
              }}
            >
              <Field label="Fabric">
                <AppSelect name="catalog_id" required>
                  <option value="">{t("Select a fabric")}</option>
                  {fabrics.catalog.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code} · {c.name} · {c.color}
                    </option>
                  ))}
                </AppSelect>
              </Field>
              <Field label="Ownership">
                <AppSelect name="owner_type" defaultValue="Shop">
                  <option value="Shop">{t("Shop-owned fabric")}</option>
                  <option value="Customer">{t("Customer-owned fabric")}</option>
                </AppSelect>
              </Field>
              <Field label="Customer (for customer fabric)">
                <AppSelect name="customer_id">
                  <option value="">{t("Select a customer")}</option>
                  {data.customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </AppSelect>
              </Field>
              <Field label="Quantity">
                <input
                  name="quantity"
                  type="number"
                  min="1"
                  step="1"
                  required
                />
              </Field>
              <Field label="Unit">
                <AppSelect name="unit">
                  <option value="">{t("Use catalog unit")}</option>
                  {units.map((u) => (
                    <option key={u} value={u}>
                      {t(u)}
                    </option>
                  ))}
                </AppSelect>
              </Field>
              <Field label="Supplier">
                <input name="supplier" />
              </Field>
              <Field label="Purchase cost (AFN)">
                <input
                  name="purchase_cost"
                  type="number"
                  min="0"
                  step="1"
                  defaultValue="0"
                />
              </Field>
              <Field label="Notes">
                <input name="notes" />
              </Field>
            </ActionForm>
          ) : (
            <ActionForm
              title="Assign fabric to an order"
              busy={busy}
              notice={notice}
              onClose={closeAction}
              onSubmit={(e) => {
                e.preventDefault();
                const f = new FormData(e.currentTarget);
                void submit(
                  () =>
                    api("/fabrics/assignments", {
                      lot_id: f.get("lot_id"),
                      order_id: f.get("order_id"),
                      quantity: Number(f.get("quantity")),
                      notes: f.get("notes"),
                      request_id: request(),
                    }),
                  true,
                );
              }}
            >
              <Field label="Fabric lot">
                <AppSelect name="lot_id" required>
                  <option value="">{t("Select available fabric")}</option>
                  {fabrics.lots
                    .filter((l) => l.quantity_available > 0)
                    .map((l) => (
                      <option key={l.id} value={l.id}>
                        {catalogById.get(l.catalog_id)?.name || l.catalog_id} ·{" "}
                        {formatNumber(l.quantity_available)} {t(l.unit)}
                      </option>
                    ))}
                </AppSelect>
              </Field>
              <Field label="Order">
                <AppSelect name="order_id" required searchable>
                  <option value="">{t("Select an order")}</option>
                  {data.orders
                    .filter((o) => o.status !== "Delivered")
                    .map((o) => (
                      <option key={o.id} value={o.id}>
                        TMS-{String(o.number).padStart(4, "0")} ·{" "}
                        {
                          data.customers.find((c) => c.id === o.customer_id)
                            ?.name
                        }
                      </option>
                    ))}
                </AppSelect>
              </Field>
              <Field label="Quantity">
                <input
                  name="quantity"
                  type="number"
                  min="1"
                  step="1"
                  required
                />
              </Field>
              <Field label="Notes">
                <input name="notes" />
              </Field>
            </ActionForm>
          )}
        </div>
      )}
      <div className="fabric-page-content" key={view}>
        {view === "Overview" && (
          <>
            <div className="fabric-stats">
              <div>
                <span>{t("Shop fabric available")}</span>
                <strong>{formatNumber(available)}</strong>
                <small>{t("Units ready for orders")}</small>
              </div>
              <div>
                <span>{t("Customer fabric held")}</span>
                <strong>{formatNumber(customerAvailable)}</strong>
                <small>{t("Units to return or use")}</small>
              </div>
              <div>
                <span>{t("Reserved for orders")}</span>
                <strong>{formatNumber(reserved)}</strong>
                <small>{t("Issued for cutting")}</small>
              </div>
              <div>
                <span>{t("Used and wasted")}</span>
                <strong>{formatNumber(consumed + wasted)}</strong>
                <small>{t("Complete ledger history")}</small>
              </div>
            </div>
            <FabricOverviewCharts
              transactions={fabrics.transactions}
              lots={fabrics.lots}
            />
            <section className="card fabric-activity-card">
              <div className="card-heading">
                <div>
                  <h3>{t("Recent fabric activity")}</h3>
                  <p>{t("The latest movement across every lot.")}</p>
                </div>
                <ClipboardList size={20} />
              </div>
              <FabricLedger
                transactions={fabrics.transactions
                  .slice()
                  .sort((a, b) => b.created.localeCompare(a.created))
                  .slice(0, 6)}
                lots={fabrics.lots}
                catalog={catalogById}
              />
            </section>
          </>
        )}
        {view === "Inventory" && (
          <section className="card">
            <div className="list-toolbar">
              <div>
                <h3>
                  {t("Fabric inventory")}{" "}
                  <span className="count">{formatNumber(shopLots.length)}</span>
                </h3>
                <p>{t(pageDescriptions.Inventory)}</p>
              </div>
            </div>
            <LotTable
              lots={shopLots}
              catalog={catalogById}
              customer={customer}
            />
          </section>
        )}
        {view === "Customer Fabrics" && (
          <section className="card">
            <div className="list-toolbar">
              <div>
                <h3>
                  {t("Customer fabrics")}{" "}
                  <span className="count">
                    {formatNumber(customerLots.length)}
                  </span>
                </h3>
                <p>{t(pageDescriptions["Customer Fabrics"])}</p>
              </div>
            </div>
            <LotTable
              lots={customerLots}
              catalog={catalogById}
              customer={customer}
              onReturn={(lot, quantity) =>
                void submit(() =>
                  api(`/fabrics/lots/${lot.id}/return`, {
                    quantity,
                    notes: "Customer fabric return",
                    request_id: request(),
                  }),
                )
              }
            />
          </section>
        )}
        {view === "Assignments" && (
          <section className="card">
            <div className="list-toolbar">
              <div>
                <h3>
                  {t("Fabric assignments")}{" "}
                  <span className="count">
                    {formatNumber(fabrics.assignments.length)}
                  </span>
                </h3>
                <p>{t(pageDescriptions.Assignments)}</p>
              </div>
            </div>
            <AssignmentTable
              assignments={fabrics.assignments}
              lots={fabrics.lots}
              catalog={catalogById}
              orders={data.orders}
              onConsume={(assignment, quantity, wasteAmount) =>
                void submit(() =>
                  api(`/fabrics/assignments/${assignment.id}/consume`, {
                    quantity,
                    waste: wasteAmount,
                    notes: "Cutting recorded",
                    request_id: request(),
                  }),
                )
              }
              onRelease={(assignment, quantity) =>
                void submit(() =>
                  api(`/fabrics/assignments/${assignment.id}/release`, {
                    quantity,
                    notes: "Unused reservation released",
                    request_id: request(),
                  }),
                )
              }
            />
          </section>
        )}
        {view === "Ledger" && (
          <section className="card">
            <div className="list-toolbar">
              <div>
                <h3>{t("Fabric transaction ledger")}</h3>
                <p>{t(pageDescriptions.Ledger)}</p>
              </div>
            </div>
            <FabricLedger
              transactions={fabrics.transactions
                .slice()
                .sort((a, b) => b.created.localeCompare(a.created))}
              lots={fabrics.lots}
              catalog={catalogById}
            />
          </section>
        )}
      </div>
    </div>
  );
}

function LotTable({
  lots,
  catalog,
  customer,
  onReturn,
}: {
  lots: FabricLot[];
  catalog: Map<string, any>;
  customer: (id: string | null) => string;
  onReturn?: (lot: FabricLot, quantity: number) => void;
}) {
  return lots.length ? (
    <div className="table-wrap" tabIndex={0}>
      <table>
        <thead>
          <tr>
            <th>{t("Fabric lot")}</th>
            <th>{t("Owner")}</th>
            <th>{t("Available")}</th>
            <th>{t("Reserved")}</th>
            <th>{t("Used")}</th>
            <th>{t("Received")}</th>
            {onReturn && <th>{t("Actions")}</th>}
          </tr>
        </thead>
        <tbody>
          {lots.map((l) => (
            <tr key={l.id}>
              <td>
                <strong>
                  {catalog.get(l.catalog_id)?.name || l.catalog_id}
                </strong>
                <small>
                  {catalog.get(l.catalog_id)?.code} ·{" "}
                  {catalog.get(l.catalog_id)?.color}
                </small>
              </td>
              <td>
                {l.owner_type === "Customer"
                  ? customer(l.customer_id)
                  : t("Shop")}
              </td>
              <td>
                <strong>
                  {formatNumber(l.quantity_available)} {t(l.unit)}
                </strong>
              </td>
              <td>
                {formatNumber(l.quantity_reserved)} {t(l.unit)}
              </td>
              <td>
                {formatNumber(l.quantity_consumed)} {t(l.unit)}
              </td>
              <td>{formatDate(l.received)}</td>
              {onReturn && (
                <td>
                  <button
                    type="button"
                    className="secondary"
                    disabled={!l.quantity_available}
                    onClick={() => {
                      const value = window.prompt(
                        t("Quantity to return"),
                        String(l.quantity_available),
                      );
                      const quantity = Number(value);
                      if (
                        Number.isInteger(quantity) &&
                        quantity > 0 &&
                        quantity <= l.quantity_available
                      )
                        onReturn(l, quantity);
                    }}
                  >
                    <Undo2 size={15} />
                    {t("Return")}
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ) : (
    <div className="fabric-empty">
      <Factory size={28} />
      <h3>{t("No fabric lots yet")}</h3>
      <p>
        {t("Receive shop or customer fabric to start its traceable ledger.")}
      </p>
    </div>
  );
}

function AssignmentTable({
  assignments,
  lots,
  catalog,
  orders,
  onConsume,
  onRelease,
}: {
  assignments: FabricAssignment[];
  lots: FabricLot[];
  catalog: Map<string, any>;
  orders: Order[];
  onConsume: (
    assignment: FabricAssignment,
    quantity: number,
    waste: number,
  ) => void;
  onRelease: (assignment: FabricAssignment, quantity: number) => void;
}) {
  return assignments.length ? (
    <div className="table-wrap" tabIndex={0}>
      <table>
        <thead>
          <tr>
            <th>{t("Order")}</th>
            <th>{t("Fabric")}</th>
            <th>{t("Reserved")}</th>
            <th>{t("Consumed")}</th>
            <th>{t("Waste")}</th>
            <th>{t("Status")}</th>
            <th>{t("Actions")}</th>
          </tr>
        </thead>
        <tbody>
          {assignments.map((a) => {
            const lot = lots.find((l) => l.id === a.lot_id);
            const o = orders.find((x) => x.id === a.order_id);
            const remaining =
              a.quantity_reserved -
              a.quantity_consumed -
              a.quantity_wasted -
              a.quantity_released;
            return (
              <tr key={a.id}>
                <td>
                  <strong dir="ltr">
                    {o
                      ? `TMS-${String(o.number).padStart(4, "0")}`
                      : a.order_id}
                  </strong>
                  <small>{o?.due}</small>
                </td>
                <td>
                  {catalog.get(lot?.catalog_id || "")?.name || lot?.catalog_id}
                </td>
                <td>
                  {formatNumber(a.quantity_reserved)} {t(lot?.unit || "meter")}
                </td>
                <td>{formatNumber(a.quantity_consumed)}</td>
                <td>{formatNumber(a.quantity_wasted)}</td>
                <td>
                  <span className="badge">{t(a.status)}</span>
                </td>
                <td>
                  <div className="fabric-row-actions">
                    {remaining > 0 && (
                      <>
                        <button
                          type="button"
                          className="secondary"
                          onClick={() => {
                            const value = window.prompt(
                              t("Quantity used"),
                              String(remaining),
                            );
                            const quantity = Number(value);
                            if (
                              !Number.isInteger(quantity) ||
                              quantity <= 0 ||
                              quantity > remaining
                            )
                              return;
                            const wasteValue = window.prompt(
                              t("Waste quantity"),
                              "0",
                            );
                            const waste = Number(wasteValue);
                            if (
                              Number.isInteger(waste) &&
                              waste >= 0 &&
                              quantity + waste <= remaining
                            )
                              onConsume(a, quantity, waste);
                          }}
                        >
                          <ArrowDownToLine size={15} />
                          {t("Record use")}
                        </button>
                        <button
                          type="button"
                          className="secondary"
                          onClick={() => {
                            const value = window.prompt(
                              t("Quantity to release"),
                              String(remaining),
                            );
                            const quantity = Number(value);
                            if (
                              Number.isInteger(quantity) &&
                              quantity > 0 &&
                              quantity <= remaining
                            )
                              onRelease(a, quantity);
                          }}
                        >
                          <Undo2 size={15} />
                          {t("Release")}
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  ) : (
    <div className="fabric-empty">
      <Send size={28} />
      <h3>{t("No fabric assignments yet")}</h3>
      <p>
        {t(
          "Assignments connect a fabric lot to a tailoring order before cutting.",
        )}
      </p>
    </div>
  );
}

function FabricLedger({
  transactions,
  lots,
  catalog,
}: {
  transactions: FabricTransaction[];
  lots: FabricLot[];
  catalog: Map<string, any>;
}) {
  if (!transactions.length) {
    return (
      <div className="fabric-empty">
        <ClipboardList size={28} />
        <h3>{t("No fabric transactions yet")}</h3>
        <p>
          {t(
            "The ledger will show every movement after the first lot is received.",
          )}
        </p>
      </div>
    );
  }

  return (
    <div className="fabric-ledger" role="list">
      {transactions.map((tx) => {
        const lot = lots.find((item) => item.id === tx.lot_id);
        const fabricName =
          catalog.get(lot?.catalog_id || "")?.name || lot?.catalog_id || "";
        return (
          <div className="fabric-ledger-row" role="listitem" key={tx.id}>
            <span
              className={`fabric-ledger-icon ${tx.type}`}
              aria-hidden="true"
            >
              <Recycle size={18} strokeWidth={1.8} />
            </span>
            <div className="fabric-ledger-details">
              <div className="fabric-ledger-primary">
                <strong className="fabric-ledger-type">{t(tx.type)}</strong>
                {fabricName && (
                  <span className="fabric-ledger-fabric">{fabricName}</span>
                )}
              </div>
              <time className="fabric-ledger-date" dateTime={tx.created}>
                {formatDate(tx.created)}
              </time>
            </div>
            <strong className="fabric-ledger-amount">
              <span>{formatNumber(tx.quantity)}</span>
              <small>{t(tx.unit)}</small>
            </strong>
          </div>
        );
      })}
    </div>
  );
}
