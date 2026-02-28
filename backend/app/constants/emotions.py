"""
情绪常量定义 — 18种情绪标签 + 5级强度 + 映射表
"""

# 18种情绪标签
EMOTION_TAGS: dict[str, dict] = {
    # 基础情绪（6种）
    "happy": {"zh": "开心", "en": "Happy", "visual_cue": "嘴角上扬，眼睛弯弯", "prompt_keyword": "smiling joyfully"},
    "sad": {"zh": "悲伤", "en": "Sad", "visual_cue": "眼眶泛红，嘴角下垂", "prompt_keyword": "looking sorrowful"},
    "angry": {"zh": "愤怒", "en": "Angry", "visual_cue": "怒目圆睁，咬紧牙关", "prompt_keyword": "furious expression"},
    "surprised": {"zh": "惊讶", "en": "Surprised", "visual_cue": "眼睛瞪大，嘴巴微张", "prompt_keyword": "shocked expression"},
    "fearful": {"zh": "恐惧", "en": "Fearful", "visual_cue": "面色苍白，身体颤抖", "prompt_keyword": "terrified look"},
    "calm": {"zh": "平静", "en": "Calm", "visual_cue": "表情舒展，目光平和", "prompt_keyword": "calm demeanor"},
    # 氛围情绪（6种）
    "tense": {"zh": "紧张", "en": "Tense", "visual_cue": "眉头紧锁，肌肉绷紧", "prompt_keyword": "tense atmosphere"},
    "excited": {"zh": "兴奋", "en": "Excited", "visual_cue": "瞳孔放大，身体前倾", "prompt_keyword": "excited energy"},
    "mysterious": {"zh": "神秘", "en": "Mysterious", "visual_cue": "眼神深邃，嘴角含笑", "prompt_keyword": "mysterious aura"},
    "romantic": {"zh": "浪漫", "en": "Romantic", "visual_cue": "目光温柔，面颊微红", "prompt_keyword": "romantic mood"},
    "funny": {"zh": "搞笑", "en": "Funny", "visual_cue": "忍俊不禁，表情夸张", "prompt_keyword": "comedic expression"},
    "touching": {"zh": "感动", "en": "Touching", "visual_cue": "热泪盈眶，嘴唇颤抖", "prompt_keyword": "deeply moved"},
    # 语气情绪（6种）
    "serious": {"zh": "严肃", "en": "Serious", "visual_cue": "面无表情，目光锐利", "prompt_keyword": "stern look"},
    "relaxed": {"zh": "轻松", "en": "Relaxed", "visual_cue": "神态悠闲，姿势随意", "prompt_keyword": "relaxed posture"},
    "playful": {"zh": "调侃", "en": "Playful", "visual_cue": "挑眉斜视，嘴角上挑", "prompt_keyword": "playful smirk"},
    "gentle": {"zh": "温柔", "en": "Gentle", "visual_cue": "目光柔和，动作轻缓", "prompt_keyword": "gentle gaze"},
    "passionate": {"zh": "激昂", "en": "Passionate", "visual_cue": "目光炯炯，声情并茂", "prompt_keyword": "passionate intensity"},
    "low": {"zh": "低沉", "en": "Low", "visual_cue": "垂头丧气，声音低哑", "prompt_keyword": "downcast expression"},
}

# 5级情绪强度
EMOTION_INTENSITIES: dict[int, dict] = {
    1: {"zh": "微弱", "en": "Subtle", "description": "几乎看不出，需仔细观察", "modifier": ""},
    2: {"zh": "轻度", "en": "Mild", "description": "隐约可见，有所克制", "modifier": "微微"},
    3: {"zh": "中等", "en": "Moderate", "description": "明显但自然，正常表达", "modifier": ""},
    4: {"zh": "强烈", "en": "Strong", "description": "溢于言表，难以掩饰", "modifier": "明显地"},
    5: {"zh": "极致", "en": "Extreme", "description": "情绪爆发，完全释放", "modifier": "极度"},
}

# 情绪变化方向
EMOTION_TRANSITIONS: list[dict] = [
    {"id": "rising", "zh": "升温", "description": "情绪逐渐加强"},
    {"id": "falling", "zh": "降温", "description": "情绪逐渐减弱"},
    {"id": "stable", "zh": "稳定", "description": "情绪维持不变"},
    {"id": "turning", "zh": "反转", "description": "情绪突然转变"},
]

# 景别代码 → Prompt 关键词
SHOT_TYPE_MAP: dict[str, str] = {
    "WS": "远景镜头",
    "LS": "全景镜头",
    "MS": "中景镜头",
    "CU": "近景特写",
    "ECU": "极致特写",
}

# 运镜代码 → Prompt 关键词
CAMERA_MOVEMENT_MAP: dict[str, str] = {
    "static": "固定镜头",
    "tracking": "跟踪镜头",
    "pan-left": "左摇镜头",
    "pan-right": "右摇镜头",
    "dolly-in": "推进镜头",
    "dolly-out": "拉远镜头",
    "crane-up": "上升镜头",
    "crane-down": "下降镜头",
}

# 运镜 → 运动强度映射
CAMERA_MOTION_INTENSITY_MAP: dict[str, str] = {
    "static": "gentle motion",
    "tracking": "moderate motion",
    "pan-left": "moderate motion",
    "pan-right": "moderate motion",
    "dolly-in": "moderate motion",
    "dolly-out": "moderate motion",
    "crane-up": "intense motion",
    "crane-down": "intense motion",
}

# 情绪标签 → 视觉描述（用于 Prompt 组装）
EMOTION_VISUAL_MAP: dict[str, str] = {
    "happy": "面露微笑",
    "sad": "神情忧伤",
    "angry": "怒目而视",
    "surprised": "表情惊愕",
    "fearful": "面露恐惧",
    "calm": "表情平静",
    "tense": "神情紧绷",
    "excited": "兴奋激动",
    "mysterious": "表情深邃",
    "romantic": "含情脉脉",
    "funny": "忍俊不禁",
    "touching": "热泪盈眶",
    "serious": "表情严肃",
    "relaxed": "神态悠闲",
    "playful": "嬉皮笑脸",
    "gentle": "温柔以对",
    "passionate": "慷慨激昂",
    "low": "面色阴沉",
}
