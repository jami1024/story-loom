"""
故事解析相关的 Pydantic 请求/响应模型
"""
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


# ========== 请求模型 ==========

class ProjectCreateRequest(BaseModel):
    """创建项目请求"""
    title: str = Field(..., min_length=1, max_length=200, description="项目标题")
    story_text: str = Field(..., min_length=10, max_length=50000, description="故事文本")
    genre: str | None = Field(None, max_length=50, description="类型")
    style: str = Field("cinematic", max_length=50, description="视觉风格")
    default_ratio: str = Field("16:9", max_length=16, description="默认视频比例")
    default_duration: int = Field(1, ge=1, le=2, description="默认时长(1=5s,2=10s)")
    llm_provider: str = Field("deepseek", description="LLM提供商")
    image_provider: str | None = Field(None, max_length=50, description="图片生成提供商")
    image_model: str | None = Field(None, max_length=100, description="图片生成模型")
    video_provider: str | None = Field(None, max_length=50, description="视频生成提供商")


class CharacterUpdateRequest(BaseModel):
    """编辑角色请求"""
    name: str | None = Field(None, max_length=100)
    gender: str | None = Field(None, max_length=20)
    age: str | None = Field(None, max_length=50)
    role: str | None = Field(None, max_length=50)
    personality: str | None = None
    appearance_brief: str | None = None
    default_emotion: str | None = Field(None, max_length=50)


class SceneUpdateRequest(BaseModel):
    """编辑场景请求"""
    name: str | None = Field(None, max_length=200)
    location: str | None = Field(None, max_length=200)
    time_of_day: str | None = Field(None, max_length=100)
    weather: str | None = Field(None, max_length=100)
    atmosphere: str | None = Field(None, max_length=200)
    architecture_style: str | None = Field(None, max_length=200)
    lighting_design: str | None = Field(None, max_length=200)
    color_palette: str | None = Field(None, max_length=200)
    visual_prompt_zh: str | None = None


class ShotUpdateRequest(BaseModel):
    """编辑分镜请求"""
    title: str | None = Field(None, max_length=100)
    action_summary: str | None = None
    dialogue: str | None = None
    shot_type: str | None = Field(None, max_length=50)
    camera_angle: str | None = Field(None, max_length=50)
    camera_movement: str | None = Field(None, max_length=50)
    atmosphere_emotion_tags: list[str] | None = None
    video_prompt: str | None = None


class EmotionUpdateRequest(BaseModel):
    """编辑角色情绪请求"""
    emotion_tag: str = Field(..., max_length=50, description="主情绪标签")
    emotion_intensity: int = Field(..., ge=1, le=5, description="情绪强度")
    expression_start: str | None = Field(None, max_length=200)
    expression_peak: str | None = Field(None, max_length=200)
    expression_end: str | None = Field(None, max_length=200)
    body_language: str | None = Field(None, max_length=300)
    emotion_transition: str | None = Field(None, max_length=100)


# ========== 响应模型 ==========

class EmotionResponse(BaseModel):
    """情绪响应"""
    model_config = ConfigDict(from_attributes=True)

    id: int
    shot_id: int
    character_id: int
    character_name: str | None = None
    emotion_tag: str
    emotion_intensity: int
    expression_start: str | None = None
    expression_peak: str | None = None
    expression_end: str | None = None
    body_language: str | None = None
    emotion_transition: str | None = None


class CharacterResponse(BaseModel):
    """角色响应"""
    model_config = ConfigDict(from_attributes=True)

    id: int
    project_id: int
    name: str
    gender: str | None = None
    age: str | None = None
    role: str | None = None
    personality: str | None = None
    appearance_brief: str | None = None
    default_emotion: str | None = None
    image_url: str | None = None
    image_prompt: str | None = None
    image_status: str = "none"
    sort_order: int = 0
    created_at: datetime | None = None
    updated_at: datetime | None = None


class SceneResponse(BaseModel):
    """场景响应"""
    model_config = ConfigDict(from_attributes=True)

    id: int
    project_id: int
    name: str
    location: str | None = None
    time_of_day: str | None = None
    weather: str | None = None
    atmosphere: str | None = None
    architecture_style: str | None = None
    lighting_design: str | None = None
    color_palette: str | None = None
    visual_prompt_zh: str | None = None
    image_url: str | None = None
    image_prompt: str | None = None
    image_status: str = "none"
    appearance_count: int = 0
    sort_order: int = 0
    created_at: datetime | None = None
    updated_at: datetime | None = None


class ShotResponse(BaseModel):
    """分镜响应"""
    model_config = ConfigDict(from_attributes=True)

    id: int
    project_id: int
    scene_id: int | None = None
    scene_name: str | None = None
    shot_number: int
    title: str | None = None
    action_summary: str | None = None
    dialogue: str | None = None
    duration: int = 5
    shot_type: str = "MS"
    camera_angle: str = "eye-level"
    camera_movement: str = "static"
    atmosphere_emotion_tags: list[str] | None = None
    character_emotions: list[EmotionResponse] = []
    video_prompt: str | None = None
    status: str = "pending"
    video_task_chat_id: str | None = None
    video_url: str | None = None
    sort_order: int = 0
    created_at: datetime | None = None
    updated_at: datetime | None = None


class ProjectSummaryResponse(BaseModel):
    """项目摘要响应"""
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    status: str
    genre: str | None = None
    style: str | None = None
    character_count: int = 0
    scene_count: int = 0
    shot_count: int = 0
    created_at: datetime | None = None
    updated_at: datetime | None = None


class ProjectDetailResponse(BaseModel):
    """项目详情响应"""
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    story_text: str
    genre: str | None = None
    style: str | None = None
    status: str
    default_ratio: str = "16:9"
    default_duration: int = 1
    llm_provider: str = "deepseek"
    image_provider: str = "zhipu-image"
    image_model: str | None = None
    video_provider: str = "zhipu"
    parse_metadata: dict | None = None
    characters: list[CharacterResponse] = []
    scenes: list[SceneResponse] = []
    shots: list[ShotResponse] = []
    created_at: datetime | None = None
    updated_at: datetime | None = None


class ParseStatusResponse(BaseModel):
    """解析状态响应"""
    status: str
    progress: float | None = None
    message: str | None = None


class EmotionPresetResponse(BaseModel):
    """情绪预设数据响应"""
    tags: list[dict]
    intensities: list[dict]
    transitions: list[dict]


class ImageGenerateRequest(BaseModel):
    """角色图片生成请求"""
    custom_prompt: str | None = Field(None, max_length=2000, description="自定义图片生成Prompt")
