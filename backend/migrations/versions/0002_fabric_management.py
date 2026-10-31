"""Add traceable shop and customer fabric inventory."""
from alembic import op

revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None


def upgrade():
    op.execute("""CREATE TABLE fabric_catalog (
        id VARCHAR NOT NULL,
        code VARCHAR NOT NULL,
        name VARCHAR NOT NULL,
        fabric_type VARCHAR NOT NULL,
        color VARCHAR NOT NULL,
        quality VARCHAR NOT NULL,
        unit VARCHAR NOT NULL,
        default_purchase_cost INTEGER NOT NULL,
        default_selling_price INTEGER NOT NULL,
        notes TEXT NOT NULL,
        created VARCHAR NOT NULL,
        PRIMARY KEY (id),
        UNIQUE (code)
    )""")
    op.execute("""CREATE TABLE fabric_lots (
        id VARCHAR NOT NULL,
        catalog_id VARCHAR NOT NULL,
        owner_type VARCHAR NOT NULL,
        customer_id VARCHAR,
        supplier VARCHAR NOT NULL,
        received VARCHAR NOT NULL,
        quantity_received INTEGER NOT NULL,
        quantity_available INTEGER NOT NULL,
        quantity_reserved INTEGER NOT NULL,
        quantity_consumed INTEGER NOT NULL,
        quantity_wasted INTEGER NOT NULL,
        quantity_returned INTEGER NOT NULL,
        unit VARCHAR NOT NULL,
        purchase_cost INTEGER NOT NULL,
        selling_price INTEGER NOT NULL,
        notes TEXT NOT NULL,
        PRIMARY KEY (id),
        FOREIGN KEY(catalog_id) REFERENCES fabric_catalog (id),
        FOREIGN KEY(customer_id) REFERENCES customers (id)
    )""")
    op.execute("""CREATE TABLE fabric_assignments (
        id VARCHAR NOT NULL,
        lot_id VARCHAR NOT NULL,
        order_id VARCHAR NOT NULL,
        quantity_reserved INTEGER NOT NULL,
        quantity_consumed INTEGER NOT NULL,
        quantity_wasted INTEGER NOT NULL,
        quantity_released INTEGER NOT NULL,
        status VARCHAR NOT NULL,
        notes TEXT NOT NULL,
        created VARCHAR NOT NULL,
        PRIMARY KEY (id),
        FOREIGN KEY(lot_id) REFERENCES fabric_lots (id),
        FOREIGN KEY(order_id) REFERENCES orders (id)
    )""")
    op.execute("""CREATE TABLE fabric_transactions (
        id VARCHAR NOT NULL,
        lot_id VARCHAR NOT NULL,
        assignment_id VARCHAR,
        order_id VARCHAR,
        customer_id VARCHAR,
        type VARCHAR NOT NULL,
        quantity INTEGER NOT NULL,
        unit VARCHAR NOT NULL,
        created VARCHAR NOT NULL,
        request_id VARCHAR NOT NULL,
        notes TEXT NOT NULL,
        PRIMARY KEY (id),
        UNIQUE (request_id),
        FOREIGN KEY(lot_id) REFERENCES fabric_lots (id),
        FOREIGN KEY(assignment_id) REFERENCES fabric_assignments (id),
        FOREIGN KEY(order_id) REFERENCES orders (id),
        FOREIGN KEY(customer_id) REFERENCES customers (id)
    )""")


def downgrade():
    raise RuntimeError("Destructive downgrade disabled. Restore a backup instead.")
