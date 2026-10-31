from __future__ import annotations

import json
import os
import sqlite3
import sys
import tempfile
import threading
import uuid
from contextlib import asynccontextmanager, closing
from datetime import date, datetime, timezone
from pathlib import Path
from typing import Literal
from urllib.parse import urlparse

from alembic import command
from alembic.config import Config
from auth import install as install_auth
from fastapi import FastAPI, HTTPException, Request, UploadFile
from fastapi.responses import FileResponse, JSONResponse, Response
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, ConfigDict, Field, model_validator
from sqlalchemy import (
    Column,
    ForeignKey,
    Integer,
    MetaData,
    String,
    Table,
    Text,
    create_engine,
    event,
    select,
)

ROOT = Path(__file__).resolve().parent
DATA = Path(
    os.environ.get(
        "TMS_DATA_DIR",
        str(
            Path(os.getenv("LOCALAPPDATA", Path.home() / ".local/share"))
            / "TailoringMS"
        ),
    )
).resolve()
DATA.mkdir(parents=True, exist_ok=True)
DB = DATA / "tailoring.db"
engine = create_engine(
    "sqlite:///" + str(DB), connect_args={"check_same_thread": False}
)


@event.listens_for(engine, "connect")
def configure(db, _):
    db.execute("PRAGMA foreign_keys=ON")
    db.execute("PRAGMA busy_timeout=10000")


meta = MetaData()
customers = Table(
    "customers",
    meta,
    Column("id", String, primary_key=True),
    Column("name", String, nullable=False),
    Column("phone", String, nullable=False),
    Column("notes", Text, nullable=False),
    Column("created", String, nullable=False),
)
profiles = Table(
    "profiles",
    meta,
    Column("id", String, primary_key=True),
    Column("customer_id", ForeignKey("customers.id"), nullable=False),
    Column("name", String, nullable=False),
    Column("kind", String, nullable=False),
    Column("unit", String, nullable=False),
    Column("values_json", Text, nullable=False),
    Column("notes", Text, nullable=False),
    Column("version", Integer, nullable=False),
    Column("updated", String, nullable=False),
)
versions = Table(
    "measurement_versions",
    meta,
    Column("id", String, primary_key=True),
    Column("profile_id", ForeignKey("profiles.id"), nullable=False),
    Column("snapshot", Text, nullable=False),
    Column("created", String, nullable=False),
)
orders = Table(
    "orders",
    meta,
    Column("id", String, primary_key=True),
    Column("number", Integer, unique=True, nullable=False),
    Column("customer_id", ForeignKey("customers.id"), nullable=False),
    Column("ordered", String, nullable=False),
    Column("due", String, nullable=False),
    Column("status", String, nullable=False),
    Column("delivered", String),
    Column("instructions", Text, nullable=False),
    Column("total", Integer, nullable=False),
    Column("request_id", String, unique=True, nullable=False),
)
items = Table(
    "order_items",
    meta,
    Column("id", String, primary_key=True),
    Column("order_id", ForeignKey("orders.id"), nullable=False),
    Column("kind", String, nullable=False),
    Column("quantity", Integer, nullable=False),
    Column("price", Integer, nullable=False),
    Column("snapshot", Text),
    Column("instructions", Text, nullable=False),
)
payments = Table(
    "payments",
    meta,
    Column("id", String, primary_key=True),
    Column("order_id", ForeignKey("orders.id"), nullable=False),
    Column("amount", Integer, nullable=False),
    Column("created", String, nullable=False),
    Column("method", String, nullable=False),
    Column("request_id", String, unique=True, nullable=False),
    Column("reverses", ForeignKey("payments.id"), unique=True),
    Column("reason", Text, nullable=False),
)
history = Table(
    "status_history",
    meta,
    Column("id", String, primary_key=True),
    Column("order_id", ForeignKey("orders.id"), nullable=False),
    Column("status", String, nullable=False),
    Column("created", String, nullable=False),
)
settings = Table(
    "settings",
    meta,
    Column("id", Integer, primary_key=True),
    Column("value", Text, nullable=False),
)
fabric_catalog = Table(
    "fabric_catalog", meta,
    Column("id", String, primary_key=True),
    Column("code", String, unique=True, nullable=False),
    Column("name", String, nullable=False),
    Column("fabric_type", String, nullable=False),
    Column("color", String, nullable=False),
    Column("quality", String, nullable=False),
    Column("unit", String, nullable=False),
    Column("default_purchase_cost", Integer, nullable=False),
    Column("default_selling_price", Integer, nullable=False),
    Column("notes", Text, nullable=False),
    Column("created", String, nullable=False),
)
fabric_lots = Table(
    "fabric_lots", meta,
    Column("id", String, primary_key=True),
    Column("catalog_id", ForeignKey("fabric_catalog.id"), nullable=False),
    Column("owner_type", String, nullable=False),
    Column("customer_id", ForeignKey("customers.id")),
    Column("supplier", String, nullable=False),
    Column("received", String, nullable=False),
    Column("quantity_received", Integer, nullable=False),
    Column("quantity_available", Integer, nullable=False),
    Column("quantity_reserved", Integer, nullable=False),
    Column("quantity_consumed", Integer, nullable=False),
    Column("quantity_wasted", Integer, nullable=False),
    Column("quantity_returned", Integer, nullable=False),
    Column("unit", String, nullable=False),
    Column("purchase_cost", Integer, nullable=False),
    Column("selling_price", Integer, nullable=False),
    Column("notes", Text, nullable=False),
)
fabric_assignments = Table(
    "fabric_assignments", meta,
    Column("id", String, primary_key=True),
    Column("lot_id", ForeignKey("fabric_lots.id"), nullable=False),
    Column("order_id", ForeignKey("orders.id"), nullable=False),
    Column("quantity_reserved", Integer, nullable=False),
    Column("quantity_consumed", Integer, nullable=False),
    Column("quantity_wasted", Integer, nullable=False),
    Column("quantity_released", Integer, nullable=False),
    Column("status", String, nullable=False),
    Column("notes", Text, nullable=False),
    Column("created", String, nullable=False),
)
fabric_transactions = Table(
    "fabric_transactions", meta,
    Column("id", String, primary_key=True),
    Column("lot_id", ForeignKey("fabric_lots.id"), nullable=False),
    Column("assignment_id", ForeignKey("fabric_assignments.id")),
    Column("order_id", ForeignKey("orders.id")),
    Column("customer_id", ForeignKey("customers.id")),
    Column("type", String, nullable=False),
    Column("quantity", Integer, nullable=False),
    Column("unit", String, nullable=False),
    Column("created", String, nullable=False),
    Column("request_id", String, unique=True, nullable=False),
    Column("notes", Text, nullable=False),
)
lock = threading.RLock()


