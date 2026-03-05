"""
故事解析服务 — 调用 LLM 解析故事文本并写入数据库（异步后台模式）
"""
import asyncio
import logging
from collections import Counter
from datetime import datetime, timezone

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import async_session
from app.models.story import (
    ParseTaskStatus,
    ProjectStatus,
    ShotCharacterEmotion,
    ShotStatus,
    StoryCharacter,
    StoryParseTask,
    StoryProject,
    StoryScene,
    StoryShot,
)
from app.services.llm_client import LLMClient, get_llm_client
from app.services.prompts.story_parse import (
    STORY_PARSE_SYSTEM_PROMPT,
    build_story_parse_user_prompt,
)

logger = logging.getLogger(__name__)

# ========== 并发控制 ==========

_MAX_PARALLEL_PARSES = 3
_parse_lock = asyncio.Lock()
_active_parse_count = 0


async def _acquire_parse_slot() -> bool:
    """尝试获取一个解析槽位，成功返回 True"""
    global _active_parse_count
    async with _parse_lock:
        if _active_parse_count >= _MAX_PARALLEL_PARSES:
            return False
        _active_parse_count += 1
        return True


async def _release_parse_slot() -> None:
    """释放一个解析槽位"""
    global _active_parse_count
    async with _parse_lock:
        _active_parse_count = max(0, _active_parse_count - 1)


def get_active_parse_count() -> int:
    return _active_parse_count


# ========== 数据清理 ==========

async def _cleanup_old_parse_data(db: AsyncSession, project_id: int) -> None:
    """按 FK 依赖顺序删除旧的解析数据"""
    # 1. 删除角色情绪（依赖 shot_id 和 character_id）
    shot_ids_stmt = select(StoryShot.id).where(StoryShot.project_id == project_id)
    await db.execute(
        delete(ShotCharacterEmotion).where(
            ShotCharacterEmotion.shot_id.in_(shot_ids_stmt)
        )
    )
    # 2. 删除分镜
    await db.execute(delete(StoryShot).where(StoryShot.project_id == project_id))
    # 3. 删除场景
    await db.execute(delete(StoryScene).where(StoryScene.project_id == project_id))
    # 4. 删除角色
    await db.execute(delete(StoryCharacter).where(StoryCharacter.project_id == project_id))
    await db.flush()


# ========== 进度更新辅助 ==========

async def _update_task_progress(
    db: AsyncSession,
    task: StoryParseTask,
    progress: float,
    message: str,
) -> None:
    """更新解析任务进度"""
    task.progress = progress
    task.message = message
    await db.commit()


# ========== 核心解析 ==========

