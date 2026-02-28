"""
ORM 模型包 - 导入所有模型以供 Base.metadata.create_all() 发现
"""
from app.models.provider import AIProvider  # noqa: F401
from app.models.task import VideoTask, TaskStatus  # noqa: F401
from app.models.story import (  # noqa: F401
    StoryProject,
    StoryCharacter,
    StoryScene,
    StoryShot,
    ShotCharacterEmotion,
)
