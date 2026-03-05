"""
Prompt 生成 API 路由
"""
from fastapi import APIRouter, Depends, HTTPException
import logging

from app.schemas.prompt import PromptGenerateRequest, PromptGenerateResponse
from app.services.prompt_service import PromptService, get_prompt_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/prompt", tags=["Prompt 生成"])


def _resolve_user_input(request: PromptGenerateRequest) -> str:
    """
    从请求中解析用户输入文本。

    如果提供了 user_input，直接使用；
    否则，将结构化字段组合成一句描述。
    """
    if request.user_input:
        return request.user_input

    parts = []

    if request.subject:
        subject_text = request.subject
        if request.subject_description:
            subject_text = f"{request.subject_description}{request.subject}"
        if request.subject_motion:
            subject_text = f"{subject_text}{request.subject_motion}"
        parts.append(subject_text)

    if request.scene:
        scene_text = request.scene
        if request.scene_description:
            scene_text = f"{scene_text}，{request.scene_description}"
        parts.append(f"在{scene_text}")

    if request.camera_work:
        parts.append(f"使用{request.camera_work}")

    if request.lighting:
        parts.append(f"{request.lighting}光效")

    if request.mood:
        parts.append(f"{request.mood}风格")

    return "，".join(parts) if parts else ""


@router.post("/generate", response_model=PromptGenerateResponse, summary="生成视频描述 Prompt")
async def generate_prompt(
    request: PromptGenerateRequest,
    service: PromptService = Depends(get_prompt_service),
):
    """
    使用多模型服务生成优化后的视频描述 Prompt

    支持两种输入模式：
    1. **简单文本模式**: 提供 user_input 字段
    2. **结构化字段模式**: 提供 camera_work, lighting, subject, scene 等字段

    返回优化后的专业视频描述 Prompt
    """
    user_input = _resolve_user_input(request)

    if not user_input:
        raise HTTPException(
            status_code=400,
            detail="请提供有效的视频描述输入",
        )

    logger.info(f"收到 Prompt 生成请求 - 输入: {user_input[:50]}...")

    result = await service.generate_prompt(
        user_input=user_input,
        temperature=request.temperature,
    )

    logger.info(f"Prompt 生成成功 - 长度: {len(result['prompt'])} 字符")

    return PromptGenerateResponse(
        prompt=result["prompt"],
        original_input=result["original_input"],
        model=result["model"],
        usage=result["usage"],
    )


@router.get("/health", summary="健康检查")
async def health_check():
    """
    检查 Prompt 服务是否正常运行

    返回服务状态和配置信息
    """
    try:
        service = get_prompt_service()
        return {
            "status": "healthy",
            "service": "Prompt Generation Service",
            "configured": bool(service.api_key),
            "base_url": service.base_url,
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "service": "Prompt Generation Service",
            "configured": False,
            "error": str(e),
        }