def uid():
    return str(uuid.uuid4())


def now():
    return datetime.now(timezone.utc).isoformat()


def rows(c, table):
    return [dict(r) for r in c.execute(select(table)).mappings()]


def get(c, t, key):
    r = c.execute(select(t).where(t.c.id == key)).mappings().first()
    if not r:
        raise HTTPException(404, "Record not found.")
    return dict(r)


def profile_out(p):
    p = dict(p)
    p["values"] = json.loads(p.pop("values_json"))
    return p


def migrate():
    cfg = Config(str(ROOT / "alembic.ini"))
    cfg.set_main_option("script_location", str(ROOT / "migrations"))
    cfg.set_main_option("sqlalchemy.url", "sqlite:///" + str(DB).replace("%", "%%"))
    command.upgrade(cfg, "head")
    with engine.begin() as c:
        if not c.execute(select(settings)).first():
            c.execute(
                settings.insert().values(
                    id=1,
                    value=json.dumps(
                        {
                            "name": "My tailoring shop",
                            "phone": "",
                            "address": "",
                            "language": "en",
                            "receipt_width": "a4",
                        }
                    ),
                )
            )


@asynccontextmanager
async def lifespan(app):
    migrate()
    yield
    engine.dispose()


app = FastAPI(
    title="Tailoring Management System",
    lifespan=lifespan,
    docs_url=None,
    redoc_url=None,
    openapi_url=None,
)
install_auth(app, DATA)


@app.middleware("http")
async def local_only(request: Request, call_next):
    host = request.headers.get("host", "").split(":")[0]
    if host not in (
        "127.0.0.1",
        "localhost",
        "testserver",
        urlparse(os.getenv("TMS_PUBLIC_ORIGIN", "")).hostname,
    ):
        return JSONResponse({"detail": "Local access only."}, 403)
    origin = request.headers.get("origin")
    if (
        request.method not in ("GET", "HEAD", "OPTIONS")
        and origin
        and origin
        not in (
            "http://127.0.0.1:8000",
            "http://localhost:8000",
            "http://127.0.0.1:5173",
            "http://localhost:5173",
            getattr(request.app.state, "desktop_origin", None),
            os.getenv("TMS_PUBLIC_ORIGIN", "").rstrip("/"),
        )
    ):
        return JSONResponse({"detail": "Origin not allowed."}, 403)
    if (
        request.method not in ("GET", "HEAD", "OPTIONS")
        and request.headers.get("sec-fetch-site") == "cross-site"
    ):
        return JSONResponse({"detail": "Origin not allowed."}, 403)
    return await call_next(request)


class Strict(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)


class CustomerIn(Strict):
    name: str = Field(min_length=1, max_length=120)
    phone: str = Field(default="", max_length=30)
    notes: str = Field(default="", max_length=2000)


