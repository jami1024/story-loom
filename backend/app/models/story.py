"""
故事解析数据库模型 — 5个 SQLAlchemy ORM 模型
"""
import enum

from sqlalchemy import (
    Column,
    Enum as SQLEnum,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    DateTime,
    UniqueConstraint,
)
from sqlalchemy.dialects.mysql import JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class ProjectStatus(str, enum.Enum):
    """项目状态"""
    DRAFT = "draft"
    PARSING = "parsing"
    PARSED = "parsed"
    READY = "ready"
    GENERATING = "generating"
    COMPLETED = "completed"
    FAILED = "failed"


class ParseTaskStatus(str, enum.Enum):
    """解析任务状态"""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class ShotStatus(str, enum.Enum):
    """分镜状态"""
    PENDING = "pending"
    PROMPT_READY = "prompt_ready"
    GENERATING = "generating"
    COMPLETED = "completed"
    FAILED = "failed"


class StoryProject(Base):
    """故事项目"""
    __tablename__ = "story_projects"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    title = Column(String(200), nullable=False, comment="项目标题")
    story_text = Column(Text, nullable=False, comment="原始故事文本")
    genre = Column(String(50), nullable=True, comment="类型：武侠/科幻/爱情等")
    style = Column(String(50), default="cinematic", comment="视觉风格")
    status = Column(SQLEnum(ProjectStatus), default=ProjectStatus.DRAFT, nullable=False, index=True, comment="项目状态")
    default_ratio = Column(String(16), default="16:9", comment="默认视频比例")
    default_duration = Column(Integer, default=1, comment="默认时长(1=5s,2=10s)")
    llm_provider = Column(String(50), default="deepseek", comment="LLM提供商")
    image_provider = Column(String(50), default="zhipu-image", comment="图片生成提供商")
    image_model = Column(String(100), nullable=True, comment="图片生成模型")
    video_provider = Column(String(50), default="zhipu", comment="视频生成提供商")
    parse_metadata = Column(JSON, nullable=True, comment="解析元数据")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    characters = relationship("StoryCharacter", back_populates="project", cascade="all, delete-orphan")
    scenes = relationship("StoryScene", back_populates="project", cascade="all, delete-orphan")
    shots = relationship("StoryShot", back_populates="project", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "story_text": self.story_text,
            "genre": self.genre,
            "style": self.style,
            "status": self.status.value if isinstance(self.status, enum.Enum) else self.status,
            "default_ratio": self.default_ratio,
            "default_duration": self.default_duration,
            "llm_provider": self.llm_provider,
            "image_provider": self.image_provider,
            "image_model": self.image_model,
            "video_provider": self.video_provider,
            "parse_metadata": self.parse_metadata,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class StoryCharacter(Base):
    """角色"""
    __tablename__ = "story_characters"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    project_id = Column(Integer, ForeignKey("story_projects.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(100), nullable=False, comment="角色名")
    gender = Column(String(20), nullable=True, comment="性别")
    age = Column(String(50), nullable=True, comment="年龄描述")
    role = Column(String(50), nullable=True, comment="protagonist/supporting/minor")
    personality = Column(Text, nullable=True, comment="性格特点")
    appearance_brief = Column(Text, nullable=True, comment="外貌简述(30字内)")
    # P1 字段 — nullable
    appearance_detail = Column(Text, nullable=True, comment="详细外貌描述")
    clothing = Column(Text, nullable=True, comment="服装描述")
    visual_prompt_zh = Column(Text, nullable=True, comment="中文视觉Prompt")
    visual_prompt_en = Column(Text, nullable=True, comment="英文视觉Prompt")
    identity_anchors = Column(JSON, nullable=True, comment="身份锚点")
    default_emotion = Column(String(50), nullable=True, comment="默认情绪倾向")
    emotion_range = Column(JSON, nullable=True, comment="情绪范围")
    # 角色参考图片
    image_url = Column(String(512), nullable=True, comment="角色参考图片URL")
    image_prompt = Column(Text, nullable=True, comment="生成图片时使用的Prompt")
    image_status = Column(String(20), default="none", comment="图片状态: none/generating/completed/failed")
    sort_order = Column(Integer, default=0, comment="排序")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    project = relationship("StoryProject", back_populates="characters")
    emotions = relationship("ShotCharacterEmotion", back_populates="character", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "project_id": self.project_id,
            "name": self.name,
            "gender": self.gender,
            "age": self.age,
            "role": self.role,
            "personality": self.personality,
            "appearance_brief": self.appearance_brief,
            "default_emotion": self.default_emotion,
            "image_url": self.image_url,
            "image_prompt": self.image_prompt,
            "image_status": self.image_status or "none",
            "sort_order": self.sort_order,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class StoryScene(Base):
    """场景"""
    __tablename__ = "story_scenes"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    project_id = Column(Integer, ForeignKey("story_projects.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(200), nullable=False, comment="场景名称")
    location = Column(String(200), nullable=True, comment="地点描述")
    time_of_day = Column(String(100), nullable=True, comment="时间")
    weather = Column(String(100), nullable=True, comment="天气")
    atmosphere = Column(String(200), nullable=True, comment="氛围简述")
    # P1 字段 — nullable
    architecture_style = Column(String(200), nullable=True, comment="建筑/环境风格")
    lighting_design = Column(String(200), nullable=True, comment="光影设计")
    color_palette = Column(String(200), nullable=True, comment="色彩基调")
    key_props = Column(JSON, nullable=True, comment="关键道具")
    spatial_layout = Column(Text, nullable=True, comment="空间布局描述")
    visual_prompt_zh = Column(Text, nullable=True, comment="中文场景Prompt")
    visual_prompt_en = Column(Text, nullable=True, comment="英文场景Prompt")
    # 场景参考图片
    image_url = Column(String(512), nullable=True, comment="场景参考图片URL")
    image_prompt = Column(Text, nullable=True, comment="生成图片时使用的Prompt")
    image_status = Column(String(20), default="none", comment="图片状态: none/generating/completed/failed")
    appearance_count = Column(Integer, default=0, comment="出场次数")
    sort_order = Column(Integer, default=0, comment="排序")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    project = relationship("StoryProject", back_populates="scenes")
    shots = relationship("StoryShot", back_populates="scene")

    def to_dict(self):
        return {
            "id": self.id,
            "project_id": self.project_id,
            "name": self.name,
            "location": self.location,
            "time_of_day": self.time_of_day,
            "weather": self.weather,
            "atmosphere": self.atmosphere,
            "architecture_style": self.architecture_style,
            "lighting_design": self.lighting_design,
            "color_palette": self.color_palette,
            "visual_prompt_zh": self.visual_prompt_zh,
            "image_url": self.image_url,
            "image_prompt": self.image_prompt,
            "image_status": self.image_status or "none",
            "appearance_count": self.appearance_count,
            "sort_order": self.sort_order,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class StoryShot(Base):
    """分镜"""
    __tablename__ = "story_shots"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    project_id = Column(Integer, ForeignKey("story_projects.id", ondelete="CASCADE"), nullable=False, index=True)
    scene_id = Column(Integer, ForeignKey("story_scenes.id", ondelete="SET NULL"), nullable=True)
    shot_number = Column(Integer, nullable=False, comment="分镜序号")
    title = Column(String(100), nullable=True, comment="分镜标题(3-5字)")
    action_summary = Column(Text, nullable=True, comment="动作描述(30-80字)")
    dialogue = Column(Text, nullable=True, comment="对白内容")
    duration = Column(Integer, default=5, comment="预估时长(秒)")
    shot_type = Column(String(50), default="MS", comment="景别")
    camera_angle = Column(String(50), default="eye-level", comment="角度")
    camera_movement = Column(String(50), default="static", comment="运镜")
    atmosphere_emotion_tags = Column(JSON, nullable=True, comment="氛围情绪标签数组")
    video_prompt = Column(Text, nullable=True, comment="最终视频生成Prompt")
    status = Column(SQLEnum(ShotStatus), default=ShotStatus.PENDING, nullable=False, comment="分镜状态")
    video_task_chat_id = Column(String(64), nullable=True, comment="关联的视频任务chat_id")
    video_url = Column(String(512), nullable=True, comment="生成的视频URL")
    sort_order = Column(Integer, default=0, comment="排序")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    project = relationship("StoryProject", back_populates="shots")
    scene = relationship("StoryScene", back_populates="shots")
    character_emotions = relationship("ShotCharacterEmotion", back_populates="shot", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "project_id": self.project_id,
            "scene_id": self.scene_id,
            "shot_number": self.shot_number,
            "title": self.title,
            "action_summary": self.action_summary,
            "dialogue": self.dialogue,
            "duration": self.duration,
            "shot_type": self.shot_type,
            "camera_angle": self.camera_angle,
            "camera_movement": self.camera_movement,
            "atmosphere_emotion_tags": self.atmosphere_emotion_tags,
            "video_prompt": self.video_prompt,
            "status": self.status.value if isinstance(self.status, enum.Enum) else self.status,
            "video_task_chat_id": self.video_task_chat_id,
            "video_url": self.video_url,
            "sort_order": self.sort_order,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class ShotCharacterEmotion(Base):
    """角色级情绪"""
    __tablename__ = "shot_character_emotions"
    __table_args__ = (
        UniqueConstraint("shot_id", "character_id", name="uq_shot_character"),
    )

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    shot_id = Column(Integer, ForeignKey("story_shots.id", ondelete="CASCADE"), nullable=False, index=True)
    character_id = Column(Integer, ForeignKey("story_characters.id", ondelete="CASCADE"), nullable=False, index=True)
    emotion_tag = Column(String(50), nullable=False, comment="主情绪标签")
    emotion_intensity = Column(Integer, default=3, comment="情绪强度1-5")
    expression_start = Column(String(200), nullable=True, comment="起始表情")
    expression_peak = Column(String(200), nullable=True, comment="高潮表情")
    expression_end = Column(String(200), nullable=True, comment="结束表情")
    body_language = Column(String(300), nullable=True, comment="肢体语言")
    emotion_transition = Column(String(100), nullable=True, comment="变化方向")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    shot = relationship("StoryShot", back_populates="character_emotions")
    character = relationship("StoryCharacter", back_populates="emotions")

    def to_dict(self):
        return {
            "id": self.id,
            "shot_id": self.shot_id,
            "character_id": self.character_id,
            "character_name": self.character.name if self.character else None,
            "emotion_tag": self.emotion_tag,
            "emotion_intensity": self.emotion_intensity,
            "expression_start": self.expression_start,
            "expression_peak": self.expression_peak,
            "expression_end": self.expression_end,
            "body_language": self.body_language,
            "emotion_transition": self.emotion_transition,
        }


class StoryParseTask(Base):
    """故事解析任务"""
    __tablename__ = "story_parse_tasks"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    project_id = Column(Integer, ForeignKey("story_projects.id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(String(20), default=ParseTaskStatus.PENDING.value, nullable=False, index=True, comment="状态")
    progress = Column(Float, default=0.0, nullable=False, comment="进度 0.0~1.0")
    message = Column(String(500), nullable=True, comment="当前阶段消息")
    error_detail = Column(Text, nullable=True, comment="失败时的详细错误信息")
    result_metadata = Column(JSON, nullable=True, comment="完成后的统计元数据")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    project = relationship("StoryProject")

    def to_dict(self):
        return {
            "task_id": self.id,
            "project_id": self.project_id,
            "status": self.status,
            "progress": self.progress,
            "message": self.message,
            "error_detail": self.error_detail,
            "result_metadata": self.result_metadata,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "started_at": self.started_at.isoformat() if self.started_at else None,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
