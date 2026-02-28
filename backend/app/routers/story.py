"""
故事解析 API 路由
"""
import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.constants.emotions import EMOTION_INTENSITIES, EMOTION_TAGS, EMOTION_TRANSITIONS
from app.core.config import get_settings
from app.database import get_db
from app.models.story import (
    ProjectStatus,
    ShotCharacterEmotion,
    StoryCharacter,
    StoryScene,
    StoryShot,
)
from app.schemas.story import (
    CharacterUpdateRequest,
    EmotionPresetResponse,
    EmotionUpdateRequest,
    ImageGenerateRequest,
    ParseStatusResponse,
    ProjectCreateRequest,
    SceneUpdateRequest,
    ShotUpdateRequest,
)
from app.services.image_client import get_image_client
from app.services.llm_client import get_llm_client
from app.services.scene_calibrator import calibrate_all_scenes, calibrate_scene_visual_prompt
from app.services.story_parser import parse_story
from app.services.story_service import StoryService
from app.services.task_service import TaskService
from app.services.video_prompt_builder import build_all_prompts
from app.services.zhipu_video import ZhipuVideoService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/story", tags=["故事解析"])


# ========== 项目 CRUD ==========

@router.post("/projects", summary="创建故事项目")
async def create_project(req: ProjectCreateRequest, db: AsyncSession = Depends(get_db)):
    """创建一个新的故事项目"""
    create_data = {
        "title": req.title,
        "story_text": req.story_text,
        "genre": req.genre,
        "style": req.style,
        "default_ratio": req.default_ratio,
        "default_duration": req.default_duration,
        "llm_provider": req.llm_provider,
    }
    if req.image_provider is not None:
        create_data["image_provider"] = req.image_provider
    if req.image_model is not None:
        create_data["image_model"] = req.image_model
    if req.video_provider is not None:
        create_data["video_provider"] = req.video_provider

    project = await StoryService.create_project(db, **create_data)
    return {
        "id": project.id,
        "title": project.title,
        "status": project.status.value,
        "character_count": 0,
        "scene_count": 0,
        "shot_count": 0,
        "created_at": project.created_at.isoformat() if project.created_at else None,
    }


@router.get("/projects", summary="项目列表")
async def list_projects(
    limit: int = 20, offset: int = 0, db: AsyncSession = Depends(get_db)
):
    """获取故事项目列表"""
    items, total = await StoryService.get_project_list(db, limit=limit, offset=offset)
    return {"total": total, "projects": items}


@router.get("/projects/{project_id}", summary="项目详情")
async def get_project_detail(project_id: int, db: AsyncSession = Depends(get_db)):
    """获取项目完整详情（含角色/场景/分镜/情绪）"""
    detail = await StoryService.get_project_detail(db, project_id)
    if not detail:
        raise HTTPException(status_code=404, detail="项目不存在")
    return detail


@router.delete("/projects/{project_id}", summary="删除项目")
async def delete_project(project_id: int, db: AsyncSession = Depends(get_db)):
    """删除项目（级联删除所有子数据）"""
    ok = await StoryService.delete_project(db, project_id)
    if not ok:
        raise HTTPException(status_code=404, detail="项目不存在")
    return {"message": "项目已删除"}


# ========== 解析 ==========

@router.post("/projects/{project_id}/parse", summary="触发故事解析")
async def trigger_parse(project_id: int, db: AsyncSession = Depends(get_db)):
    """触发 LLM 解析故事文本"""
    project = await StoryService.get_project(db, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="项目不存在")

    if project.status not in (ProjectStatus.DRAFT, ProjectStatus.FAILED):
        raise HTTPException(status_code=400, detail=f"当前状态 '{project.status.value}' 不可解析")

    try:
        llm_client = get_llm_client()
        stats = await parse_story(db, project, llm_client)
        return {
            "status": "parsed",
            "message": "解析完成",
            **stats,
        }
    except Exception as e:
        logger.error(f"解析失败: {e}")
        raise HTTPException(status_code=500, detail=f"解析失败: {e}")


@router.get("/projects/{project_id}/parse/status", summary="解析状态")
async def get_parse_status(project_id: int, db: AsyncSession = Depends(get_db)):
    """查询解析状态和进度"""
    project = await StoryService.get_project(db, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="项目不存在")

    messages = {
        ProjectStatus.DRAFT: "等待解析",
        ProjectStatus.PARSING: "正在解析中...",
        ProjectStatus.PARSED: "解析完成",
        ProjectStatus.READY: "Prompt 已就绪",
        ProjectStatus.GENERATING: "正在生成视频",
        ProjectStatus.COMPLETED: "全部完成",
        ProjectStatus.FAILED: "解析失败",
    }
    return ParseStatusResponse(
        status=project.status.value,
        message=messages.get(project.status, "未知状态"),
    )


# ========== 编辑 ==========

@router.put("/characters/{char_id}", summary="编辑角色")
async def update_character(
    char_id: int, req: CharacterUpdateRequest, db: AsyncSession = Depends(get_db)
):
    """编辑角色信息"""
    result = await StoryService.update_character(
        db, char_id, **req.model_dump(exclude_unset=True)
    )
    if not result:
        raise HTTPException(status_code=404, detail="角色不存在")
    return result