Kind = Literal["Shalwar Kameez", "Dress", "Suit", "Alteration"]
FIELDS = {
    "Shalwar Kameez": [
        "Chest",
        "Shoulder",
        "Sleeve length",
        "Shirt length",
        "Waist",
        "Hip",
        "Trouser length",
        "Neck",
    ],
    "Dress": [
        "Bust",
        "Shoulder",
        "Sleeve length",
        "Waist",
        "Hip",
        "Dress length",
        "Neck",
    ],
    "Suit": [
        "Chest",
        "Shoulder",
        "Sleeve length",
        "Jacket length",
        "Waist",
        "Hip",
        "Trouser length",
        "Neck",
    ],
    "Alteration": ["Length", "Waist"],
}


class ProfileIn(Strict):
    customer_id: str
    name: str = Field(min_length=1, max_length=120)
    kind: Kind
    unit: Literal["in", "cm"] = "in"
    values: dict[str, float]
    notes: str = Field(default="", max_length=2000)

    @model_validator(mode="after")
    def valid_values(self):
        if not self.values or any(
            k not in FIELDS[self.kind] or not (0 < v <= 500)
            for k, v in self.values.items()
        ):
            raise ValueError(
                "Enter valid measurements greater than zero, up to 500, for this clothing type."
            )
        return self


class ItemIn(Strict):
    kind: Kind
    quantity: int = Field(ge=1, le=1000, strict=True)
    price: int = Field(ge=0, le=10000000, strict=True)
    profile_id: str | None = None
    instructions: str = Field(default="", max_length=2000)


class OrderIn(Strict):
    customer_id: str
    due: date
    items: list[ItemIn] = Field(min_length=1, max_length=50)
    instructions: str = Field(default="", max_length=2000)
    advance: int = Field(default=0, ge=0, strict=True)
    request_id: str = Field(min_length=10, max_length=100)


class PaymentIn(Strict):
    order_id: str
    amount: int = Field(gt=0, le=100000000, strict=True)
    method: Literal["Cash", "Bank transfer"] = "Cash"
    request_id: str = Field(min_length=10, max_length=100)


class ReversalIn(Strict):
    reason: str = Field(min_length=3, max_length=500)


class StatusIn(Strict):
    status: Literal["Pending", "In progress", "Ready", "Delivered"]


class SettingsIn(Strict):
    name: str = Field(min_length=1, max_length=120)
    phone: str = Field(default="", max_length=30)
    address: str = Field(default="", max_length=300)
    language: Literal["en", "fa", "ps"] = "en"
    receipt_width: Literal["a4", "a5", "80mm"] = "a4"
    # Accepted for compatibility with older backups; paper size now controls printing.
    print_measurements: bool = False


FabricOwner = Literal["Shop", "Customer"]
FabricUnit = Literal["meter", "yard", "gaz", "piece"]


class FabricCatalogIn(Strict):
    code: str = Field(min_length=1, max_length=40)
    name: str = Field(min_length=1, max_length=120)
    fabric_type: str = Field(min_length=1, max_length=80)
    color: str = Field(default="", max_length=60)
    quality: str = Field(default="", max_length=80)
    unit: FabricUnit = "meter"
    default_purchase_cost: int = Field(default=0, ge=0, le=100000000, strict=True)
    default_selling_price: int = Field(default=0, ge=0, le=100000000, strict=True)
    notes: str = Field(default="", max_length=2000)


class FabricLotIn(Strict):
    catalog_id: str
    owner_type: FabricOwner
    customer_id: str | None = None
    supplier: str = Field(default="", max_length=120)
    quantity: int = Field(gt=0, le=1000000, strict=True)
    unit: FabricUnit | None = None
    purchase_cost: int | None = Field(default=None, ge=0, le=100000000, strict=True)
    selling_price: int | None = Field(default=None, ge=0, le=100000000, strict=True)
    notes: str = Field(default="", max_length=2000)
    request_id: str = Field(min_length=10, max_length=100)


class FabricAssignmentIn(Strict):
    lot_id: str
    order_id: str
    quantity: int = Field(gt=0, le=1000000, strict=True)
    notes: str = Field(default="", max_length=2000)
    request_id: str = Field(min_length=10, max_length=100)


class FabricConsumptionIn(Strict):
    quantity: int = Field(gt=0, le=1000000, strict=True)
    waste: int = Field(default=0, ge=0, le=1000000, strict=True)
    notes: str = Field(default="", max_length=2000)
    request_id: str = Field(min_length=10, max_length=100)


class FabricReturnIn(Strict):
    quantity: int = Field(gt=0, le=1000000, strict=True)
    notes: str = Field(default="", max_length=2000)
    request_id: str = Field(min_length=10, max_length=100)


class FabricReleaseIn(Strict):
    quantity: int = Field(gt=0, le=1000000, strict=True)
    notes: str = Field(default="", max_length=2000)
    request_id: str = Field(min_length=10, max_length=100)


