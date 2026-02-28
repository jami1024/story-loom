"""
异步数据库配置
"""
import logging

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from collections.abc import AsyncGenerator

from app.core.config import get_settings

logger = logging.getLogger(__name__)


class Base(DeclarativeBase):
    pass


engine = create_async_engine(
    get_settings().DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=3600,
    echo=False,
)

async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """获取数据库会话的依赖注入函数"""
    async with async_session() as session:
        yield session


async def init_db():
    """初始化数据库（创建所有表 + 执行增量迁移）"""
    from app.migration_runner import run_migrations

    # 确保所有 ORM 模型被导入，以便 Base.metadata 能发现它们
    import app.models  # noqa: F401
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        # 对已有表执行增量迁移（添加新列等）
        try:
            await run_migrations(conn)
        except Exception as e:
            logger.error(f"数据库迁移执行失败: {e}")