@router.put("/scenes/{scene_id}", summary="编辑场景")
async def update_scene(
    scene_id: int, req: SceneUpdateRequest, db: AsyncSession = Depends(get_db)
):
    """编辑场景信息"""
    result = await StoryService.update_scene(
        db, scene_id, **req.model_dump(exclude_unset=True)
    )
    if not result:
        raise HTTPException(status_code=404, detail="场景不存在")
    return result


@router.put("/shots/{shot_id}", summary="编辑分镜")
async def update_shot(
    shot_id: int, req: ShotUpdateRequest, db: AsyncSession = Depends(get_db)
):
    """编辑分镜信息"""
    result = await StoryService.update_shot(
        db, shot_id, **req.model_dump(exclude_unset=True)
    )
    if not result:
        raise HTTPException(status_code=404, detail="分镜不存在")
    return result


@router.put("/shots/{shot_id}/emotions/{char_id}", summary="编辑角色情绪")
async def update_emotion(
    shot_id: int,
    char_id: int,
    req: EmotionUpdateRequest,
    db: AsyncSession = Depends(get_db),
):
    """编辑分镜中特定角色的情绪"""
    result = await StoryService.update_emotion(
        db, shot_id, char_id, **req.model_dump(exclude_unset=True)
    )
    if not result:
        raise HTTPException(status_code=404, detail="情绪记录不存在")
    return result


# ========== Prompt 组装 + 视频生成 ==========

@router.post("/projects/{project_id}/generate-prompts", summary="批量组装Prompt")
async def generate_prompts(project_id: int, db: AsyncSession = Depends(get_db)):
    """为项目所有分镜批量组装视频 Prompt"""
    project = await StoryService.get_project(db, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="项目不存在")

    prompts = await build_all_prompts(db, project_id, project.style)

    # 更新项目状态为 ready
    project.status = ProjectStatus.READY
    await db.commit()

    return {"total": len(prompts), "prompts": prompts}


@router.post("/shots/{shot_id}/generate-video", summary="单个分镜生成视频")
async def generate_video_for_shot(shot_id: int, db: AsyncSession = Depends(get_db)):
    """为单个分镜生成视频（文生视频 + 参考图辅助）"""
    stmt = (
        select(StoryShot)
        .where(StoryShot.id == shot_id)
        .options(
            selectinload(StoryShot.scene),
            selectinload(StoryShot.character_emotions)
            .selectinload(ShotCharacterEmotion.character),
        )
    )
    result = await db.execute(stmt)
    shot = result.scalar_one_or_none()
    if not shot:
        raise HTTPException(status_code=404, detail="分镜不存在")

    if not shot.video_prompt:
        raise HTTPException(status_code=400, detail="请先组装 Prompt")

    settings = get_settings()
    auth_token = settings.ZHIPU_AUTH_TOKEN
    if not auth_token:
        raise HTTPException(status_code=401, detail="未配置 ZHIPU_AUTH_TOKEN")
    if not auth_token.startswith("Bearer "):
        auth_token = f"Bearer {auth_token}"

    # 获取项目信息以确定视频参数
    project = await StoryService.get_project(db, shot.project_id)
    ratio_map = {
        "16:9": (16, 9),
        "9:16": (9, 16),
        "1:1": (1, 1),
        "3:2": (3, 2),
    }
    ratio = project.default_ratio if project else "16:9"
    ratio_width, ratio_height = ratio_map.get(ratio, (16, 9))
    duration = project.default_duration if project else 1

    # 收集参考图（场景 + 角色）
    reference_images = []

    # 1. 场景参考图
    if shot.scene and shot.scene.image_url:
        reference_images.append({
            "url": shot.scene.image_url,
            "role": "reference_image",
        })

    # 2. 角色参考图（从分镜关联的角色中收集）
    for emo in (shot.character_emotions or []):
        if emo.character and emo.character.image_url:
            reference_images.append({
                "url": emo.character.image_url,
                "role": "reference_image",
            })

    # 最多传 4 张参考图（API 限制）
    reference_images = reference_images[:4]

    try:
        async with ZhipuVideoService(auth_token) as service:
            result = await service.generate_video_text2video(
                prompt=shot.video_prompt,
                duration=duration,
                ratio_width=ratio_width,
                ratio_height=ratio_height,
                reference_images=reference_images if reference_images else None,
            )

        chat_id = result.get("chat_id")

        # 记录到 video_tasks
        await TaskService.create_task(
            db=db,
            chat_id=chat_id,
            prompt=shot.video_prompt,
            status=result.get("status"),
            duration=duration,
            ratio=ratio,
            msg=result.get("msg"),
        )

        # 更新分镜状态
        shot.video_task_chat_id = chat_id
        shot.status = "generating"
        await db.commit()

        return {
            "shot_id": shot_id,
            "chat_id": chat_id,
            "status": result.get("status"),
            "reference_image_count": len(reference_images),
            "message": "视频生成任务已提交",
        }

    except Exception as e:
        logger.error(f"分镜 {shot_id} 视频生成失败: {e}")
        raise HTTPException(status_code=500, detail=f"视频生成失败: {e}")