def paid(c, order_id):
    return sum(
        r.amount
        for r in c.execute(
            select(payments.c.amount).where(payments.c.order_id == order_id)
        )
    )


@app.get("/api/state")
def state():
    with lock, engine.connect() as c:
        oo = rows(c, orders)
        pp = rows(c, payments)
        for o in oo:
            o["paid"] = sum(p["amount"] for p in pp if p["order_id"] == o["id"])
            o["balance"] = o["total"] - o["paid"]
        ii = rows(c, items)
        for i in ii:
            i["snapshot"] = json.loads(i["snapshot"]) if i["snapshot"] else None
        return {
            "customers": rows(c, customers),
            "profiles": [profile_out(p) for p in rows(c, profiles)],
            "orders": oo,
            "items": ii,
            "payments": pp,
            "history": rows(c, history),
            "settings": json.loads(get(c, settings, 1)["value"]),
            "fields": FIELDS,
            "fabrics": {
                "catalog": rows(c, fabric_catalog),
                "lots": rows(c, fabric_lots),
                "assignments": rows(c, fabric_assignments),
                "transactions": rows(c, fabric_transactions),
            },
        }


@app.post("/api/customers")
def create_customer(x: CustomerIn):
    with lock, engine.begin() as c:
        p = dict(id=uid(), created=now(), **x.model_dump())
        c.execute(customers.insert().values(**p))
        return p


@app.put("/api/customers/{id}")
def update_customer(id: str, x: CustomerIn):
    with lock, engine.begin() as c:
        get(c, customers, id)
        c.execute(
            customers.update().where(customers.c.id == id).values(**x.model_dump())
        )
        return {"ok": True}


@app.post("/api/profiles")
def create_profile(x: ProfileIn):
    with lock, engine.begin() as c:
        get(c, customers, x.customer_id)
        d = x.model_dump()
        d["values_json"] = json.dumps(d.pop("values"))
        d.update(id=uid(), version=1, updated=now())
        c.execute(profiles.insert().values(**d))
        return profile_out(d)


@app.put("/api/profiles/{id}")
def update_profile(id: str, x: ProfileIn):
    with lock, engine.begin() as c:
        p = get(c, profiles, id)
        if x.customer_id != p["customer_id"]:
            raise HTTPException(
                400, "Cannot move a measurement profile to another customer."
            )
        c.execute(
            versions.insert().values(
                id=uid(),
                profile_id=id,
                snapshot=json.dumps(profile_out(p)),
                created=now(),
            )
        )
        d = x.model_dump()
        d["values_json"] = json.dumps(d.pop("values"))
        d.update(version=p["version"] + 1, updated=now())
        c.execute(profiles.update().where(profiles.c.id == id).values(**d))
        return {"ok": True}


@app.get("/api/profiles/{id}/versions")
def profile_versions(id: str):
    with lock, engine.connect() as c:
        get(c, profiles, id)
        return [
            json.loads(r.snapshot)
            for r in c.execute(select(versions).where(versions.c.profile_id == id))
        ]


@app.post("/api/orders")
def create_order(x: OrderIn):
    with lock, engine.begin() as c:
        existing = (
            c.execute(select(orders).where(orders.c.request_id == x.request_id))
            .mappings()
            .first()
        )
        if existing:
            return dict(existing)
        get(c, customers, x.customer_id)
        if x.due < date.today():
            raise HTTPException(400, "Delivery date cannot be before today.")
        total = sum(i.quantity * i.price for i in x.items)
        if total <= 0 or total > 100000000 or x.advance > total:
            raise HTTPException(
                400, "Order total must be positive and advance must not exceed total."
            )
        number = max([o["number"] for o in rows(c, orders)], default=0) + 1
        o = dict(
            id=uid(),
            number=number,
            customer_id=x.customer_id,
            ordered=date.today().isoformat(),
            due=x.due.isoformat(),
            status="Pending",
            delivered=None,
            instructions=x.instructions,
            total=total,
            request_id=x.request_id,
        )
        c.execute(orders.insert().values(**o))
        for i in x.items:
            snapshot = None
            if i.profile_id:
                p = get(c, profiles, i.profile_id)
                if p["customer_id"] != x.customer_id or p["kind"] != i.kind:
                    raise HTTPException(
                        400,
                        "Measurement profile must match customer and clothing type.",
                    )
                snapshot = json.dumps(profile_out(p))
            c.execute(
                items.insert().values(
                    id=uid(),
                    order_id=o["id"],
                    kind=i.kind,
                    quantity=i.quantity,
                    price=i.price,
                    snapshot=snapshot,
                    instructions=i.instructions,
                )
            )
        c.execute(
            history.insert().values(
                id=uid(), order_id=o["id"], status="Pending", created=now()
            )
        )
        if x.advance:
            c.execute(
                payments.insert().values(
                    id=uid(),
                    order_id=o["id"],
                    amount=x.advance,
                    created=now(),
                    method="Cash",
                    request_id="advance:" + o["id"],
                    reason="",
                    reverses=None,
                )
            )
        return o


