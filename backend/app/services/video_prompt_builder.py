"""
视频 Prompt 5层语义组装器
"""
import logging

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.constants.emotions import (
    CAMERA_MOTION_INTENSITY_MAP,
    CAMERA_MOVEMENT_MAP,
    EMOTION_INTENSITIES,
    EMOTION_VISUAL_MAP,
    SHOT_TYPE_MAP,
)
from app.models.story import ShotCharacterEmotion, ShotStatus, StoryScene, StoryShot

logger = logging.getLogger(__name__)


def _extract_visual_anchor(text: str, max_len: int = 30) -> str:
    """从完整视觉描述中截取关键片段作为视觉锚点"""
    if not text:
        return ""
    # 按逗号分割，取前几段直到达到长度限制
    segments = text.split("，")
    result = segments[0]
    for seg in segments[1:]:
        candidate = result + "，" + seg
        if len(candidate) > max_len:
            break
        result = candidate
    return result[:max_len]


def build_video_prompt(
    shot: StoryShot,
    character_emotions: list[ShotCharacterEmotion],
    scene: StoryScene | None,
    project_style: str | None,
) -> str:
    """
    5层语义组装视频 Prompt

    Layer 1: Camera  — 运镜 + 景别
    Layer 2: Setting — 场景视觉锚点 + 地点 + 时间 + 天气 + 光影 + 色彩
    Layer 3: Subject — 角色外貌 + 动作 + 情绪表情 + 肢体语言
    Layer 4: Mood    — 分镜级氛围标签
    Layer 5: Style   — 全局风格 + 运动强度
    """
    parts: list[str] = []

    # Layer 1: Camera
    camera_parts = []
    movement = CAMERA_MOVEMENT_MAP.get(shot.camera_movement or "static", "固定镜头")
    shot_type = SHOT_TYPE_MAP.get(shot.shot_type or "MS", "中景镜头")
    camera_parts.append(f"{movement}{shot_type}")
    parts.append("".join(camera_parts))

    # Layer 2: Setting — 融入场景视觉锚点
    setting_parts = []
    if scene:
        if scene.visual_prompt_zh:
            # 优先用 AI 校准后的精炼描述（截取前30字作为锚点）
            setting_parts.append(_extract_visual_anchor(scene.visual_prompt_zh, max_len=30))
        else:
            # 降级：基础字段拼接
            if scene.location:
                setting_parts.append(scene.location)
            if scene.time_of_day:
                setting_parts.append(scene.time_of_day)
            if scene.weather and scene.weather not in ("晴", "无"):
                setting_parts.append(scene.weather)

        # 补充视觉细节
        if scene.lighting_design:
            setting_parts.append(scene.lighting_design)
        if scene.color_palette:
            setting_parts.append(scene.color_palette)

    if setting_parts:
        parts.append("".join(setting_parts))

    # Layer 3: Subject — 角色+情绪注入
    if shot.action_summary:
        subject_parts = []
        for emo in character_emotions:
            char = emo.character
            char_desc = []

            # 角色外貌简述
            if char and char.appearance_brief:
                char_desc.append(char.appearance_brief)

            # 情绪表情（使用 expression_peak 或 EMOTION_VISUAL_MAP）
            intensity = emo.emotion_intensity or 3
            modifier = EMOTION_INTENSITIES.get(intensity, {}).get("modifier", "")
            if emo.expression_peak:
                expr = f"{modifier}{emo.expression_peak}" if modifier else emo.expression_peak
                char_desc.append(expr)
            else:
                visual = EMOTION_VISUAL_MAP.get(emo.emotion_tag, "")
                if visual:
                    expr = f"{modifier}{visual}" if modifier else visual
                    char_desc.append(expr)

            # 肢体语言
            if emo.body_language:
                char_desc.append(emo.body_language)

            if char_desc:
                subject_parts.append("".join(char_desc))

        # 组合动作描述和角色
        if subject_parts:
            parts.append("，".join(subject_parts))
        else:
            parts.append(shot.action_summary)
    elif shot.action_summary:
        parts.append(shot.action_summary)

    # Layer 4: Mood
    tags = shot.atmosphere_emotion_tags or []
    if tags:
        tag_names = []
        for tag in tags[:2]:
            info = EMOTION_VISUAL_MAP.get(tag)
            if info:
                tag_names.append(info)
        if tag_names:
            parts.append("转".join(tag_names) + "氛围")

    # Layer 5: Style + motion
    style = project_style or "cinematic"
    style_map = {
        "cinematic": "电影感",
        "anime": "动漫风格",
        "ghibli": "吉卜力风格",
        "cyberpunk": "赛博朋克",
        "watercolor": "水彩画风格",
        "ink": "水墨画风格",
        "guoman": "国漫风格",
    }
    style_text = style_map.get(style, style)
    motion = CAMERA_MOTION_INTENSITY_MAP.get(shot.camera_movement or "static", "gentle motion")
    parts.append(f"{style_text}，{motion}")

    prompt = "，".join(parts)
    return _truncate_prompt(prompt)


def _truncate_prompt(prompt: str, max_len: int = 95) -> str:
    """智能截断 Prompt 到指定长度"""
    if len(prompt) <= max_len:
        return prompt

    # 按逗号分段，保留首尾（Camera + Style），中间按优先级截断
    segments = prompt.split("，")
    if len(segments) <= 2:
        return prompt[:max_len]

    # 保留第一段（Camera）和最后两段（Style + motion）
    head = segments[0]
    tail = "，".join(segments[-2:])
    middle = segments[1:-2]

    result = head
    for seg in middle:
        candidate = result + "，" + seg
        if len(candidate + "，" + tail) <= max_len:
            result = candidate
        else:
            break

    result = result + "，" + tail
    if len(result) > max_len:
        return result[:max_len]
    return result


async def build_all_prompts(db: AsyncSession, project_id: int, project_style: str | None = None) -> list[dict]:
    """为项目所有分镜批量组装 Prompt"""
    stmt = (
        select(StoryShot)
        .where(StoryShot.project_id == project_id)
        .options(
            selectinload(StoryShot.scene),
            selectinload(StoryShot.character_emotions).selectinload(ShotCharacterEmotion.character),
        )
        .order_by(StoryShot.sort_order)
    )
    result = await db.execute(stmt)
    shots = list(result.scalars().all())

    prompts = []
    for shot in shots:
        scene = shot.scene
        prompt = build_video_prompt(
            shot=shot,
            character_emotions=shot.character_emotions,
            scene=scene,
            project_style=project_style,
        )
        shot.video_prompt = prompt
        shot.status = ShotStatus.PROMPT_READY
        prompts.append({
            "shot_id": shot.id,
            "shot_number": shot.shot_number,
            "title": shot.title,
            "video_prompt": prompt,
            "char_count": len(prompt),
        })

    await db.commit()
    logger.info(f"项目 {project_id} 批量组装完成，共 {len(prompts)} 个分镜")
    return prompts
