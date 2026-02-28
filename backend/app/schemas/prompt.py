"""
Prompt 生成相关的数据模型
"""
from pydantic import BaseModel, ConfigDict, Field


class PromptGenerateRequest(BaseModel):
    """Prompt 生成请求 - 支持两种模式：简单文本或结构化字段"""

    # 模式 1: 简单文本输入
    user_input: str | None = Field(None, description="用户输入的想法或概念", max_length=500)

    # 模式 2: 结构化字段输入（前端表单）
    camera_work: str | None = Field(None, description="镜头语言", max_length=200)
    lighting: str | None = Field(None, description="光影效果", max_length=200)
    subject: str | None = Field(None, description="主体", max_length=200)
    subject_description: str | None = Field(None, description="主体描述", max_length=200)
    subject_motion: str | None = Field(None, description="主体运动", max_length=200)
    scene: str | None = Field(None, description="场景", max_length=200)
    scene_description: str | None = Field(None, description="场景描述", max_length=200)
    mood: str | None = Field(None, description="情绪/氛围/风格", max_length=200)

    # 通用参数
    temperature: float = Field(0.7, description="温度参数 (0-1, 越高越有创意)", ge=0, le=1)

    model_config = ConfigDict(json_schema_extra={
        "examples": [
            {
                "summary": "简单文本模式",
                "value": {
                    "user_input": "一个特工在未来城市里跑酷逃脱",
                    "temperature": 0.7
                }
            },
            {
                "summary": "结构化字段模式",
                "value": {
                    "camera_work": "低角度跟踪镜头",
                    "lighting": "霓虹灯",
                    "subject": "一个特工",
                    "subject_description": "穿着黑色装甲",
                    "subject_motion": "在屋顶间跳跃",
                    "scene": "赛博朋克城市",
                    "scene_description": "高楼林立，霓虹闪烁",
                    "mood": "紧张刺激",
                    "temperature": 0.7
                }
            }
        ]
    })


class PromptGenerateResponse(BaseModel):
    """Prompt 生成响应"""
    prompt: str = Field(..., description="生成的视频描述 Prompt")
    original_input: str = Field(..., description="用户原始输入")
    model: str = Field(..., description="使用的模型")
    usage: dict = Field(..., description="Token 使用统计")
