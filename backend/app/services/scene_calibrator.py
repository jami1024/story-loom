"""
AI 场景描述校准服务 — 用 LLM 为场景生成精炼的 visual_prompt_zh
"""
import logging

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.story import StoryScene

logger = logging.getLogger(__name__)

SCENE_CALIBRATION_SYSTEM_PROMPT = """你是一位专业的电影美术指导，擅长将场景信息提炼为精炼的视觉描述。

你的任务：根据提供的场景基础信息，生成一段30-50字的中文视觉描述（visual_prompt），用于指导AI生成场景参考图片和视频。

要求：
1. 描述必须是纯视觉性的，聚焦于"画面中能看到什么"
2. 包含关键视觉锚点：空间特征、光线、色彩、标志性物件
3. 不要包含人物、故事情节、声音等非视觉元素
4. 使用精炼的中文短语，以逗号分隔
5. 直接输出描述文本，不要添加任何解释或标点符号以外的内容

示例输入：
地点：暗巷
时间：深夜
天气：雨
氛围：紧张压抑
建筑风格：赛博朋克
光影：霓虹灯反射
色彩：深蓝紫红

示例输出：
雨夜赛博朋克暗巷，霓虹灯映照湿滑路面，深蓝紫红色调，蒸汽管道交错，昏暗逼仄"""


def _build_calibration_user_prompt(
    scene: StoryScene,
    project_style: str | None = None,
) -> str:
    """构建校准请求的用户 prompt"""
    lines = [f"场景名称：{scene.name}"]

    if scene.location:
        lines.append(f"地点：{scene.location}")
    if scene.time_of_day:
        lines.append(f"时间：{scene.time_of_day}")
    if scene.weather:
        lines.append(f"天气：{scene.weather}")
    if scene.atmosphere:
        lines.append(f"氛围：{scene.atmosphere}")
    if scene.architecture_style:
        lines.append(f"建筑风格：{scene.architecture_style}")
    if scene.lighting_design:
        lines.append(f"光影：{scene.lighting_design}")
    if scene.color_palette:
        lines.append(f"色彩：{scene.color_palette}")
    if scene.key_props:
        props = scene.key_props if isinstance(scene.key_props, list) else []
        if props:
            lines.append(f"关键道具：{'、'.join(props)}")
    if scene.spatial_layout:
        lines.append(f"空间布局：{scene.spatial_layout}")
    if project_style:
        lines.append(f"项目风格：{project_style}")

    return "\n".join(lines)


async def calibrate_scene_visual_prompt(
    scene: StoryScene,
    llm_client,
    project_style: str | None = None,
    provider: str = "deepseek",
) -> str:
    """
    AI 校准：从场景基础信息生成精炼的视觉描述

    输入: scene 的 location/time/weather/atmosphere 等
    输出: "雨夜赛博朋克暗巷，霓虹灯映照湿滑路面，深蓝紫红色调，蒸汽弥漫"
    """
    user_prompt = _build_calibration_user_prompt(scene, project_style)

    visual_prompt = await llm_client.chat(
        system_prompt=SCENE_CALIBRATION_SYSTEM_PROMPT,
        user_prompt=user_prompt,
        provider=provider,
        temperature=0.5,
        max_tokens=200,
    )

    # 清理输出（去除引号、多余空白）
    visual_prompt = visual_prompt.strip().strip('"').strip("'").strip()

    return visual_prompt


async def calibrate_all_scenes(
    db: AsyncSession,
    project_id: int,
    llm_client,
    project_style: str | None = None,
    provider: str = "deepseek",
) -> list[dict]:
    """批量校准项目所有场景的 visual_prompt_zh"""
    from app.models.story import StoryProject

    # 查询项目风格
    if not project_style:
        project = await db.get(StoryProject, project_id)
        if project:
            project_style = project.style

    # 查询所有场景
    stmt = (
        select(StoryScene)
        .where(StoryScene.project_id == project_id)
        .order_by(StoryScene.sort_order)
    )
    result = await db.execute(stmt)
    scenes = list(result.scalars().all())

    if not scenes:
        return []

    results = []
    for scene in scenes:
        try:
            visual_prompt = await calibrate_scene_visual_prompt(
                scene=scene,
                llm_client=llm_client,
                project_style=project_style,
                provider=provider,
            )
            scene.visual_prompt_zh = visual_prompt
            results.append({
                "id": scene.id,
                "name": scene.name,
                "visual_prompt_zh": visual_prompt,
                "status": "success",
            })
            logger.info(f"场景 {scene.id} ({scene.name}) 校准完成: {visual_prompt}")
        except Exception as e:
            logger.error(f"场景 {scene.id} ({scene.name}) 校准失败: {e}")
            results.append({
                "id": scene.id,
                "name": scene.name,
                "status": "failed",
                "error": str(e),
            })

    await db.commit()
    return results