@app.put("/api/orders/{id}/status")
def set_status(id: str, x: StatusIn):
    with lock, engine.begin() as c:
        o = get(c, orders, id)
        if o["status"] == x.status:
            return {"ok": True}
        c.execute(
            orders.update()
            .where(orders.c.id == id)
            .values(
                status=x.status, delivered=now() if x.status == "Delivered" else None
            )
        )
        c.execute(
            history.insert().values(
                id=uid(), order_id=id, status=x.status, created=now()
            )
        )
        return {"ok": True}


@app.post("/api/payments")
def create_payment(x: PaymentIn):
    with lock, engine.begin() as c:
        previous = (
            c.execute(select(payments).where(payments.c.request_id == x.request_id))
            .mappings()
            .first()
        )
        if previous:
            if (
                previous["order_id"] != x.order_id
                or previous["amount"] != x.amount
                or previous["method"] != x.method
            ):
                raise HTTPException(
                    409, "This payment request was already used with different details."
                )
            return dict(previous)
        o = get(c, orders, x.order_id)
        if x.amount > o["total"] - paid(c, o["id"]):
            raise HTTPException(400, "Payment exceeds the remaining balance.")
        p = dict(id=uid(), created=now(), reverses=None, reason="", **x.model_dump())
        c.execute(payments.insert().values(**p))
        return p


@app.post("/api/payments/{id}/reverse")
def reverse_payment(id: str, x: ReversalIn):
    with lock, engine.begin() as c:
        p = get(c, payments, id)
        if (
            p["amount"] <= 0
            or c.execute(select(payments).where(payments.c.reverses == id)).first()
        ):
            raise HTTPException(400, "Payment is already reversed or is a reversal.")
        d = dict(
            id=uid(),
            order_id=p["order_id"],
            amount=-p["amount"],
            created=now(),
            method=p["method"],
            request_id="reverse:" + id,
            reverses=id,
            reason=x.reason,
        )
        c.execute(payments.insert().values(**d))
        return d


@app.get("/api/fabrics/state")
def fabric_state():
    with lock, engine.connect() as c:
        return {
            "catalog": rows(c, fabric_catalog),
            "lots": rows(c, fabric_lots),
            "assignments": rows(c, fabric_assignments),
            "transactions": rows(c, fabric_transactions),
        }


@app.post("/api/fabrics/catalog")
def create_fabric_catalog(x: FabricCatalogIn):
    with lock, engine.begin() as c:
        if c.execute(select(fabric_catalog).where(fabric_catalog.c.code == x.code)).first():
            raise HTTPException(409, "A fabric code with this value already exists.")
        d = dict(id=uid(), created=now(), **x.model_dump())
        c.execute(fabric_catalog.insert().values(**d))
        return d


@app.post("/api/fabrics/lots")
def receive_fabric(x: FabricLotIn):
    with lock, engine.begin() as c:
        catalog = get(c, fabric_catalog, x.catalog_id)
        if x.owner_type == "Customer":
            if not x.customer_id:
                raise HTTPException(400, "Choose the customer who owns this fabric.")
            get(c, customers, x.customer_id)
        elif x.customer_id:
            raise HTTPException(400, "Shop-owned fabric cannot be linked to a customer.")
        existing = c.execute(select(fabric_transactions).where(fabric_transactions.c.request_id == x.request_id)).mappings().first()
        if existing:
            if (
                existing["type"] != "received"
                or existing["quantity"] != x.quantity
                or existing["customer_id"] != x.customer_id
            ):
                raise HTTPException(409, "This fabric request was already used with different details.")
            return get(c, fabric_lots, existing["lot_id"])
        d = dict(
            id=uid(), catalog_id=x.catalog_id, owner_type=x.owner_type,
            customer_id=x.customer_id, supplier=x.supplier, received=now(),
            quantity_received=x.quantity, quantity_available=x.quantity,
            quantity_reserved=0, quantity_consumed=0, quantity_wasted=0,
            quantity_returned=0, unit=x.unit or catalog["unit"],
            purchase_cost=catalog["default_purchase_cost"] if x.purchase_cost is None else x.purchase_cost,
            selling_price=catalog["default_selling_price"] if x.selling_price is None else x.selling_price,
            notes=x.notes,
        )
        c.execute(fabric_lots.insert().values(**d))
        c.execute(fabric_transactions.insert().values(
            id=uid(), lot_id=d["id"], assignment_id=None, order_id=None,
            customer_id=d["customer_id"], type="received", quantity=x.quantity,
            unit=d["unit"], created=d["received"], request_id=x.request_id,
            notes=x.notes,
        ))
        return d


