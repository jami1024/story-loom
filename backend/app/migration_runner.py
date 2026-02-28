"""
轻量级数据库迁移运行器

在应用启动时自动检查并执行 backend/migrations/ 目录下的编号 SQL 文件。
使用 _migrations 表追踪已执行的迁移，MySQL 不支持 ADD COLUMN IF NOT EXISTS，
因此在执行 ALTER TABLE ADD COLUMN 前先查询 information_schema.COLUMNS 确认列不存在。
"""
import logging
import os
import re

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncConnection

logger = logging.getLogger(__name__)

# 迁移文件所在目录（相对于项目根目录）
MIGRATIONS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "migrations")


async def _ensure_migrations_table(conn: AsyncConnection) -> None:
    """确保 _migrations 追踪表存在"""
    await conn.execute(text("""
        CREATE TABLE IF NOT EXISTS _migrations (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL UNIQUE,
            applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
    """))


async def _get_applied_migrations(conn: AsyncConnection) -> set[str]:
    """获取已应用的迁移名称集合"""
    result = await conn.execute(text("SELECT name FROM _migrations"))
    return {row[0] for row in result.fetchall()}


async def _column_exists(conn: AsyncConnection, table: str, column: str) -> bool:
    """检查某张表的某个列是否已存在（通过 information_schema）"""
    result = await conn.execute(text(
        "SELECT COUNT(*) FROM information_schema.COLUMNS "
        "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = :table AND COLUMN_NAME = :column"
    ), {"table": table, "column": column})
    count = result.scalar()
    return count is not None and count > 0


def _parse_add_column(statement: str) -> tuple[str, str] | None:
    """
    从 ALTER TABLE ... ADD COLUMN ... 语句中解析出表名和列名。
    返回 (table_name, column_name) 或 None。
    """
    pattern = r"ALTER\s+TABLE\s+(\S+)\s+ADD\s+COLUMN\s+(\S+)"
    match = re.match(pattern, statement.strip(), re.IGNORECASE)
    if match:
        return match.group(1), match.group(2)
    return None


async def _execute_migration(conn: AsyncConnection, name: str, filepath: str) -> None:
    """执行单个迁移文件"""
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    # 按分号拆分为多条语句
    statements = [s.strip() for s in content.split(";") if s.strip()]

    for stmt in statements:
        # 跳过纯注释行
        lines = [line for line in stmt.split("\n") if not line.strip().startswith("--")]
        clean_stmt = "\n".join(lines).strip()
        if not clean_stmt:
            continue

        # 对 ADD COLUMN 语句做列存在性检查
        parsed = _parse_add_column(clean_stmt)
        if parsed:
            table_name, column_name = parsed
            if await _column_exists(conn, table_name, column_name):
                logger.debug(f"列 {table_name}.{column_name} 已存在，跳过")
                continue

        await conn.execute(text(clean_stmt))

    # 记录迁移已执行
    await conn.execute(
        text("INSERT INTO _migrations (name) VALUES (:name)"),
        {"name": name},
    )
    logger.info(f"迁移 {name} 执行成功")


async def run_migrations(conn: AsyncConnection) -> None:
    """
    扫描 migrations/ 目录，按文件名排序执行未应用的迁移。
    应在 init_db() 的 engine.begin() 上下文中调用，共享同一事务。
    """
    if not os.path.isdir(MIGRATIONS_DIR):
        logger.debug("未找到 migrations 目录，跳过迁移")
        return

    await _ensure_migrations_table(conn)
    applied = await _get_applied_migrations(conn)

    # 收集 .sql 文件并按名称排序
    migration_files = sorted(
        f for f in os.listdir(MIGRATIONS_DIR) if f.endswith(".sql")
    )

    pending = [f for f in migration_files if f not in applied]
    if not pending:
        logger.debug("所有迁移已是最新")
        return

    logger.info(f"发现 {len(pending)} 个待执行迁移: {pending}")
    for filename in pending:
        filepath = os.path.join(MIGRATIONS_DIR, filename)
        try:
            await _execute_migration(conn, filename, filepath)
        except Exception as e:
            logger.error(f"迁移 {filename} 执行失败: {e}")
            raise
