# StoryLoom

AI 驱动的故事视频创作平台。输入一段故事文本，AI 自动拆解角色、场景、分镜，逐镜生成高清视频。

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React 19 + TypeScript + Vite 7 |
| 后端 | Python 3.11 + FastAPI（全异步） |
| 数据库 | MySQL 8.0（SQLAlchemy 2.0 + aiomysql 异步驱动） |
| 缓存 | Redis 7 |
| 部署 | Docker Compose + Nginx 反向代理 |

### AI 多 Provider 架构

所有 AI 服务商配置存储在 `ai_providers` 表中，支持通过设置页面或 API 动态增删、切换和热更新，无需重启服务。

| 能力 | 适配器 | 说明 |
|------|--------|------|
| LLM | OpenAI 兼容接口 | 故事解析、Prompt 优化、场景校准，流式响应防止长请求断连 |
| 图片生成 | `openai_image` / `openai_chat` / `gemini_sdk` / `gemini_native` | 角色立绘、场景参考图，通过 `client_type` 字段自动路由 |
| 视频生成 | 智谱视频 API（签名认证） | 文生视频，支持 4K、5s/10s、多比例，支持参考图辅助 |

## 快速开始

### 前置要求

- Docker 和 Docker Compose
- 至少一个 LLM API Key（故事解析和 Prompt 优化必需）
- 视频生成平台 Token（视频生成必需）

### 启动步骤

```bash
# 1. 克隆项目
git clone <repository-url>
cd story-loom

# 2. 配置环境变量
cp .env.example .env
# 编辑 .env，至少填入 LLM 通道与视频通道所需 API Key

# 3. 启动服务
docker-compose up -d

# 4. 查看运行状态
docker-compose ps
```

启动后访问：

- 前端应用：http://localhost
- 后端 API：http://localhost:8001
- API 文档（Swagger）：http://localhost:8001/docs

## 核心功能

### 故事创作（5 步工作流）

输入一段故事文本，AI 自动完成从文字到视频的全流程：

| 步骤 | 操作 | 说明 |
|------|------|------|
| 1. 故事输入 | 创建项目，粘贴/输入故事文本 | 可选择类型（武侠/科幻/爱情等）、视觉风格、LLM 通道、图片通道 |
| 2. 角色管理 | AI 解析 → 提取角色 | 自动识别角色名、性别、年龄、性格、外貌；支持 AI 生成角色立绘（中文名自动添加东亚面孔特征） |
| 3. 场景管理 | AI 解析 → 提取场景 | 自动识别地点、时间、天气、氛围；支持 AI 校准视觉描述 + 生成场景参考图 |
| 4. 分镜管理 | AI 解析 → 拆解分镜 | 每个分镜包含：动作描述、对白、景别、角度、运镜、所属场景、角色情绪（支持精细编辑） |
| 5. 视频生成 | 批量组装 Prompt → 逐镜生成 | 5 层语义组装，场景图 + 角色立绘作为参考图辅助视频一致性 |

### Prompt 组装（5 层语义结构）

每个分镜的视频 Prompt 由 5 层语义自动组装：

| 层级 | 内容来源 |
|------|----------|
| Layer 1 镜头 | 运镜类型 + 景别（如：稳定器跟拍中景镜头） |
| Layer 2 场景 | 场景视觉锚点描述 / 地点+时间+天气回退 |
| Layer 3 主体 | 角色外貌 + 情绪表情 + 动作描述 |
| Layer 4 氛围 | 分镜氛围情绪标签 |
| Layer 5 风格 | 项目视觉风格 + 运动强度 |

最终拼接为 ≤95 字符的中文 Prompt，用于视频生成 API。

### 参考图辅助视频生成

生成视频时，系统自动收集当前镜头的参考图传给视频 API，提升画面一致性：

1. **场景参考图** — 当前镜头所属场景的参考图
2. **角色参考图** — 按角色重要性排序（主角 > 配角 > 次要），当前镜头出场角色的立绘

