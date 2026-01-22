import psycopg
from psycopg.rows import dict_row
from psycopg_pool import AsyncConnectionPool
from contextlib import asynccontextmanager
from app.config import settings


# Database connection pool
conn_pool = None


async def init_db():
    """Initialize database connection pool"""
    global conn_pool
    conn_pool = AsyncConnectionPool(
        settings.database_url,
        min_size=1,
        max_size=10
    )
    await conn_pool.wait()


async def close_db():
    """Close database connection pool"""
    global conn_pool
    if conn_pool:
        await conn_pool.close()


@asynccontextmanager
async def get_db():
    """Get database connection from pool"""
    if conn_pool is None:
        raise RuntimeError("Database connection pool not initialized. Call init_db() first.")
    async with conn_pool.connection() as conn:
        async with conn.cursor(row_factory=dict_row) as cur:
            yield cur
