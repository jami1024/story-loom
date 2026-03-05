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
    gender_map = {"male": "男性", "female": "女性", "animal": "动物"}
    gender_text = gender_map.get(gender or "", gender or "")
    is_animal = gender == "animal"

    if is_animal:
        # 动物角色不加"一位"前缀
        parts.append(name or "动物角色")
    else:
        subject = ""
        if age:
            subject += f"{age}的"
        subject += gender_text or "人物"
        # 通过角色名推断是否为中国/东亚角色，中文名默认加"中国人"特征
        is_chinese = bool(name and all('\u4e00' <= c <= '\u9fff' for c in name.strip()))
        if is_chinese:
            parts.append(f"一位{subject}，中国人，东亚面孔")
        else:
            parts.append(f"一位{subject}")

    # 外貌描述
    if appearance_brief:
        parts.append(appearance_brief)

    # 服装
    if clothing:
        parts.append(clothing)

    # 性格转化为表情暗示（非动物角色）
    if personality and not is_animal:
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

    # 固定后缀：构图 + 干净背景
    if is_animal:
        parts.append("全身像")
    else:
        parts.append("半身肖像")
    parts.append("纯色背景")
    parts.append("高品质")
    parts.append("细节丰富")

    return "，".join(parts)
