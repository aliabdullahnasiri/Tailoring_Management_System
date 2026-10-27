from alembic import context
from sqlalchemy import engine_from_config, pool
from app import meta
config=context.config
with engine_from_config(config.get_section(config.config_ini_section),prefix='sqlalchemy.',poolclass=pool.NullPool).connect() as connection:
    context.configure(connection=connection,target_metadata=meta,render_as_batch=True)
    with context.begin_transaction():context.run_migrations()