# ========== 角色图片生成 ==========

@router.post("/characters/{char_id}/generate-image", summary="生成角色参考图片")
async def generate_character_image(
    char_id: int,
    req: ImageGenerateRequest | None = None,
    db: AsyncSession = Depends(get_db),
):
    """为单个角色生成参考立绘图片"""
    try:
        image_client = get_image_client()
    except Exception:
        raise HTTPException(status_code=503, detail="图片生成服务未初始化，请检查 API Key 配置")

    custom_prompt = req.custom_prompt if req else None
    result = await StoryService.generate_character_image(
        db, char_id, image_client, custom_prompt=custom_prompt
    )
    return result


@router.post("/projects/{project_id}/generate-images", summary="批量生成角色图片")
async def generate_all_character_images(
    project_id: int,
    db: AsyncSession = Depends(get_db),
):
    """批量为项目所有角色生成参考图片"""
    project = await StoryService.get_project(db, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="项目不存在")

    try:
        image_client = get_image_client()
    except Exception:
        raise HTTPException(status_code=503, detail="图片生成服务未初始化，请检查 API Key 配置")

    results = await StoryService.generate_all_character_images(
        db, project_id, image_client
    )
    return {"total": len(results), "characters": results}


# ========== 场景图片生成 ==========

@router.post("/scenes/{scene_id}/generate-image", summary="生成场景参考图片")
async def generate_scene_image(
    scene_id: int,
    req: ImageGenerateRequest | None = None,
    db: AsyncSession = Depends(get_db),
):
    """为单个场景生成参考图片（16:9 宽景）"""
    try:
        image_client = get_image_client()
    except Exception:
        raise HTTPException(status_code=503, detail="图片生成服务未初始化，请检查 API Key 配置")

    custom_prompt = req.custom_prompt if req else None
    result = await StoryService.generate_scene_image(
        db, scene_id, image_client, custom_prompt=custom_prompt
    )
    return result


@router.post("/projects/{project_id}/generate-scene-images", summary="批量生成场景图片")
async def generate_all_scene_images(
    project_id: int,
    db: AsyncSession = Depends(get_db),
):
    """批量为项目所有场景生成参考图片"""
    project = await StoryService.get_project(db, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="项目不存在")

    try:
        image_client = get_image_client()
    except Exception:
        raise HTTPException(status_code=503, detail="图片生成服务未初始化，请检查 API Key 配置")

    results = await StoryService.generate_all_scene_images(
        db, project_id, image_client
    )
    return {"total": len(results), "scenes": results}


# ========== 场景 AI 校准 ==========

@router.post("/projects/{project_id}/calibrate-scenes", summary="批量校准场景描述")
async def calibrate_scenes(
    project_id: int,
    db: AsyncSession = Depends(get_db),
):
    """用 AI 为项目所有场景生成精炼的 visual_prompt_zh"""
    project = await StoryService.get_project(db, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="项目不存在")

    try:
        llm_client = get_llm_client()
    except Exception:
        raise HTTPException(status_code=503, detail="LLM 服务未初始化，请检查 API Key 配置")

    results = await calibrate_all_scenes(
        db=db,
        project_id=project_id,
        llm_client=llm_client,
        project_style=project.style,
        provider=project.llm_provider or "deepseek",
    )
    return {"total": len(results), "scenes": results}


@router.post("/scenes/{scene_id}/calibrate", summary="校准单个场景描述")
async def calibrate_single_scene(
    scene_id: int,
    db: AsyncSession = Depends(get_db),
):
    """用 AI 为单个场景生成精炼的 visual_prompt_zh"""
    stmt = (
        select(StoryScene)
        .where(StoryScene.id == scene_id)
        .options(selectinload(StoryScene.project))
    )
    result = await db.execute(stmt)
    scene = result.scalar_one_or_none()
    if not scene:
        raise HTTPException(status_code=404, detail="场景不存在")

    try:
        llm_client = get_llm_client()
    except Exception:
        raise HTTPException(status_code=503, detail="LLM 服务未初始化，请检查 API Key 配置")

    project = scene.project
    visual_prompt = await calibrate_scene_visual_prompt(
        scene=scene,
        llm_client=llm_client,
        project_style=project.style if project else None,
        provider=project.llm_provider if project else "deepseek",
    )

    scene.visual_prompt_zh = visual_prompt
    await db.commit()

    return {
        "id": scene.id,
        "name": scene.name,
        "visual_prompt_zh": visual_prompt,
    }


# ========== 情绪预设数据 ==========

@router.get("/emotions/presets", summary="情绪预设数据")
async def get_emotion_presets():
    """获取情绪标签预设数据（标签列表+强度列表+变化方向列表）"""
    tags = [
        {"id": k, **v}
        for k, v in EMOTION_TAGS.items()
    ]
    intensities = [
        {"level": k, **v}
        for k, v in EMOTION_INTENSITIES.items()
    ]
    return EmotionPresetResponse(
        tags=tags,
        intensities=intensities,
        transitions=EMOTION_TRANSITIONS,
    )
