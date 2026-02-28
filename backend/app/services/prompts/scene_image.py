"""
场景参考图片 Prompt 构建器 — 根据场景属性自动构建宽景图片 Prompt
"""


# 复用 character_image.py 的风格映射
STYLE_MAP = {
    "cinematic": "电影感风格",
    "anime": "动漫风格",
    "realistic": "写实风格",
    "watercolor": "水彩画风格",
    "cyberpunk": "赛博朋克风格",
    "fantasy": "奇幻风格",
    "wuxia": "武侠风格",
    "ghibli": "吉卜力风格",
    "ink": "水墨画风格",
    "guoman": "国漫风格",
}


def build_scene_image_prompt(
    name: str,
    location: str | None = None,
    time_of_day: str | None = None,
    weather: str | None = None,
    atmosphere: str | None = None,
    architecture_style: str | None = None,
    lighting_design: str | None = None,
    color_palette: str | None = None,
    key_props: list[str] | None = None,
    spatial_layout: str | None = None,
    visual_prompt_zh: str | None = None,
    project_style: str | None = None,
) -> str:
    """
    构建场景参考图片 Prompt

    优先使用 visual_prompt_zh（AI 校准后的精炼描述），
    否则从基础字段拼接。

    输出示例:
    "赛博朋克风格的雨夜街道，霓虹灯映照湿滑路面，深蓝紫红色调，
     蒸汽管道交错，电影感风格，宽景构图，无人物，高品质"
    """
    parts = []

    # 优先使用 AI 校准后的 visual_prompt_zh
    if visual_prompt_zh:
        parts.append(visual_prompt_zh)
    else:
        # 降级：从基础字段拼接
        scene_parts = []
        if location:
            scene_parts.append(location)
        if time_of_day:
            scene_parts.append(time_of_day)
        if weather and weather not in ("晴", "无"):
            scene_parts.append(weather)
        if atmosphere:
            scene_parts.append(atmosphere)
        if scene_parts:
            parts.append("，".join(scene_parts))

    # 补充视觉细节
    if architecture_style:
        parts.append(architecture_style)
    if lighting_design:
        parts.append(lighting_design)
    if color_palette:
        parts.append(f"{color_palette}色调")
    if key_props:
        parts.append("，".join(key_props[:3]))
    if spatial_layout:
        parts.append(spatial_layout)

    # 风格
    style_text = STYLE_MAP.get(project_style or "cinematic", project_style or "电影感风格")
    parts.append(style_text)

    # 固定后缀：宽景构图 + 无人物 + 高品质
    parts.append("宽景构图")
    parts.append("无人物")
    parts.append("高品质")
    parts.append("细节丰富")

    return "，".join(parts)
