"""Initial single-shop schema, frozen at revision 0001."""
from alembic import op
revision = '0001'
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    op.execute('CREATE TABLE customers (\n\tid VARCHAR NOT NULL, \n\tname VARCHAR NOT NULL, \n\tphone VARCHAR NOT NULL, \n\tnotes TEXT NOT NULL, \n\tcreated VARCHAR NOT NULL, \n\tPRIMARY KEY (id)\n)')
    op.execute('CREATE TABLE settings (\n\tid INTEGER NOT NULL, \n\tvalue TEXT NOT NULL, \n\tPRIMARY KEY (id)\n)')
    op.execute('CREATE TABLE orders (\n\tid VARCHAR NOT NULL, \n\tnumber INTEGER NOT NULL, \n\tcustomer_id VARCHAR NOT NULL, \n\tordered VARCHAR NOT NULL, \n\tdue VARCHAR NOT NULL, \n\tstatus VARCHAR NOT NULL, \n\tdelivered VARCHAR, \n\tinstructions TEXT NOT NULL, \n\ttotal INTEGER NOT NULL, \n\trequest_id VARCHAR NOT NULL, \n\tPRIMARY KEY (id), \n\tUNIQUE (number), \n\tFOREIGN KEY(customer_id) REFERENCES customers (id), \n\tUNIQUE (request_id)\n)')
    op.execute('CREATE TABLE profiles (\n\tid VARCHAR NOT NULL, \n\tcustomer_id VARCHAR NOT NULL, \n\tname VARCHAR NOT NULL, \n\tkind VARCHAR NOT NULL, \n\tunit VARCHAR NOT NULL, \n\tvalues_json TEXT NOT NULL, \n\tnotes TEXT NOT NULL, \n\tversion INTEGER NOT NULL, \n\tupdated VARCHAR NOT NULL, \n\tPRIMARY KEY (id), \n\tFOREIGN KEY(customer_id) REFERENCES customers (id)\n)')
    op.execute('CREATE TABLE measurement_versions (\n\tid VARCHAR NOT NULL, \n\tprofile_id VARCHAR NOT NULL, \n\tsnapshot TEXT NOT NULL, \n\tcreated VARCHAR NOT NULL, \n\tPRIMARY KEY (id), \n\tFOREIGN KEY(profile_id) REFERENCES profiles (id)\n)')
    op.execute('CREATE TABLE order_items (\n\tid VARCHAR NOT NULL, \n\torder_id VARCHAR NOT NULL, \n\tkind VARCHAR NOT NULL, \n\tquantity INTEGER NOT NULL, \n\tprice INTEGER NOT NULL, \n\tsnapshot TEXT, \n\tinstructions TEXT NOT NULL, \n\tPRIMARY KEY (id), \n\tFOREIGN KEY(order_id) REFERENCES orders (id)\n)')
    op.execute('CREATE TABLE payments (\n\tid VARCHAR NOT NULL, \n\torder_id VARCHAR NOT NULL, \n\tamount INTEGER NOT NULL, \n\tcreated VARCHAR NOT NULL, \n\tmethod VARCHAR NOT NULL, \n\trequest_id VARCHAR NOT NULL, \n\treverses VARCHAR, \n\treason TEXT NOT NULL, \n\tPRIMARY KEY (id), \n\tFOREIGN KEY(order_id) REFERENCES orders (id), \n\tUNIQUE (request_id), \n\tUNIQUE (reverses), \n\tFOREIGN KEY(reverses) REFERENCES payments (id)\n)')
    op.execute('CREATE TABLE status_history (\n\tid VARCHAR NOT NULL, \n\torder_id VARCHAR NOT NULL, \n\tstatus VARCHAR NOT NULL, \n\tcreated VARCHAR NOT NULL, \n\tPRIMARY KEY (id), \n\tFOREIGN KEY(order_id) REFERENCES orders (id)\n)')

def downgrade():
    raise RuntimeError("Destructive downgrade disabled. Restore a backup instead.")
