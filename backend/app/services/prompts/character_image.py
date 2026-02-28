"""
角色图片生成 Prompt 模板 — 根据角色属性自动构建肖像图片 Prompt
"""


def build_character_image_prompt(
    name: str,
    gender: str | None = None,
    age: str | None = None,
    appearance_brief: str | None = None,
    personality: str | None = None,
    clothing: str | None = None,
    project_style: str | None = None,
) -> str:
    """
    构建角色肖像图片生成 Prompt

    输出示例:
    "一位35岁的男性将军，身披金甲，面容刚毅，电影感风格，半身肖像，白色背景"
    """
    parts = []

    # 主体描述：年龄 + 性别
    subject = ""
    if age:
        subject += f"{age}的"
    if gender:
        gender_map = {"male": "男性", "female": "女性"}
        subject += gender_map.get(gender, gender)
    else:
        subject += "人物"
    parts.append(f"一位{subject}")

    # 外貌描述
    if appearance_brief:
        parts.append(appearance_brief)

    # 服装
    if clothing:
        parts.append(clothing)

    # 性格转化为表情暗示
    if personality:
        # 取性格的简要部分作为表情提示
        personality_short = personality[:20] if len(personality) > 20 else personality
        parts.append(f"气质{personality_short}")

    # 风格
    style_map = {
        "cinematic": "电影感风格",
        "anime": "动漫风格",
        "realistic": "写实风格",
        "watercolor": "水彩画风格",
        "cyberpunk": "赛博朋克风格",
        "fantasy": "奇幻风格",
        "wuxia": "武侠风格",
    }
    style_text = style_map.get(project_style or "cinematic", project_style or "电影感风格")
    parts.append(style_text)

    # 固定后缀：肖像构图 + 干净背景
    parts.append("半身肖像")
    parts.append("纯色背景")
    parts.append("高品质")
    parts.append("细节丰富")

    return "，".join(parts)