### 其他功能

- **Provider 管理** — 设置页面可动态配置 LLM / 图片 / 视频服务商，支持热更新
- **图片预览** — 角色立绘和场景图支持点击放大预览，Portal 渲染避免裁切
- **错误反馈** — 图片/视频生成失败时页面内显示错误提示，可手动关闭
- **解析进度追踪** — 故事解析任务实时进度展示，支持多步骤进度条

## API 概览

| 路由前缀 | 功能 |
|----------|------|
| `GET /health` | 健康检查 |
| `/api/story/*` | 故事项目 CRUD、解析、角色/场景/分镜管理、图片生成、Prompt 组装、视频生成 |
| `/api/video/*` | 视频状态查询、历史记录、配额查询 |
| `/api/prompt/*` | Prompt 智能优化 |
| `/api/providers/*` | AI Provider 管理（CRUD + 热更新） |

完整文档启动后访问 http://localhost:8001/docs 查看。

## 项目结构

```
story-loom/
├── frontend/                          # React 前端
│   ├── src/
│   │   ├── pages/                     # 页面组件
│   │   │   ├── HomePage.tsx           # 首页 Landing
│   │   │   ├── StoryPage.tsx          # 故事创作（5 步工作流）
│   │   │   └── SettingsPage.tsx       # Provider 设置
│   │   ├── components/
│   │   │   ├── story/                 # 故事模式组件
│   │   │   │   ├── StoryInputPanel    # 步骤1: 故事输入 + 项目配置
│   │   │   │   ├── CharacterListPanel # 步骤2: 角色管理 + 立绘生成
│   │   │   │   ├── SceneListPanel     # 步骤3: 场景管理 + 参考图生成
│   │   │   │   ├── ShotListPanel      # 步骤4: 分镜管理 + 情绪编辑
│   │   │   │   ├── PromptPreviewPanel # 步骤5: Prompt 预览 + 视频生成
│   │   │   │   ├── ParseOverviewDashboard  # 解析进度面板
│   │   │   │   ├── StoryHistoryPanel  # 项目历史
│   │   │   │   ├── EmotionEditor      # 情绪精细编辑器
│   │   │   │   └── StepNav            # 步骤导航
│   │   │   ├── VideoPlayer.tsx        # 视频播放器
│   │   │   └── Layout.tsx             # 全局布局 + 侧边栏
│   │   ├── services/api.ts            # 统一 API 调用层
│   │   └── types/story.ts             # TypeScript 类型定义
│   ├── Dockerfile                     # 多阶段构建 (Node → Nginx)
│   └── nginx.conf                     # Nginx 反向代理 + 静态资源
├── backend/                           # FastAPI 后端
│   ├── app/
│   │   ├── main.py                    # 应用入口 + 生命周期管理
│   │   ├── database.py                # 异步数据库 + 自动迁移
│   │   ├── core/                      # 配置、异常处理
│   │   ├── models/                    # ORM 模型
│   │   │   ├── story.py               # 故事 6 表模型（项目/角色/场景/分镜/情绪/解析任务）
│   │   │   ├── task.py                # 视频任务模型
│   │   │   └── provider.py            # AI Provider 模型
│   │   ├── routers/                   # API 路由
│   │   │   ├── story.py               # 故事全流程（项目/角色/场景/分镜/图片/视频）
│   │   │   ├── video.py               # 视频生成 + 状态 + 历史
│   │   │   ├── prompt.py              # Prompt 优化
│   │   │   └── provider.py            # Provider 管理
│   │   ├── services/                  # 业务逻辑
│   │   │   ├── llm_client.py          # 统一 LLM 客户端（多 Provider，流式响应）
│   │   │   ├── image_client.py        # 统一图片客户端（4 种适配器）
│   │   │   ├── zhipu_video.py         # 视频生成服务（签名认证）
│   │   │   ├── story_parser.py        # LLM 故事解析（异步 + 并发控制）
│   │   │   ├── story_service.py       # 故事业务逻辑
│   │   │   ├── scene_calibrator.py    # AI 场景视觉描述校准
│   │   │   ├── video_prompt_builder.py # 5 层语义 Prompt 组装
│   │   │   ├── prompt_service.py      # Prompt 优化服务
│   │   │   ├── provider_service.py    # Provider CRUD + 初始化
│   │   │   └── prompts/               # LLM System Prompt 模板
│   │   │       ├── story_parse.py     # 故事解析 Prompt
│   │   │       ├── character_image.py # 角色立绘 Prompt
│   │   │       └── scene_image.py     # 场景图片 Prompt
│   │   ├── constants/emotions.py      # 情绪标签 / 镜头映射表
│   │   ├── utils/zhipu_sign.py        # 智谱签名算法
│   │   └── migrations/                # 增量 SQL 迁移脚本
│   ├── requirements.txt
│   └── Dockerfile
├── docker-compose.yml                 # 服务编排 (frontend + backend + mysql + redis)
└── .env.example                       # 环境变量模板
```

