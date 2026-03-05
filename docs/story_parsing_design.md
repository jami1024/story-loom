# StoryLoom 故事解析功能设计方案

> 版本：v1.0 | 日期：2026-02-28

## 一、背景

StoryLoom 目前只支持"单条 Prompt → 单个视频"的简单流程。本方案新增"输入一段故事文本，自动拆分场景、提取角色、标注角色级情绪，批量生成视频 Prompt"的功能。

### 参考项目

| 项目 | 技术栈 | 借鉴要点 |
|------|--------|---------|
| [Toonflow](https://github.com/HBAI-Ltd/Toonflow-app) | Electron + Node.js | Prompt 模板数据库存储 + 可自定义，Multi-Agent 协作 |
| [魔因漫创](https://github.com/MemeCalculate/moyin-creator) | Electron + Next.js | 18种预设情绪标签，5层语义 Prompt 组装，6层角色身份锚点 |
| [火宝短剧](https://github.com/chatfire-AI/huobao-drama) | Go + Vue | 清晰的 DDD 分层，情绪强度量化，首帧/高潮/尾帧三时间点表情 |

### 核心创新

三个参考项目的情绪都是**分镜级**（一个分镜一个情绪），本方案做到**角色级**（一个分镜中每个角色独立情绪）。

---

## 二、核心流程

```
用户输入故事文本
       ↓
[LLM 解析] (多模型 LLM，可切换)
       ↓
  结构化输出 JSON
  ├── 角色列表 (名字/性别/年龄/外貌/性格)
  ├── 场景列表 (地点/时间/天气/氛围)
  └── 分镜列表
       └── 每个分镜
            ├── 镜头语言 (景别/角度/运镜)
            ├── 动作描述 + 对白
            ├── 氛围情绪标签 (分镜整体)
            └── 角色级情绪 ← 核心创新
                 ├── 角色A: 愤怒(4级) + 起始/高潮/结束表情 + 肢体语言
                 └── 角色B: 恐惧(3级) + 起始/高潮/结束表情 + 肢体语言
       ↓
  用户可编辑/调整所有数据
       ↓
  [规则引擎] 5层语义组装 Prompt (≤95字)
       ↓
调用视频模型通道生成 4K 视频
```

---

## 三、数据模型设计

### 3.1 ER 关系

```
StoryProject (故事项目)
├── 1:N → StoryCharacter (角色)
├── 1:N → StoryScene (场景)
└── 1:N → StoryShot (分镜)
              ├── N:1 → StoryScene
              └── 1:N → ShotCharacterEmotion (角色级情绪)
                           ├── N:1 → StoryShot
                           └── N:1 → StoryCharacter
```

### 3.2 StoryProject（故事项目）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT PK | 主键 |
| title | VARCHAR(200) | 项目标题 |
| story_text | TEXT | 原始故事文本 |
| genre | VARCHAR(50) | 类型：武侠/科幻/爱情/悬疑/喜剧等 |
| style | VARCHAR(50) | 视觉风格：cinematic/anime/ghibli/cyberpunk/watercolor/ink |
| status | ENUM | draft/parsing/parsed/ready/generating/completed/failed |
| default_ratio | VARCHAR(16) | 默认视频比例，默认 16:9 |
| default_duration | INT | 默认时长，1=5s, 2=10s |
| llm_provider | VARCHAR(50) | LLM 提供商：deepseek/zhipu |
| parse_metadata | JSON | 解析过程的元数据（token 用量等） |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 更新时间 |

### 3.3 StoryCharacter（角色）

| 字段 | 类型 | 说明 | 阶段 |
|------|------|------|------|
| id | INT PK | 主键 | |
| project_id | INT FK | 关联项目 | |
| name | VARCHAR(100) | 角色名 | P0-解析 |
| gender | VARCHAR(20) | 性别 | P0-解析 |
| age | VARCHAR(50) | 年龄描述 | P0-解析 |
| role | VARCHAR(50) | protagonist/supporting/minor | P0-解析 |
| personality | TEXT | 性格特点 | P0-解析 |
| appearance_brief | TEXT | 外貌简述（30字内） | P0-解析 |
| appearance_detail | TEXT | 详细外貌描述（200字） | P1-校准 |
| clothing | TEXT | 服装描述 | P1-校准 |
| visual_prompt_zh | TEXT | 中文视觉 Prompt | P1-校准 |
| visual_prompt_en | TEXT | 英文视觉 Prompt | P1-校准 |
| identity_anchors | JSON | 身份锚点（脸型/眼型/标记/色值） | P1-校准 |
| default_emotion | VARCHAR(50) | 默认情绪倾向 | P0-解析 |
| emotion_range | JSON | 情绪范围（常见/极端/禁止） | P1-校准 |
| sort_order | INT | 排序 | |
| created_at | DATETIME | 创建时间 | |
| updated_at | DATETIME | 更新时间 | |

### 3.4 StoryScene（场景）

| 字段 | 类型 | 说明 | 阶段 |
|------|------|------|------|
| id | INT PK | 主键 | |
| project_id | INT FK | 关联项目 | |
| name | VARCHAR(200) | 场景名称 | P0-解析 |
| location | VARCHAR(200) | 地点描述 | P0-解析 |
| time_of_day | VARCHAR(100) | 时间：清晨/正午/黄昏/深夜 | P0-解析 |
| weather | VARCHAR(100) | 天气：晴/雨/雪/雾 | P0-解析 |
| atmosphere | VARCHAR(200) | 氛围简述 | P0-解析 |
| architecture_style | VARCHAR(200) | 建筑/环境风格 | P1-校准 |
| lighting_design | VARCHAR(200) | 光影设计 | P1-校准 |
| color_palette | VARCHAR(200) | 色彩基调 | P1-校准 |
| key_props | JSON | 关键道具列表 | P1-校准 |
| spatial_layout | TEXT | 空间布局描述 | P1-校准 |
| visual_prompt_zh | TEXT | 中文场景 Prompt | P1-校准 |
| visual_prompt_en | TEXT | 英文场景 Prompt | P1-校准 |
| appearance_count | INT | 出场次数 | P0-解析 |
| sort_order | INT | 排序 | |
| created_at | DATETIME | 创建时间 | |
| updated_at | DATETIME | 更新时间 | |

### 3.5 StoryShot（分镜）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT PK | 主键 |
| project_id | INT FK | 关联项目 |
| scene_id | INT FK | 关联场景 |
| shot_number | INT | 分镜序号 |
| title | VARCHAR(100) | 分镜标题（3-5字） |
| action_summary | TEXT | 动作描述（30-80字） |
| dialogue | TEXT | 对白内容 |
| duration | INT | 预估时长（秒） |
| shot_type | VARCHAR(50) | 景别：WS(远景)/LS(全景)/MS(中景)/CU(近景)/ECU(特写) |
| camera_angle | VARCHAR(50) | 角度：eye-level/high-angle/low-angle/over-shoulder/dutch-angle |
| camera_movement | VARCHAR(50) | 运镜：static/tracking/pan-left/pan-right/dolly-in/dolly-out/crane-up/crane-down |
| atmosphere_emotion_tags | JSON | 氛围情绪标签数组（有序，表示变化） |
| video_prompt | TEXT | 最终视频生成 Prompt |
| status | ENUM | pending/prompt_ready/generating/completed/failed |
| video_task_chat_id | VARCHAR(64) | 关联的视频任务 chat_id |
| video_url | VARCHAR(512) | 生成的视频 URL |
| sort_order | INT | 排序 |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 更新时间 |

### 3.6 ShotCharacterEmotion（角色级情绪 — 核心创新）

三个参考项目都只有分镜级情绪，本表实现角色级情绪。

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT PK | 主键 |
| shot_id | INT FK | 关联分镜 |
| character_id | INT FK | 关联角色 |
| emotion_tag | VARCHAR(50) | 主情绪标签（18种之一） |
| emotion_intensity | INT | 情绪强度 1-5 |
| expression_start | VARCHAR(200) | 起始表情，如"眉头紧皱，双眼怒视" |
| expression_peak | VARCHAR(200) | 高潮表情，如"怒目圆睁，面部涨红" |
| expression_end | VARCHAR(200) | 结束表情，如"表情缓和，露出失望" |
| body_language | VARCHAR(300) | 肢体语言，如"右手拔剑前指，身体前倾" |
| emotion_transition | VARCHAR(100) | 变化方向：rising/falling/stable/turning |

**唯一约束**：(shot_id, character_id) — 一个分镜中一个角色只有一条情绪记录

### 3.7 现有模型扩展

在 `VideoTask` 表新增可选字段：

| 字段 | 类型 | 说明 |
|------|------|------|
| shot_id | INT FK (nullable) | 关联的故事分镜 ID |

---

## 四、角色情绪系统

### 4.1 预设情绪标签（18种）

#### 基础情绪（6种）

| ID | 中文 | 英文 | 视觉线索 |
|----|------|------|---------|
| happy | 开心 | Happy | 嘴角上扬，眼睛弯弯 |
| sad | 悲伤 | Sad | 眼眶泛红，嘴角下垂 |
| angry | 愤怒 | Angry | 怒目圆睁，咬紧牙关 |
| surprised | 惊讶 | Surprised | 眼睛瞪大，嘴巴微张 |
| fearful | 恐惧 | Fearful | 面色苍白，身体颤抖 |
| calm | 平静 | Calm | 表情舒展，目光平和 |

#### 氛围情绪（6种）

| ID | 中文 | 英文 | 视觉线索 |
|----|------|------|---------|
| tense | 紧张 | Tense | 眉头紧锁，肌肉绷紧 |
| excited | 兴奋 | Excited | 瞳孔放大，身体前倾 |
| mysterious | 神秘 | Mysterious | 眼神深邃，嘴角含笑 |
| romantic | 浪漫 | Romantic | 目光温柔，面颊微红 |
| funny | 搞笑 | Funny | 忍俊不禁，表情夸张 |
| touching | 感动 | Touching | 热泪盈眶，嘴唇颤抖 |

#### 语气情绪（6种）

| ID | 中文 | 英文 | 视觉线索 |
|----|------|------|---------|
| serious | 严肃 | Serious | 面无表情，目光锐利 |
| relaxed | 轻松 | Relaxed | 神态悠闲，姿势随意 |
| playful | 调侃 | Playful | 挑眉斜视，嘴角上挑 |
| gentle | 温柔 | Gentle | 目光柔和，动作轻缓 |
| passionate | 激昂 | Passionate | 目光炯炯，声情并茂 |
| low | 低沉 | Low | 垂头丧气，声音低哑 |

### 4.2 情绪强度（5级）

| 等级 | 中文 | 英文 | 说明 | Prompt 修饰词 |
|------|------|------|------|--------------|
| 1 | 微弱 | Subtle | 几乎看不出，需仔细观察 | （不修饰） |
| 2 | 轻度 | Mild | 隐约可见，有所克制 | 微微 |
| 3 | 中等 | Moderate | 明显但自然，正常表达 | （不修饰） |
| 4 | 强烈 | Strong | 溢于言表，难以掩饰 | 明显地 |
| 5 | 极致 | Extreme | 情绪爆发，完全释放 | 极度 |

### 4.3 情绪变化方向（4种）

| ID | 中文 | 说明 |
|----|------|------|
| rising | 升温 | 情绪逐渐加强 |
| falling | 降温 | 情绪逐渐减弱 |
| stable | 稳定 | 情绪维持不变 |
| turning | 反转 | 情绪突然转变 |

### 4.4 情绪数据流

```
[LLM解析] 自动标注每个角色在每个分镜的情绪
       ↓
[数据库] 存入 ShotCharacterEmotion 表
       ↓
[前端] 用户可编辑情绪标签、强度、表情描述
       ↓
[Prompt组装] 将 expression_peak + body_language 注入 Subject 层
       ↓
[视频生成] 视频模型通道接收含角色情绪的 Prompt
```

### 4.5 与三个参考项目的对比

| 维度 | Toonflow | Moyin | Huobao | **StoryLoom** |
|------|----------|-------|--------|-------------|
| 粒度 | 片段级 | 分镜级 | 分镜级+帧级 | **角色级** |
| 表达方式 | 自由文本 | 预设标签(18种) | 自由文本+强度 | **标签+强度+三时间点表情+肢体** |
| 情绪变化 | 整集情绪曲线 | 标签有序排列 | "A转B"描述 | **有序标签+变化方向** |
| 量化 | 无 | 无 | 5级(-1~3) | **5级(1~5)** |
| 角色绑定 | 不绑角色 | 不绑角色 | 不绑角色 | **绑定到每个角色** |
| Prompt注入 | 隐式 | Mood层 | 帧级prompt | **Subject层(角色描述内)** |

---

## 五、视频 Prompt 组装

### 5.1 五层语义架构

参考魔因漫创的 `prompt-builder.ts`，适配视频模型的 95 字限制：

```
Layer 1: Camera    — 运镜 + 景别 + 角度        （最高优先级）
Layer 2: Setting   — 场景地点 + 时间 + 天气
Layer 3: Subject   — 角色外貌 + 动作 + 情绪表情 + 肢体语言  ← 情绪注入点
Layer 4: Mood      — 分镜级氛围标签
Layer 5: Style     — 全局风格 + 运动强度
```

### 5.2 映射表

#### 景别映射

| 代码 | Prompt 关键词 |
|------|-------------|
| WS | 远景镜头 |
| LS | 全景镜头 |
| MS | 中景镜头 |
| CU | 近景特写 |
| ECU | 极致特写 |

#### 运镜映射

| 代码 | Prompt 关键词 |
|------|-------------|
| static | 固定镜头 |
| tracking | 跟踪镜头 |
| pan-left | 左摇镜头 |
| pan-right | 右摇镜头 |
| dolly-in | 推进镜头 |
| dolly-out | 拉远镜头 |
| crane-up | 上升镜头 |
| crane-down | 下降镜头 |

#### 运动强度映射

| 运镜 | 运动强度 |
|------|---------|
| static | gentle motion |
| tracking / pan / dolly | moderate motion |
| crane | intense motion |

#### 情绪→视觉映射

| 标签 | 视觉描述 |
|------|---------|
| happy | 面露微笑 |
| sad | 神情忧伤 |
| angry | 怒目而视 |
| surprised | 表情惊愕 |
| fearful | 面露恐惧 |
| calm | 表情平静 |
| tense | 神情紧绷 |
| excited | 兴奋激动 |
| mysterious | 表情深邃 |
| romantic | 含情脉脉 |
| funny | 忍俊不禁 |
| touching | 热泪盈眶 |
| serious | 表情严肃 |
| relaxed | 神态悠闲 |
| playful | 嬉皮笑脸 |
| gentle | 温柔以对 |
| passionate | 慷慨激昂 |
| low | 面色阴沉 |

### 5.3 情绪注入策略

1. **Subject 层注入（优先级最高）**：将角色的 `expression_peak` + `body_language` 直接嵌入主体描述
2. **强度调节**：`emotion_intensity` 通过修饰词影响描述（"微微"/"明显地"/"极度"）
3. **Mood 层补充**：分镜级 `atmosphere_emotion_tags` 设定整体氛围
4. **变化链**（P2）：多标签时构建"从A转为B"描述

### 5.4 组装示例

**输入数据**：
- 分镜：中景，跟踪镜头，古代战场黄昏
- 角色A（将军）：angry, intensity=4, peak="怒目圆睁面部涨红", body="双手握拳"
- 角色B（谋士）：sad, intensity=2, peak="面色忧虑", body="低头沉思"
- 氛围：[tense, serious]
- 风格：guoman

**组装结果**（78字）：
```
跟踪镜头中景，古代战场黄昏，身披金甲的将军明显地怒目圆睁面部涨红双手握拳，
身旁白衣谋士微微面色忧虑低头沉思，紧张转严肃氛围，国漫风格，moderate motion
```

### 5.5 智能截断

当超过 95 字时，按优先级截断：
1. 保留 Layer 1 (Camera) — 必须
2. 保留 Layer 2 (Setting) — 必须
3. 保留 Layer 3 (Subject) — 尽量保留，多角色时截断次要角色
4. 省略 Layer 4 (Mood)
5. 保留 Layer 5 (Style + motion) — 必须

---

## 六、LLM Prompt 模板

### 6.1 故事解析 Prompt（P0 核心）

#### 系统提示词

```
你是一位专业的影视编剧和分镜师。你的任务是将用户提供的故事文本解析为结构化的影视制作数据。

【解析原则】
1. 角色提取: 识别所有有名字的角色，提取基本信息
2. 场景提取: 识别所有不同的场景地点和时间
3. 分镜拆解: 按"独立动作单元"原则拆分，一个动作=一个分镜
4. 角色级情绪: 【最重要】每个分镜中的每个出场角色，必须标注独立的情绪状态

【情绪标签可选值】(每个角色独立选择)
基础情绪: happy(开心), sad(悲伤), angry(愤怒), surprised(惊讶), fearful(恐惧), calm(平静)
氛围情绪: tense(紧张), excited(兴奋), mysterious(神秘), romantic(浪漫), funny(搞笑), touching(感动)
语气情绪: serious(严肃), relaxed(轻松), playful(调侃), gentle(温柔), passionate(激昂), low(低沉)

【情绪强度】1-5级
1=微弱(几乎看不出) 2=轻度(隐约可见) 3=中等(明显但克制) 4=强烈(溢于言表) 5=极致(情绪爆发)

【景别可选值】
WS(远景) LS(全景) MS(中景) CU(近景) ECU(特写)

【角度可选值】
eye-level(平视) high-angle(俯拍) low-angle(仰拍) over-shoulder(过肩) dutch-angle(荷兰角)

【运镜可选值】
static(固定) tracking(跟拍) pan-left(左摇) pan-right(右摇) dolly-in(推进) dolly-out(拉远) crane-up(升) crane-down(降)

【输出格式】严格JSON:
{
  "characters": [
    {
      "name": "角色名",
      "gender": "male/female/other",
      "age": "年龄描述",
      "role": "protagonist/supporting/minor",
      "personality": "性格描述(50字内)",
      "appearance_brief": "外貌简述(30字内)"
    }
  ],
  "scenes": [
    {
      "name": "场景名称",
      "location": "地点详细描述",
      "time_of_day": "时间",
      "weather": "天气",
      "atmosphere": "氛围描述(20字内)"
    }
  ],
  "shots": [
    {
      "shot_number": 1,
      "title": "分镜标题(3-5字)",
      "scene_name": "关联的场景name(必须匹配scenes中的name)",
      "action_summary": "详细动作描述(30-80字)",
      "dialogue": "对白内容(无则空字符串)",
      "duration": 5,
      "shot_type": "MS",
      "camera_angle": "eye-level",
      "camera_movement": "static",
      "atmosphere_emotion_tags": ["tense", "serious"],
      "character_emotions": [
        {
          "character_name": "角色名(必须匹配characters中的name)",
          "emotion_tag": "angry",
          "emotion_intensity": 4,
          "expression_start": "眉头紧皱，双眼怒视",
          "expression_peak": "怒目圆睁，面部涨红",
          "expression_end": "表情缓和，露出疲惫",
          "body_language": "双手握拳，身体前倾",
          "emotion_transition": "rising"
        }
      ]
    }
  ]
}

【关键约束】
- 每个分镜的character_emotions必须包含该分镜中所有出场角色
- character_name和scene_name必须与前面定义的完全匹配
- 所有描述性字段要详尽具体，为视频生成AI提供足够信息
- 分镜数量: 短故事(500字以下)5-15个，中等(500-2000字)15-40个，长故事(2000字以上)40-80个
- emotion_transition: rising(升温) falling(降温) stable(稳定) turning(反转)
```

#### 用户消息模板

```
请解析以下故事文本:

---
{story_text}
---

要求:
1. 提取所有角色及其基本信息
2. 识别所有场景
3. 按独立动作单元拆解为分镜
4. 【最重要】为每个分镜中的每个出场角色标注独立的情绪、表情和肢体语言
5. 输出严格JSON格式
```

### 6.2 角色校准 Prompt（P1）

```
你是一位专业的角色设计师和AI图像生成专家。

【任务】根据已有的角色基本信息，补充详细的视觉描述，用于保持AI生成图像中角色的一致性。

【当前项目风格】{project_style}

【需要校准的角色】
{character_json}

【输出格式】JSON数组:
[
  {
    "name": "角色名",
    "appearance_detail": "200字内详细外貌: 脸型、五官、肤色、身高体型、发型发色",
    "clothing": "100字内服装描述",
    "visual_prompt_zh": "中文视觉Prompt(80字内)",
    "visual_prompt_en": "英文视觉Prompt(80 words max)",
    "identity_anchors": {
      "face_shape": "脸型: oval/square/heart/round",
      "eye_shape": "眼型描述",
      "unique_marks": ["独特标记1", "标记2"],
      "color_anchors": {
        "hair": "#1A1A1A (jet black)",
        "skin": "#E8C4A0 (warm beige)"
      }
    },
    "default_emotion": "角色的基础情绪倾向",
    "emotion_range": {
      "primary": "最常见情绪",
      "secondary": "次常见情绪",
      "extreme": "极端情绪",
      "forbidden": "不符合角色的情绪"
    }
  }
]
```

### 6.3 场景校准 Prompt（P1）

```
你是一位专业的美术指导和场景设计师。

【任务】根据已有的场景基本信息，补充专业的美术设计细节。

【当前项目风格】{project_style}
【当前项目类型】{project_genre}

【需要校准的场景】
{scenes_json}

【输出格式】JSON数组:
[
  {
    "name": "场景名(必须与输入匹配)",
    "architecture_style": "建筑/环境风格描述",
    "lighting_design": "光影设计: 光源方向、强度、色彩",
    "color_palette": "色彩基调: 主色、辅色、点缀色",
    "key_props": ["关键道具1", "道具2"],
    "spatial_layout": "空间布局描述(50字内)",
    "visual_prompt_zh": "中文场景Prompt(80字内)",
    "visual_prompt_en": "英文场景Prompt(80 words max)"
  }
]
```

---

## 七、API 端点设计

### 7.1 P0 端点列表

新建路由文件 `backend/app/routers/story.py`，在 `main.py` 中注册。

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/story/projects` | 创建故事项目 |
| GET | `/api/story/projects` | 获取项目列表 |
| GET | `/api/story/projects/{id}` | 获取项目详情（含角色/场景/分镜/情绪） |
| DELETE | `/api/story/projects/{id}` | 删除项目（级联删除所有子数据） |
| POST | `/api/story/projects/{id}/parse` | 触发故事解析（异步） |
| GET | `/api/story/projects/{id}/parse/status` | 查询解析状态和进度 |
| PUT | `/api/story/characters/{id}` | 编辑角色信息 |
| PUT | `/api/story/scenes/{id}` | 编辑场景信息 |
| PUT | `/api/story/shots/{id}` | 编辑分镜信息 |
| PUT | `/api/story/shots/{shot_id}/emotions/{char_id}` | 编辑角色情绪 |
| POST | `/api/story/projects/{id}/generate-prompts` | 批量组装所有分镜的视频 Prompt |
| POST | `/api/story/shots/{id}/generate-video` | 单个分镜生成视频 |
| GET | `/api/story/emotions/presets` | 获取情绪标签预设数据 |

### 7.2 P1 端点

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/story/projects/{id}/calibrate/characters` | 触发角色校准 |
| POST | `/api/story/projects/{id}/calibrate/scenes` | 触发场景校准 |
| POST | `/api/story/projects/{id}/generate-all-videos` | 批量生成所有视频 |

### 7.3 关键请求/响应模型

#### 创建项目

```python
# Request
{
  "title": "项目标题",
  "story_text": "故事文本(10-50000字)",
  "genre": "武侠",           # 可选
  "style": "cinematic",      # 默认
  "default_ratio": "16:9",   # 默认
  "default_duration": 1,     # 默认
  "llm_provider": "deepseek" # 默认
}

# Response
{
  "id": 1,
  "title": "项目标题",
  "status": "draft",
  "character_count": 0,
  "scene_count": 0,
  "shot_count": 0,
  "created_at": "2026-02-28T10:00:00"
}
```

#### 项目详情

```python
# Response
{
  "id": 1,
  "title": "项目标题",
  "story_text": "...",
  "genre": "武侠",
  "style": "cinematic",
  "status": "parsed",
  "characters": [
    {"id": 1, "name": "将军", "gender": "male", "age": "35岁", "role": "protagonist", ...}
  ],
  "scenes": [
    {"id": 1, "name": "古城墙", "location": "边关古城墙上", "time_of_day": "黄昏", ...}
  ],
  "shots": [
    {
      "id": 1, "shot_number": 1, "title": "对峙争吵",
      "scene_id": 1, "scene_name": "古城墙",
      "action_summary": "...", "dialogue": "...",
      "shot_type": "MS", "camera_angle": "eye-level", "camera_movement": "tracking",
      "atmosphere_emotion_tags": ["tense", "serious"],
      "character_emotions": [
        {
          "character_id": 1, "character_name": "将军",
          "emotion_tag": "angry", "emotion_intensity": 4,
          "expression_start": "眉头紧皱", "expression_peak": "怒目圆睁",
          "expression_end": "表情缓和", "body_language": "双手握拳",
          "emotion_transition": "rising"
        }
      ],
      "video_prompt": null,
      "status": "pending",
      "video_url": null
    }
  ]
}
```

#### 编辑角色情绪

```python
# PUT /api/story/shots/1/emotions/1
# Request
{
  "emotion_tag": "angry",
  "emotion_intensity": 4,
  "expression_start": "眉头紧皱，双眼怒视",
  "expression_peak": "怒目圆睁，面部涨红，青筋暴起",
  "expression_end": "表情缓和，露出失望",
  "body_language": "右手拔剑前指，身体前倾",
  "emotion_transition": "rising"
}
```

---

## 八、后端文件结构

### 8.1 新增文件（10个）

```
backend/app/
├── constants/
│   ├── __init__.py
│   └── emotions.py                   # 18种情绪标签 + 5级强度 + 视觉线索
├── models/
│   ├── story.py                      # 5个 SQLAlchemy 模型
│   └── story_api.py                  # Pydantic 请求/响应模型
├── services/
│   ├── llm_client.py                 # 统一 LLM 客户端(多模型可切换)
│   ├── story_parser.py               # 故事解析服务(调LLM→写数据库)
│   ├── story_service.py              # 项目 CRUD + 流程编排
│   ├── video_prompt_builder.py       # 5层语义 Prompt 组装器
│   └── prompts/
│       ├── __init__.py
│       └── story_parse.py            # 故事解析 Prompt 模板
└── routers/
    └── story.py                      # 13个 REST API 端点
```

### 8.2 修改文件（3个）

| 文件 | 修改内容 |
|------|---------|
| `backend/app/main.py` | 注册 `story.router` |
| `backend/app/models/__init__.py` | 导入新模型确保 `init_db()` 创建表 |
| `backend/app/models/task.py` | `VideoTask` 新增 `shot_id` 外键 |

### 8.3 LLM 客户端设计

复用现有 `prompt_service.py` 的异步客户端模式，新建 `llm_client.py`：

```python
class LLMClient:
"""统一 LLM 客户端，支持多模型通道切换"""

    PROVIDERS = {
        "deepseek": {
            "base_url": "https://api.deepseek.com",
            "env_key": "DEEPSEEK_API_KEY",
            "default_model": "deepseek-chat",
        },
        "zhipu": {
            "base_url": "https://open.bigmodel.cn/api/paas/v4/",
            "env_key": "ZHIPU_API_KEY",
            "default_model": "glm-4-flash",
        },
    }

    async def chat(self, system_prompt, user_prompt, provider, **kwargs) -> str:
        """发送消息并返回文本响应"""

    async def chat_json(self, system_prompt, user_prompt, provider, **kwargs) -> dict:
        """发送消息并解析JSON响应"""
```

---

## 九、前端设计

### 9.1 技术方案

- 引入 Tailwind CSS
- 新增 `/story` 路由
- 导航栏新增"故事创作"入口

### 9.2 页面结构

**StoryPage** — 5步工作台：

```
+------------------------------------------------------------------+
|  StoryPage                                                        |
|  +-----------+  +---------------------------------------------+  |
|  | 步骤导航   |  | 主内容区                                     |  |
|  |           |  |                                             |  |
|  | 1.输入故事 |  |  [根据当前步骤显示不同内容]                    |  |
|  | 2.角色     |  |                                             |  |
|  | 3.场景     |  |  步骤1: StoryInputPanel (文本框+配置)         |  |
|  | 4.分镜     |  |  步骤2: CharacterListPanel (角色卡片列表)     |  |
|  | 5.生成     |  |  步骤3: SceneListPanel (场景卡片列表)         |  |
|  |           |  |  步骤4: ShotListPanel + EmotionEditor        |  |
|  |           |  |  步骤5: PromptPreviewPanel + 视频生成        |  |
|  +-----------+  +---------------------------------------------+  |
+------------------------------------------------------------------+
```

### 9.3 新增组件（7个）

| 组件 | 文件路径 | 说明 |
|------|---------|------|
| StepNav | `components/story/StepNav.tsx` | 左侧步骤导航，标记当前步骤和完成状态 |
| StoryInputPanel | `components/story/StoryInputPanel.tsx` | 大文本框(支持5万字) + 标题/风格/类型/LLM选择 + 解析按钮+进度条 |
| CharacterListPanel | `components/story/CharacterListPanel.tsx` | 角色卡片网格，展开编辑，P1加"AI校准"按钮 |
| SceneListPanel | `components/story/SceneListPanel.tsx` | 场景卡片网格，展开编辑，P1加"AI校准"按钮 |
| ShotListPanel | `components/story/ShotListPanel.tsx` | 分镜列表，每条含镜头信息+角色情绪区 |
| EmotionEditor | `components/story/EmotionEditor.tsx` | 角色情绪编辑器（核心交互组件） |
| PromptPreviewPanel | `components/story/PromptPreviewPanel.tsx` | 表格预览所有 Prompt + 字数统计 + 生成按钮 |

### 9.4 EmotionEditor 交互

每个分镜中的每个出场角色有一个独立的 EmotionEditor：

```
┌─────────────────────────────────────────────┐
│ 将军                                         │
│                                             │
│ 情绪: [愤怒 ▼]      强度: [████░] 4/5       │
│                                             │
│ 起始表情: [眉头紧皱，双眼怒视_____________] │
│ 高潮表情: [怒目圆睁，面部涨红_____________] │
│ 结束表情: [表情缓和，露出失望_____________] │
│ 肢体语言: [右手拔剑前指，身体前倾_________] │
│                                             │
│ 变化方向: ●升温  ○降温  ○稳定  ○反转        │
└─────────────────────────────────────────────┘
┌─────────────────────────────────────────────┐
│ 谋士                                         │
│                                             │
│ 情绪: [恐惧 ▼]      强度: [███░░] 3/5       │
│                                             │
│ 起始表情: [面色平静，似乎早有预料_________] │
│ 高潮表情: [后退一步，但目光坚定___________] │
│ 结束表情: [微微低头，嘴唇颤抖_____________] │
│ 肢体语言: [双手摊开，做无辜状_____________] │
│                                             │
│ 变化方向: ○升温  ○降温  ●稳定  ○反转        │
└─────────────────────────────────────────────┘
```

### 9.5 用户完整交互流程

```
1. 点击导航栏"故事创作" → 进入 /story
2. 输入/粘贴故事文本(100-50000字)
3. 设置标题、风格(cinematic/anime/ghibli等)、类型(武侠/科幻等)、LLM(通道 A/B)
4. 点击"开始解析" → 显示进度条 → 等待 LLM 返回
5. 解析完成 → 自动切到"角色"步骤
   - 查看提取的角色列表
   - 可编辑角色名/性别/年龄/外貌等
6. 切到"场景"步骤
   - 查看提取的场景列表
   - 可编辑场景地点/时间/氛围等
7. 切到"分镜"步骤（核心交互）
   - 查看所有分镜列表
   - 调整镜头语言参数
   - 编辑每个角色的情绪标签、强度、表情描述、肢体语言
8. 切到"生成"步骤
   - 预览所有分镜的视频 Prompt (含字数统计)
   - 可手动编辑微调
   - 点击单个"生成视频"或"批量生成"
9. 视频生成完成后可在线预览和下载
```

### 9.6 修改文件

| 文件 | 修改内容 |
|------|---------|
| `frontend/src/App.tsx` | 新增 `/story` 路由 |
| `frontend/src/components/Layout.tsx` | 导航栏新增"故事创作"入口 |

---

## 十、实现优先级

### P0 — 核心最小可用版本

| # | 任务 | 新建/修改 | 说明 |
|---|------|-----------|------|
| 1 | 情绪常量定义 | 新建 `constants/emotions.py` | 18种标签+5级强度 |
| 2 | 数据库模型 | 新建 `models/story.py` | 5个新模型 |
| 3 | 注册模型 | 修改 `models/__init__.py`, `database.py` | 确保建表 |
| 4 | 扩展 VideoTask | 修改 `models/task.py` | 新增 shot_id |
| 5 | API 模型 | 新建 `models/story_api.py` | 请求/响应 Pydantic 模型 |
| 6 | LLM 客户端 | 新建 `services/llm_client.py` | 多模型可切换 |
| 7 | Prompt 模板 | 新建 `services/prompts/story_parse.py` | 解析 Prompt |
| 8 | 故事解析服务 | 新建 `services/story_parser.py` | 调 LLM→写数据库 |
| 9 | Prompt 组装 | 新建 `services/video_prompt_builder.py` | 5层语义组装 |
| 10 | 项目服务 | 新建 `services/story_service.py` | CRUD + 流程编排 |
| 11 | API 路由 | 新建 `routers/story.py` | 13个端点 |
| 12 | 注册路由 | 修改 `main.py` | 注册 story router |
| 13 | Tailwind CSS | 修改前端配置 | 安装和配置 |
| 14 | StoryPage | 新建前端页面 | 5步工作台框架 |
| 15 | 7个子组件 | 新建前端组件 | 详见 9.3 |
| 16 | 路由+导航 | 修改 `App.tsx`, `Layout.tsx` | 注册路由+导航入口 |

### P1 — 校准增强

| 任务 | 说明 |
|------|------|
| 角色校准服务 | LLM 补充身份锚点、详细外貌、视觉 Prompt |
| 场景校准服务 | LLM 补充美术设计、光影、空间布局 |
| 校准 API 端点 | 2个新端点 |
| 批量视频生成 | 串行调用视频 API (3秒间隔避免限流) |
| 分镜重排序 | 前端拖拽 + 后端批量更新 sort_order |
| Prompt 模板管理 | 集中管理，支持数据库存储 + 用户自定义覆盖 |

### P2 — 高级功能

| 任务 | 说明 |
|------|------|
| 情绪曲线可视化 | 折线图展示整个故事的情绪变化趋势 |
| 全局风格系统 | 预设风格模板(吉卜力/国漫/赛博朋克等)影响所有 Prompt |
| 长故事分批处理 | 自动根据 token 预算拆分，避免溢出 |
| 角色一致性增强 | identity_anchors 注入每个分镜 Prompt |
| 多轮局部重解析 | 支持只重新解析指定分镜 |
| 导出功能 | 分镜脚本导出为 PDF/Markdown |
| Celery 异步化 | 视频生成改为 Celery 任务队列 |

---

## 十一、设计决策说明

### 为什么用 ShotCharacterEmotion 关联表而非 JSON 字段？

- 需要存储每个角色的独立情绪（多对多关系）
- 每条情绪记录有 7 个字段，JSON 嵌套会导致更新操作复杂
- 便于前端按角色维度查询和编辑
- 便于后续做情绪统计和可视化

### 为什么 P0 用一次解析而非多阶段？

- StoryLoom 的故事文本通常较短（几百到几千字），不需要分阶段避免 token 溢出
- 一次解析减少前端等待次数，用户体验更流畅
- P2 阶段根据实际 token 消耗情况再引入分批处理

### 为什么 Prompt 限制 95 字？

- 视频模型对长 Prompt 效果衰减明显
- 与现有 `prompt_service.py` 的字数限制保持一致
- 5层语义组装 + 智能截断确保在限制内最大化信息量

### LLM 可切换的设计理由

- LLM 通道 A：成本低、速度快、中文理解好
- LLM 通道 B：与视频模型通道协同时可能有更好的 Prompt 兼容性
- 两者都兼容标准 API 格式，切换成本极低