@app.post("/api/fabrics/assignments")
def assign_fabric(x: FabricAssignmentIn):
    with lock, engine.begin() as c:
        existing = c.execute(select(fabric_transactions).where(fabric_transactions.c.request_id == x.request_id)).mappings().first()
        if existing:
            if (
                existing["type"] != "reserved"
                or existing["lot_id"] != x.lot_id
                or existing["order_id"] != x.order_id
                or existing["quantity"] != x.quantity
            ):
                raise HTTPException(409, "This fabric request was already used with different details.")
            return get(c, fabric_assignments, existing["assignment_id"])
        lot = get(c, fabric_lots, x.lot_id)
        order = get(c, orders, x.order_id)
        if lot["owner_type"] == "Customer" and lot["customer_id"] != order["customer_id"]:
            raise HTTPException(400, "Customer-owned fabric must be assigned to that customer's order.")
        if x.quantity > lot["quantity_available"]:
            raise HTTPException(400, "The requested fabric quantity is not available.")
        assignment = dict(
            id=uid(), lot_id=x.lot_id, order_id=x.order_id,
            quantity_reserved=x.quantity, quantity_consumed=0,
            quantity_wasted=0, quantity_released=0, status="Reserved",
            notes=x.notes, created=now(),
        )
        c.execute(fabric_assignments.insert().values(**assignment))
        c.execute(fabric_lots.update().where(fabric_lots.c.id == x.lot_id).values(
            quantity_available=lot["quantity_available"] - x.quantity,
            quantity_reserved=lot["quantity_reserved"] + x.quantity,
        ))
        c.execute(fabric_transactions.insert().values(
            id=uid(), lot_id=x.lot_id, assignment_id=assignment["id"],
            order_id=x.order_id, customer_id=lot["customer_id"], type="reserved",
            quantity=x.quantity, unit=lot["unit"], created=assignment["created"],
            request_id=x.request_id, notes=x.notes,
        ))
        return assignment


@app.post("/api/fabrics/assignments/{id}/consume")
def consume_fabric(id: str, x: FabricConsumptionIn):
    with lock, engine.begin() as c:
        existing = c.execute(select(fabric_transactions).where(fabric_transactions.c.request_id == x.request_id)).mappings().first()
        if existing:
            waste = c.execute(
                select(fabric_transactions.c.quantity).where(
                    fabric_transactions.c.request_id == x.request_id + ":waste",
                    fabric_transactions.c.type == "waste",
                )
            ).scalar()
            if (
                existing["type"] != "consumed"
                or existing["assignment_id"] != id
                or existing["quantity"] != x.quantity
                or waste != (x.waste or None)
            ):
                raise HTTPException(409, "This fabric request was already used with different details.")
            return get(c, fabric_assignments, id)
        assignment = get(c, fabric_assignments, id)
        remaining = assignment["quantity_reserved"] - assignment["quantity_consumed"] - assignment["quantity_wasted"] - assignment["quantity_released"]
        if x.quantity + x.waste > remaining:
            raise HTTPException(400, "Consumed and wasted fabric cannot exceed the reserved quantity.")
        lot = get(c, fabric_lots, assignment["lot_id"])
        status = "Consumed" if x.quantity + x.waste == remaining else "Partially consumed"
        c.execute(fabric_assignments.update().where(fabric_assignments.c.id == id).values(
            quantity_consumed=assignment["quantity_consumed"] + x.quantity,
            quantity_wasted=assignment["quantity_wasted"] + x.waste,
            status=status,
        ))
        c.execute(fabric_lots.update().where(fabric_lots.c.id == lot["id"]).values(
            quantity_reserved=lot["quantity_reserved"] - x.quantity - x.waste,
            quantity_consumed=lot["quantity_consumed"] + x.quantity,
            quantity_wasted=lot["quantity_wasted"] + x.waste,
        ))
        c.execute(fabric_transactions.insert().values(
            id=uid(), lot_id=lot["id"], assignment_id=id, order_id=assignment["order_id"],
            customer_id=lot["customer_id"], type="consumed", quantity=x.quantity,
            unit=lot["unit"], created=now(), request_id=x.request_id, notes=x.notes,
        ))
        if x.waste:
            c.execute(fabric_transactions.insert().values(
                id=uid(), lot_id=lot["id"], assignment_id=id, order_id=assignment["order_id"],
                customer_id=lot["customer_id"], type="waste", quantity=x.waste,
                unit=lot["unit"], created=now(), request_id=x.request_id + ":waste", notes=x.notes,
            ))
        return get(c, fabric_assignments, id)


