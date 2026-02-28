"""
视频生成相关的Pydantic模型
"""
from pydantic import BaseModel, ConfigDict, Field
from enum import Enum


class VideoRatio(str, Enum):
    """视频比例"""
    RATIO_16_9 = "16:9"
    RATIO_9_16 = "9:16"
    RATIO_1_1 = "1:1"
    RATIO_3_2 = "3:2"


class VideoDuration(int, Enum):
    """视频时长"""
    FIVE_SECONDS = 1   # 5秒
    TEN_SECONDS = 2    # 10秒


class VideoGenerateRequest(BaseModel):
    """视频生成请求"""
    prompt: str = Field(..., description="视频描述文字", min_length=1, max_length=2000)
    duration: VideoDuration = Field(default=VideoDuration.FIVE_SECONDS, description="视频时长")
    ratio: VideoRatio = Field(default=VideoRatio.RATIO_16_9, description="视频比例")
    count: int = Field(default=1, description="生成视频条数", ge=1, le=5)

    model_config = ConfigDict(json_schema_extra={
        "example": {
            "prompt": "一只可爱的橘猫在阳光明媚的草地上追逐蝴蝶，画面温馨治愈，电影感光效，4K高清",
            "duration": 1,
            "ratio": "16:9",
            "count": 1
        }
    })


class VideoStatus(str, Enum):
    """视频生成状态"""
    INIT = "init"
    PROCESSING = "processing"
    FINISHED = "finished"
    FAILED = "failed"


class VideoGenerateResponse(BaseModel):
    """视频生成响应"""
    chat_id: str = Field(..., description="聊天ID（任务ID）")
    status: VideoStatus = Field(..., description="状态")
    msg: str | None = Field(None, description="状态消息")

    model_config = ConfigDict(json_schema_extra={
        "example": {
            "chat_id": "690b1f899b111aeda0a34d8a",
            "status": "init",
            "msg": "任务已提交"
        }
    })


class BatchVideoGenerateResponse(BaseModel):
    """批量视频生成响应"""
    tasks: list[VideoGenerateResponse] = Field(..., description="生成的任务列表")
    total: int = Field(..., description="生成任务总数")
    success: int = Field(..., description="成功提交的任务数")
    failed: int = Field(..., description="失败的任务数")

    model_config = ConfigDict(json_schema_extra={
        "example": {
            "tasks": [
                {
                    "chat_id": "690b1f899b111aeda0a34d8a",
                    "status": "init",
                    "msg": "任务已提交"
                },
                {
                    "chat_id": "690b1f899b111aeda0a34d8b",
                    "status": "init",
                    "msg": "任务已提交"
                }
            ],
            "total": 2,
            "success": 2,
            "failed": 0
        }
    })


class VideoStatusResponse(BaseModel):
    """视频状态查询响应"""
    chat_id: str = Field(..., description="聊天ID")
    status: VideoStatus = Field(..., description="状态")
    msg: str | None = Field(None, description="状态消息")
    plan: str | None = Field(None, description="进度信息")
    video_url: str | None = Field(None, description="视频URL（完成时）")
    cover_url: str | None = Field(None, description="封面URL")
    video_resolution: str | None = Field(None, description="视频分辨率")
    video_duration: str | None = Field(None, description="视频时长")
    video_fps: str | None = Field(None, description="视频帧率")

    model_config = ConfigDict(json_schema_extra={
        "example": {
            "chat_id": "690b1f899b111aeda0a34d8a",
            "status": "finished",
            "msg": "已完成",
            "plan": "100%",
            "video_url": "https://sfile.chatglm.cn/api/cogvideo/xxx.mp4",
            "cover_url": "https://sfile.chatglm.cn/api/cogvideo/xxx_cover.jpeg",
            "video_resolution": "3840*2160",
            "video_duration": "5s",
            "video_fps": "30帧"
        }
    })


class QuotaInfoResponse(BaseModel):
    """配额信息响应"""
    video_times: int = Field(..., description="已使用次数")
    video_total: int = Field(..., description="总配额")
    remaining: int = Field(..., description="剩余次数")

    model_config = ConfigDict(json_schema_extra={
        "example": {
            "video_times": 5,
            "video_total": 100,
            "remaining": 95
        }
    })