async def parse_story(
    db: AsyncSession,
    project_id: int,
    llm_client: LLMClient,
    parse_task_id: int | None = None,
) -> dict:
    """
    解析故事文本，提取角色/场景/分镜/情绪并写入数据库

    Args:
        db: 数据库会话
        project_id: 项目 ID
        llm_client: LLM 客户端
        parse_task_id: 关联的解析任务 ID（后台模式下传入）

    Returns:
        统计信息 dict
    """
    # 加载项目
    project = await db.get(StoryProject, project_id)
    if not project:
        raise ValueError(f"项目 {project_id} 不存在")

    # 加载 parse task（如有）
    parse_task: StoryParseTask | None = None
    if parse_task_id:
        parse_task = await db.get(StoryParseTask, parse_task_id)

    # 1. 更新项目状态为 parsing
    project.status = ProjectStatus.PARSING
    if parse_task:
        parse_task.status = ParseTaskStatus.PROCESSING.value
        parse_task.started_at = datetime.now(timezone.utc)
        await _update_task_progress(db, parse_task, 0.1, "正在准备解析...")
    else:
        await db.commit()

    try:
        # 2. 清理旧数据
        await _cleanup_old_parse_data(db, project_id)
        if parse_task:
            await _update_task_progress(db, parse_task, 0.2, "正在调用 AI 模型解析故事...")

        # 3. 调用 LLM 解析
        user_prompt = build_story_parse_user_prompt(project.story_text)
        result = await llm_client.chat_json(
            system_prompt=STORY_PARSE_SYSTEM_PROMPT,
            user_prompt=user_prompt,
            provider=project.llm_provider or "deepseek",
            temperature=0.3,
            max_tokens=8192,
        )

        if parse_task:
            await _update_task_progress(db, parse_task, 0.5, "AI 解析完成，正在写入角色数据...")

        # 4. 写入角色
        char_name_to_id: dict[str, int] = {}
        for idx, char_data in enumerate(result.get("characters", [])):
            character = StoryCharacter(
                project_id=project_id,
                name=char_data["name"],
                gender=char_data.get("gender"),
                age=char_data.get("age"),
                role=char_data.get("role"),
                personality=char_data.get("personality"),
                appearance_brief=char_data.get("appearance_brief"),
                default_emotion=char_data.get("default_emotion", "calm"),
                sort_order=idx,
            )
            db.add(character)
            await db.flush()
            char_name_to_id[character.name] = character.id

        if parse_task:
            await _update_task_progress(db, parse_task, 0.6, "正在写入场景数据...")

        # 5. 写入场景
        scene_name_to_id: dict[str, int] = {}
        scene_appearance: Counter[str] = Counter()
        for shot_data in result.get("shots", []):
            sn = shot_data.get("scene_name", "")
            scene_appearance[sn] += 1

        for idx, scene_data in enumerate(result.get("scenes", [])):
            scene = StoryScene(
                project_id=project_id,
                name=scene_data["name"],
                location=scene_data.get("location"),
                time_of_day=scene_data.get("time_of_day"),
                weather=scene_data.get("weather"),
                atmosphere=scene_data.get("atmosphere"),
                appearance_count=scene_appearance.get(scene_data["name"], 0),
                sort_order=idx,
            )
            db.add(scene)
            await db.flush()
            scene_name_to_id[scene.name] = scene.id

        if parse_task:
            await _update_task_progress(db, parse_task, 0.7, "正在写入分镜和情绪数据...")

        # 6. 写入分镜 + 角色情绪
        shot_count = 0
        emotion_count = 0
        for idx, shot_data in enumerate(result.get("shots", [])):
            scene_name = shot_data.get("scene_name", "")
            scene_id = scene_name_to_id.get(scene_name)

            shot = StoryShot(
                project_id=project_id,
                scene_id=scene_id,
                shot_number=shot_data.get("shot_number", idx + 1),
                title=shot_data.get("title"),
                action_summary=shot_data.get("action_summary"),
                dialogue=shot_data.get("dialogue", ""),
                duration=shot_data.get("duration", 5),
                shot_type=shot_data.get("shot_type", "MS"),
                camera_angle=shot_data.get("camera_angle", "eye-level"),
                camera_movement=shot_data.get("camera_movement", "static"),
                atmosphere_emotion_tags=shot_data.get("atmosphere_emotion_tags"),
                status=ShotStatus.PENDING,
                sort_order=idx,
            )
            db.add(shot)
            await db.flush()
            shot_count += 1

            for emo_data in shot_data.get("character_emotions", []):
                char_name = emo_data.get("character_name", "")
                char_id = char_name_to_id.get(char_name)
                if char_id is None:
                    logger.warning(f"分镜 {shot.shot_number} 中引用了未知角色: {char_name}")
                    continue

                emotion = ShotCharacterEmotion(
                    shot_id=shot.id,
                    character_id=char_id,
                    emotion_tag=emo_data.get("emotion_tag", "calm"),
                    emotion_intensity=emo_data.get("emotion_intensity", 3),
                    expression_start=emo_data.get("expression_start"),
                    expression_peak=emo_data.get("expression_peak"),
                    expression_end=emo_data.get("expression_end"),
                    body_language=emo_data.get("body_language"),
                    emotion_transition=emo_data.get("emotion_transition", "stable"),
                )
                db.add(emotion)
                emotion_count += 1

        if parse_task:
            await _update_task_progress(db, parse_task, 0.9, "正在保存最终结果...")

        # 7. 更新项目状态
        stats = {
            "character_count": len(char_name_to_id),
            "scene_count": len(scene_name_to_id),
            "shot_count": shot_count,
            "emotion_count": emotion_count,
        }
        project.status = ProjectStatus.PARSED
        project.parse_metadata = stats

        # 8. 更新 parse task 状态
        if parse_task:
            parse_task.status = ParseTaskStatus.COMPLETED.value
            parse_task.progress = 1.0
            parse_task.message = "解析完成"
            parse_task.result_metadata = stats
            parse_task.completed_at = datetime.now(timezone.utc)

        await db.commit()

        logger.info(f"故事解析完成 — 项目 {project_id}: {stats}")
        return stats

    except Exception as e:
        # 回滚后重新加载实体
        await db.rollback()
        project = await db.get(StoryProject, project_id)
        if project:
            project.status = ProjectStatus.FAILED
            project.parse_metadata = {"error": str(e)}

        if parse_task_id:
            parse_task = await db.get(StoryParseTask, parse_task_id)
            if parse_task:
                parse_task.status = ParseTaskStatus.FAILED.value
                parse_task.progress = 0.0
                parse_task.message = "解析失败"
                parse_task.error_detail = str(e)
                parse_task.completed_at = datetime.now(timezone.utc)

        await db.commit()
        logger.error(f"故事解析失败 — 项目 {project_id}: {e}")
        raise


# ========== 后台运行入口 ==========

async def run_parse_in_background(project_id: int, parse_task_id: int) -> None:
    """在后台 asyncio task 中运行解析，使用独立 DB session"""
    try:
        async with async_session() as db:
            llm_client = get_llm_client()
            await parse_story(db, project_id, llm_client, parse_task_id)
    except Exception:
        logger.exception(f"后台解析任务失败 — 项目 {project_id}, 任务 {parse_task_id}")
    finally:
        await _release_parse_slot()