@app.post("/api/fabrics/assignments/{id}/release")
def release_fabric(id: str, x: FabricReleaseIn):
    with lock, engine.begin() as c:
        existing = c.execute(select(fabric_transactions).where(fabric_transactions.c.request_id == x.request_id)).mappings().first()
        if existing:
            if (
                existing["type"] != "released"
                or existing["assignment_id"] != id
                or existing["quantity"] != x.quantity
            ):
                raise HTTPException(409, "This fabric request was already used with different details.")
            return get(c, fabric_assignments, id)
        assignment = get(c, fabric_assignments, id)
        remaining = assignment["quantity_reserved"] - assignment["quantity_consumed"] - assignment["quantity_wasted"] - assignment["quantity_released"]
        if x.quantity > remaining:
            raise HTTPException(400, "Released fabric cannot exceed the unconsumed reservation.")
        lot = get(c, fabric_lots, assignment["lot_id"])
        released = assignment["quantity_released"] + x.quantity
        status = "Released" if released + assignment["quantity_consumed"] + assignment["quantity_wasted"] == assignment["quantity_reserved"] else "Partially released"
        c.execute(fabric_assignments.update().where(fabric_assignments.c.id == id).values(
            quantity_released=released, status=status,
        ))
        c.execute(fabric_lots.update().where(fabric_lots.c.id == lot["id"]).values(
            quantity_available=lot["quantity_available"] + x.quantity,
            quantity_reserved=lot["quantity_reserved"] - x.quantity,
        ))
        c.execute(fabric_transactions.insert().values(
            id=uid(), lot_id=lot["id"], assignment_id=id, order_id=assignment["order_id"],
            customer_id=lot["customer_id"], type="released", quantity=x.quantity,
            unit=lot["unit"], created=now(), request_id=x.request_id, notes=x.notes,
        ))
        return get(c, fabric_assignments, id)


@app.post("/api/fabrics/lots/{id}/return")
def return_customer_fabric(id: str, x: FabricReturnIn):
    with lock, engine.begin() as c:
        existing = c.execute(select(fabric_transactions).where(fabric_transactions.c.request_id == x.request_id)).mappings().first()
        if existing:
            if (
                existing["type"] != "returned"
                or existing["lot_id"] != id
                or existing["quantity"] != x.quantity
            ):
                raise HTTPException(409, "This fabric request was already used with different details.")
            return get(c, fabric_lots, id)
        lot = get(c, fabric_lots, id)
        if lot["owner_type"] != "Customer":
            raise HTTPException(400, "Only customer-owned fabric can be returned through this ledger.")
        if x.quantity > lot["quantity_available"]:
            raise HTTPException(400, "Return quantity cannot exceed the available customer fabric.")
        c.execute(fabric_lots.update().where(fabric_lots.c.id == id).values(
            quantity_available=lot["quantity_available"] - x.quantity,
            quantity_returned=lot["quantity_returned"] + x.quantity,
        ))
        c.execute(fabric_transactions.insert().values(
            id=uid(), lot_id=id, assignment_id=None, order_id=None,
            customer_id=lot["customer_id"], type="returned", quantity=x.quantity,
            unit=lot["unit"], created=now(), request_id=x.request_id, notes=x.notes,
        ))
        return get(c, fabric_lots, id)


@app.put("/api/settings")
def set_settings(x: SettingsIn):
    with lock, engine.begin() as c:
        c.execute(
            settings.update()
            .where(settings.c.id == 1)
            .values(value=json.dumps(x.model_dump()))
        )
        return {"ok": True}


@app.get("/api/backup")
def backup():
    with lock, tempfile.TemporaryDirectory() as d:
        target = Path(d) / "backup.db"
        with closing(sqlite3.connect(DB)) as src, closing(sqlite3.connect(target)) as dst:
            src.backup(dst)
        return Response(
            target.read_bytes(),
            media_type="application/octet-stream",
            headers={
                "Content-Disposition": f'attachment; filename="Tailoring-backup-{date.today()}.db"'
            },
        )