## 数据模型

```
StoryProject (故事项目)
├── StoryCharacter (角色) ── image_url, appearance_brief, personality
├── StoryScene (场景) ── image_url, visual_prompt_zh, lighting_design
├── StoryShot (分镜) ── video_prompt, shot_type, camera_movement
│   ├── → scene_id → StoryScene
│   └── ShotCharacterEmotion (角色情绪) ── emotion_tag, intensity, expression_peak
│       └── → character_id → StoryCharacter
└── StoryParseTask (解析任务) ── status, progress, message
```

## 本地开发

### 前端

```bash
cd frontend
npm install
npm run dev          # 开发服务器 (http://localhost:5173)
npm run build        # 生产构建
npm run lint         # 代码检查
```

### 后端

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload   # 开发服务器 (http://localhost:8000)
```

> 后端启动时会自动创建数据库表并执行增量迁移，同时从环境变量初始化默认 Provider 配置到数据库。

## Docker 常用命令

```bash
docker-compose up -d             # 启动所有服务
docker-compose down              # 停止所有服务
docker-compose up -d --build backend   # 重建并重启后端
docker-compose logs -f backend   # 查看后端日志
docker-compose restart backend   # 重启后端
docker-compose exec backend bash # 进入后端容器
```

## 环境变量

首次启动时，系统根据已配置的环境变量自动创建对应 Provider 记录到数据库。后续可通过设置页面或 `/api/providers` API 动态管理。

| 变量 | 用途 | 说明 |
|------|------|------|
| `ZHIPU_AUTH_TOKEN` | 视频生成 | 视频通道授权 Token |
| `DEEPSEEK_API_KEY` | LLM | LLM 通道 API Key（故事解析和 Prompt 优化） |
| `ZHIPU_API_KEY` | LLM + 图片 | 通用模型通道 API Key |
| `OPENAI_API_KEY` | 图片 | OpenAI 图片通道 API Key |
| `SILICON_API_KEY` | 图片 | SiliconFlow 图片通道 API Key |
| `GEMINI_API_KEY` | 图片 | Google Gemini 图片通道 API Key |
| `DATABASE_URL` | 数据库 | MySQL 连接地址，Docker 部署时自动配置 |
| `REDIS_URL` | 缓存 | Redis 连接地址，Docker 部署时自动配置 |

完整配置参见 [.env.example](.env.example)。

## 注意事项

- **API 成本**：4K 视频生成费用较高，注意 API 用量
- **生成耗时**：视频生成可能需要数分钟，前端提供实时状态追踪
- **并发控制**：故事解析最多 3 个任务并行，批量视频生成间隔 3 秒自动排队
- **安全性**：API Key 存储在后端（环境变量 + 数据库 `ai_providers` 表），不会暴露给前端
- **Relay 兼容**：LLM 客户端使用流式响应，支持中转站长请求不断连；图片客户端自动规范化 base_url
