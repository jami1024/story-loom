"""
视频任务数据库模型
"""
from sqlalchemy import Column, String, Integer, Text, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.sql import func
import enum

from app.database import Base


class TaskStatus(str, enum.Enum):
    """任务状态枚举"""
    INIT = "init"
    PROCESSING = "processing"
    FINISHED = "finished"
    FAILED = "failed"


class VideoTask(Base):
    """视频生成任务表"""
    __tablename__ = "video_tasks"

    # 主键
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)

    # 任务信息
    chat_id = Column(String(64), unique=True, index=True, nullable=False, comment="视频平台任务ID")
    prompt = Column(Text, nullable=False, comment="视频描述")

    # 状态信息
    status = Column(SQLEnum(TaskStatus), default=TaskStatus.INIT, nullable=False, index=True, comment="任务状态")
    msg = Column(String(512), nullable=True, comment="状态消息")
    plan = Column(String(64), nullable=True, comment="进度信息")

    # 视频参数
    duration = Column(Integer, default=1, comment="视频时长(1=5秒,2=10秒)")
    ratio = Column(String(16), default="16:9", comment="视频比例")

    # 结果信息
    video_url = Column(String(512), nullable=True, comment="视频URL")
    cover_url = Column(String(512), nullable=True, comment="封面URL")
    video_resolution = Column(String(32), nullable=True, comment="视频分辨率")
    video_duration = Column(String(16), nullable=True, comment="实际视频时长")
    video_fps = Column(String(16), nullable=True, comment="视频帧率")

    # 时间戳
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, comment="创建时间")
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False, comment="更新时间")

    # 故事分镜关联（可选）
    shot_id = Column(Integer, ForeignKey("story_shots.id", ondelete="SET NULL"), nullable=True, comment="关联的故事分镜ID")

    def to_dict(self):
        """转换为字典"""
        return {
            "id": self.id,
            "chat_id": self.chat_id,
            "prompt": self.prompt,
            "status": self.status.value if isinstance(self.status, enum.Enum) else self.status,
            "msg": self.msg,
            "plan": self.plan,
            "duration": self.duration,
            "ratio": self.ratio,
            "video_url": self.video_url,
            "cover_url": self.cover_url,
            "video_resolution": self.video_resolution,
            "video_duration": self.video_duration,
            "video_fps": self.video_fps,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