@app.post("/api/restore")
def restore(file: UploadFile):
    with lock, tempfile.TemporaryDirectory() as d:
        incoming = Path(d) / "restore.db"
        content = file.file.read(50 * 1024 * 1024 + 1)
        if len(content) > 50 * 1024 * 1024:
            raise HTTPException(400, "Backup exceeds 50 MB.")
        incoming.write_bytes(content)
        try:
            with closing(sqlite3.connect(incoming)) as src:
                if (
                    src.execute("PRAGMA integrity_check").fetchone()[0] != "ok"
                    or src.execute("PRAGMA foreign_key_check").fetchall()
                ):
                    raise ValueError()
                if (
                    src.execute("SELECT version_num FROM alembic_version").fetchone()[0]
                    != "0002"
                ):
                    raise ValueError()
                for t in meta.tables.values():
                    actual = [
                        r[1] for r in src.execute('PRAGMA table_info("' + t.name + '")')
                    ]
                    if actual != [col.name for col in t.columns]:
                        raise ValueError()
                for row in src.execute(
                    "SELECT total, (SELECT COALESCE(SUM(amount),0) FROM payments WHERE order_id=orders.id) FROM orders"
                ):
                    if row[0] <= 0 or row[1] < 0 or row[1] > row[0]:
                        raise ValueError()
                settings_row = src.execute(
                    "SELECT value FROM settings WHERE id=1"
                ).fetchone()
                SettingsIn.model_validate_json(settings_row[0])
                src.row_factory = sqlite3.Row
                for row in src.execute("SELECT * FROM customers"):
                    CustomerIn.model_validate(
                        {k: row[k] for k in ("name", "phone", "notes")}
                    )
                for row in src.execute("SELECT * FROM profiles"):
                    ProfileIn.model_validate(
                        {
                            **{
                                k: row[k]
                                for k in (
                                    "customer_id",
                                    "name",
                                    "kind",
                                    "unit",
                                    "notes",
                                )
                            },
                            "values": json.loads(row["values_json"]),
                        }
                    )
                for row in src.execute("SELECT * FROM orders"):
                    StatusIn(status=row["status"])
                    date.fromisoformat(row["ordered"])
                    date.fromisoformat(row["due"])
                    if row["delivered"]:
                        datetime.fromisoformat(row["delivered"])
                    if (row["status"] == "Delivered") != bool(row["delivered"]):
                        raise ValueError()
                    computed = src.execute(
                        "SELECT SUM(quantity*price) FROM order_items WHERE order_id=?",
                        (row["id"],),
                    ).fetchone()[0]
                    if row["total"] != computed:
                        raise ValueError()
                for row in src.execute("SELECT * FROM order_items"):
                    ItemIn(
                        kind=row["kind"],
                        quantity=row["quantity"],
                        price=row["price"],
                        instructions=row["instructions"],
                    )
                for row in src.execute("SELECT * FROM payments"):
                    datetime.fromisoformat(row["created"])
                    if not isinstance(row["amount"], int) or row["amount"] == 0:
                        raise ValueError()
                    if row["reverses"]:
                        original = src.execute(
                            "SELECT * FROM payments WHERE id=?", (row["reverses"],)
                        ).fetchone()
                        if (
                            not original
                            or original["amount"] <= 0
                            or original["order_id"] != row["order_id"]
                            or original["amount"] != -row["amount"]
                        ):
                            raise ValueError()
                    elif row["amount"] < 0:
                        raise ValueError()
                for row in src.execute("SELECT * FROM fabric_catalog"):
                    FabricCatalogIn.model_validate({
                        "code": row["code"], "name": row["name"],
                        "fabric_type": row["fabric_type"], "color": row["color"],
                        "quality": row["quality"], "unit": row["unit"],
                        "default_purchase_cost": row["default_purchase_cost"],
                        "default_selling_price": row["default_selling_price"],
                        "notes": row["notes"],
                    })
                for row in src.execute("SELECT * FROM fabric_lots"):
                    if row["owner_type"] not in ("Shop", "Customer") or any(
                        row[k] < 0 for k in (
                            "quantity_received", "quantity_available", "quantity_reserved",
                            "quantity_consumed", "quantity_wasted", "quantity_returned",
                        )
                    ) or row["quantity_available"] + row["quantity_reserved"] + row["quantity_consumed"] + row["quantity_wasted"] + row["quantity_returned"] > row["quantity_received"]:
                        raise ValueError()
                    if row["owner_type"] == "Customer" and not row["customer_id"]:
                        raise ValueError()
                for row in src.execute("SELECT * FROM fabric_assignments"):
                    if any(row[k] < 0 for k in ("quantity_reserved", "quantity_consumed", "quantity_wasted", "quantity_released")):
                        raise ValueError()
                for row in src.execute("SELECT * FROM order_items WHERE snapshot IS NOT NULL"):
                    json.loads(row["snapshot"])
                if src.execute(
                    "SELECT name FROM sqlite_master WHERE type IN ('trigger','view')"
                ).fetchall():
                    raise ValueError()
        except Exception:
            raise HTTPException(
                400,
                "Invalid or incompatible TMS backup. Your current data has not changed.",
            )
        engine.dispose()
        safety = DATA / (
            "before-restore-" + datetime.now().strftime("%Y%m%d-%H%M%S-%f") + ".db"
        )
        with closing(sqlite3.connect(DB)) as src, closing(sqlite3.connect(safety)) as dst:
            src.backup(dst)
        with closing(sqlite3.connect(incoming)) as src, closing(sqlite3.connect(DB)) as dst:
            src.backup(dst)
        return {"ok": True, "safety_backup": safety.name}


DIST = (ROOT if getattr(sys, "frozen", False) else ROOT.parent) / "frontend" / "dist"
if DIST.exists():
    app.mount("/", StaticFiles(directory=DIST, html=True), name="frontend")
