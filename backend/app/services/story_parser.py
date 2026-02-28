"""
故事解析服务 — 调用 LLM 解析故事文本并写入数据库
"""
import logging
from collections import Counter

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.story import (
    ProjectStatus,
    ShotCharacterEmotion,
    ShotStatus,
    StoryCharacter,
    StoryProject,
    StoryScene,
    StoryShot,
)
from app.services.llm_client import LLMClient
from app.services.prompts.story_parse import (
    STORY_PARSE_SYSTEM_PROMPT,
    build_story_parse_user_prompt,
)

logger = logging.getLogger(__name__)


async def parse_story(
    db: AsyncSession,
    project: StoryProject,
    llm_client: LLMClient,
) -> dict:
    """
    解析故事文本，提取角色/场景/分镜/情绪并写入数据库

    Returns:
        统计信息 dict
    """
    # 1. 更新项目状态为 parsing
    project.status = ProjectStatus.PARSING
    await db.commit()

    try:
        # 2. 调用 LLM 解析
        user_prompt = build_story_parse_user_prompt(project.story_text)
        result = await llm_client.chat_json(
            system_prompt=STORY_PARSE_SYSTEM_PROMPT,
            user_prompt=user_prompt,
            provider=project.llm_provider or "deepseek",
            temperature=0.3,
            max_tokens=8192,
        )

        # 3. 写入角色
        char_name_to_id: dict[str, int] = {}
        for idx, char_data in enumerate(result.get("characters", [])):
            character = StoryCharacter(
                project_id=project.id,
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

        # 4. 写入场景
        scene_name_to_id: dict[str, int] = {}
        scene_appearance: Counter[str] = Counter()
        # 先统计场景出场次数
        for shot_data in result.get("shots", []):
            sn = shot_data.get("scene_name", "")
            scene_appearance[sn] += 1

        for idx, scene_data in enumerate(result.get("scenes", [])):
            scene = StoryScene(
                project_id=project.id,
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

        # 5. 写入分镜 + 角色情绪
        shot_count = 0
        emotion_count = 0
        for idx, shot_data in enumerate(result.get("shots", [])):
            scene_name = shot_data.get("scene_name", "")
            scene_id = scene_name_to_id.get(scene_name)

            shot = StoryShot(
                project_id=project.id,
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

            # 写入角色级情绪
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

        # 6. 更新项目状态
        project.status = ProjectStatus.PARSED
        project.parse_metadata = {
            "character_count": len(char_name_to_id),
            "scene_count": len(scene_name_to_id),
            "shot_count": shot_count,
            "emotion_count": emotion_count,
        }
        await db.commit()

        stats = {
            "character_count": len(char_name_to_id),
            "scene_count": len(scene_name_to_id),
            "shot_count": shot_count,
            "emotion_count": emotion_count,
        }
        logger.info(f"故事解析完成 — 项目 {project.id}: {stats}")
        return stats

    except Exception as e:
        project.status = ProjectStatus.FAILED
        project.parse_metadata = {"error": str(e)}
        await db.commit()
        logger.error(f"故事解析失败 — 项目 {project.id}: {e}")
        raise
