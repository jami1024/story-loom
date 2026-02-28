"""
视频任务服务层 - 异步 MySQL 持久化
"""
from sqlalchemy import select, desc, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.task import VideoTask, TaskStatus


class TaskService:
    """任务服务类"""

    @staticmethod
    async def create_task(
        db: AsyncSession,
        chat_id: str,
        prompt: str,
        status: str = "init",
        duration: int = 1,
        ratio: str = "16:9",
        **kwargs,
    ) -> VideoTask:
        """创建新任务"""
        task = VideoTask(
            chat_id=chat_id,
            prompt=prompt,
            status=status,
            duration=duration,
            ratio=ratio,
            msg=kwargs.get("msg"),
            plan=kwargs.get("plan"),
        )
        db.add(task)
        await db.commit()
        await db.refresh(task)
        return task

    @staticmethod
    async def get_task_by_chat_id(db: AsyncSession, chat_id: str) -> VideoTask | None:
        """根据 chat_id 查询任务"""
        result = await db.execute(
            select(VideoTask).where(VideoTask.chat_id == chat_id)
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def update_task(
        db: AsyncSession,
        chat_id: str,
        **kwargs,
    ) -> VideoTask | None:
        """更新任务信息"""
        task = await TaskService.get_task_by_chat_id(db, chat_id)
        if not task:
            return None

        for key, value in kwargs.items():
            if hasattr(task, key) and value is not None:
                setattr(task, key, value)

        await db.commit()
        await db.refresh(task)
        return task

    @staticmethod
    async def get_all_tasks(
        db: AsyncSession,
        limit: int = 50,
        offset: int = 0,
        status: str | None = None,
    ) -> list[VideoTask]:
        """查询任务列表"""
        stmt = select(VideoTask)

        if status:
            stmt = stmt.where(VideoTask.status == status)

        stmt = stmt.order_by(desc(VideoTask.created_at)).offset(offset).limit(limit)
        result = await db.execute(stmt)
        return list(result.scalars().all())

    @staticmethod
    async def get_task_count(db: AsyncSession, status: str | None = None) -> int:
        """获取任务总数"""
        stmt = select(func.count(VideoTask.id))

        if status:
            stmt = stmt.where(VideoTask.status == status)

        result = await db.execute(stmt)
        return result.scalar_one()

    @staticmethod
    async def delete_task(db: AsyncSession, chat_id: str) -> bool:
        """删除任务"""
        task = await TaskService.get_task_by_chat_id(db, chat_id)
        if not task:
            return False

        await db.delete(task)
        await db.commit()
        return True
