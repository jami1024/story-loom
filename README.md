# StoryLoom

AI 驱动的视频创作平台。输入故事文本，AI 自动拆解角色、场景、分镜，逐镜生成 4K 高清视频。无需登录即可使用。

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React 19 + TypeScript + Vite |
| 后端 | Python 3.11 + FastAPI（全异步） |
| 数据库 | MySQL 8.0（SQLAlchemy + aiomysql 异步驱动） |
| 缓存/队列 | Redis 7 |
| 部署 | Docker Compose + Nginx 反向代理 |

### AI 多 Provider 架构

项目采用**数据库驱动的多 Provider 架构**，所有 AI 服务商配置存储在 `ai_providers` 表中，支持通过 API 动态增删、切换和热更新，无需重启服务。

| 能力 | Provider | 用途 |
|------|----------|------|
| 视频生成 | 多 Provider 视频引擎 | 文生视频，支持 4K、5s/10s、多比例，支持参考图辅助生成 |
| LLM | 多模型 LLM 通道 | Prompt 优化、故事解析、场景描述校准 |
| 图片生成 | 多 Provider 图片通道 | 角色立绘、场景参考图 |

图片客户端内置 4 种适配器（`openai_image` / `openai_chat` / `gemini_sdk` / `gemini_native`），通过 `client_type` 字段自动路由。

## 快速开始

### 前置要求

- Docker 和 Docker Compose
- 视频生成平台 Token（视频生成必需，按部署环境配置）
- 至少一个 LLM API Key（故事解析和 Prompt 优化必需）

### 启动步骤

```bash
# 1. 克隆项目
git clone <repository-url>
cd story-loom

# 2. 配置环境变量
cp .env.example .env
# 编辑 .env，至少填入视频通道与 LLM 通道所需 API Key

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
| 1. 故事输入 | 创建项目，输入故事文本 | 可选择类型（武侠/科幻/爱情等）、风格、LLM Provider |
| 2. 角色管理 | AI 解析 → 提取角色 | 自动识别角色名、性别、年龄、性格、外貌；支持 AI 生成角色立绘 |
| 3. 场景管理 | AI 解析 → 提取场景 | 自动识别地点、时间、天气、氛围；支持 AI 校准视觉描述 + 生成场景参考图 |
| 4. 分镜管理 | AI 解析 → 拆解分镜 | 每个分镜包含：动作描述、对白、景别、角度、运镜、角色情绪（支持精细编辑） |
| 5. 视频生成 | 批量组装 Prompt → 逐镜生成 | 5 层语义组装：场景+角色+动作+情绪+镜头语言，支持参考图辅助 |

**数据模型关系：** `StoryProject` → `StoryCharacter` / `StoryScene` / `StoryShot` → `ShotCharacterEmotion`

### 其他功能

- **历史管理** — 查看全部视频生成记录，在线预览和下载
- **Provider 管理** — 通过 API 动态配置 AI 服务商（CRUD + 热更新）

## API 概览

| 路由前缀 | 功能 |
|----------|------|
| `GET /health` | 健康检查 |
| `/api/video/*` | 视频生成、状态查询、历史记录、配额查询 |
| `/api/prompt/*` | Prompt 智能优化 |
| `/api/story/*` | 故事项目 CRUD、解析、角色/场景/分镜编辑、图片生成、视频生成 |
| `/api/providers/*` | AI Provider 管理（CRUD + 热更新） |

完整文档启动后访问 http://localhost:8001/docs 查看。

## 项目结构

```
story-loom/
├── frontend/                          # React 前端
│   ├── src/
│   │   ├── pages/                     # 页面组件
│   │   │   ├── HomePage.tsx           # 首页 Landing
│   │   │   ├── GeneratePage.tsx       # 视频生成
│   │   │   ├── StoryPage.tsx          # 故事创作（5 步工作流）
│   │   │   ├── HistoryPage.tsx        # 历史记录
│   │   │   ├── PromptsPage.tsx        # Prompt 管理
│   │   │   └── SettingsPage.tsx       # 设置
│   │   ├── components/
│   │   │   ├── story/                 # 故事模式组件
│   │   │   │   ├── StoryInputPanel    # 步骤1: 故事输入
│   │   │   │   ├── CharacterListPanel # 步骤2: 角色管理
│   │   │   │   ├── SceneListPanel     # 步骤3: 场景管理
│   │   │   │   ├── ShotListPanel      # 步骤4: 分镜管理 + 情绪编辑
│   │   │   │   ├── PromptPreviewPanel # 步骤5: Prompt 预览 + 视频生成
│   │   │   │   └── StepNav / EmotionEditor
│   │   │   ├── VideoGenerator.tsx     # 视频生成器
│   │   │   ├── VideoPlayer.tsx        # 视频播放器
│   │   │   ├── TaskTracker.tsx        # 任务状态追踪
│   │   │   └── icons/                 # SVG 图标组件
│   │   ├── services/api.ts            # 统一 API 调用层
│   │   └── types/story.ts             # TypeScript 类型定义
│   ├── Dockerfile                     # 多阶段构建 (Node → Nginx)
│   └── nginx.conf                     # Nginx 反向代理
├── backend/                           # FastAPI 后端
│   ├── app/
│   │   ├── main.py                    # 应用入口 + 生命周期管理
│   │   ├── database.py                # 异步数据库 + 自动迁移
│   │   ├── core/                      # 配置、异常处理、日志
│   │   ├── models/                    # ORM 模型
│   │   │   ├── story.py               # 故事 5 表模型
│   │   │   ├── task.py                # 视频任务模型
│   │   │   └── provider.py            # AI Provider 模型
│   │   ├── routers/                   # API 路由
│   │   │   ├── video.py               # 视频生成 + 状态 + 历史
│   │   │   ├── prompt.py              # Prompt 优化
│   │   │   ├── story.py               # 故事全流程 API
│   │   │   └── provider.py            # Provider 管理
│   │   ├── services/                  # 业务逻辑
│   │   │   ├── zhipu_video.py         # 视频生成服务（签名认证）
│   │   │   ├── llm_client.py          # 统一 LLM 客户端（多 Provider）
│   │   │   ├── image_client.py        # 统一图片客户端（4 种适配器）
│   │   │   ├── story_parser.py        # LLM 故事解析
│   │   │   ├── story_service.py       # 故事业务逻辑
│   │   │   ├── scene_calibrator.py    # AI 场景描述校准
│   │   │   ├── video_prompt_builder.py # 5 层语义 Prompt 组装
│   │   │   ├── prompt_service.py      # Prompt 优化服务
│   │   │   ├── provider_service.py    # Provider CRUD + 初始化
│   │   │   └── prompts/               # LLM System Prompt 模板
│   │   ├── constants/emotions.py      # 情绪标签 / 镜头映射表
│   │   ├── utils/                     # 工具（签名算法等）
│   │   └── migrations/                # 增量迁移脚本
│   ├── requirements.txt
│   └── Dockerfile
├── docker-compose.yml                 # 服务编排 (frontend + backend + mysql + redis)
└── .env.example                       # 环境变量模板
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
docker-compose logs -f backend   # 查看后端日志
docker-compose restart backend   # 重启后端
docker-compose build             # 重新构建镜像
docker-compose exec backend bash # 进入后端容器
```

## 环境变量

首次启动时，系统根据已配置的环境变量自动创建对应 Provider 记录到数据库。后续可通过 `/api/providers` 动态管理。

| 变量 | 用途 | 说明 |
|------|------|------|
| `ZHIPU_AUTH_TOKEN` | 视频生成 | 视频通道授权 Token（用于视频生成链路） |
| `DEEPSEEK_API_KEY` | LLM | LLM 通道 API Key（用于 Prompt 优化和故事解析） |
| `ZHIPU_API_KEY` | LLM + 图片 | 通用模型通道 API Key（用于 LLM/图片） |
| `OPENAI_API_KEY` | 图片 | 图片通道 API Key |
| `SILICON_API_KEY` | 图片 | 图片通道 API Key |
| `GEMINI_API_KEY` | 图片 | 图片通道 API Key |
| `DATABASE_URL` | 数据库 | MySQL 连接地址，Docker 部署时自动配置 |
| `REDIS_URL` | 缓存 | Redis 连接地址，Docker 部署时自动配置 |

完整配置参见 [.env.example](.env.example)。

## 注意事项

- **API 成本**：4K 视频生成费用较高，注意 API 用量
- **生成耗时**：视频生成可能需要数分钟，前端提供实时进度追踪
- **并发限制**：各 AI 服务商有速率限制，批量视频生成间隔 3 秒自动排队
- **安全性**：API Key 存储在后端（环境变量 + 数据库 `ai_providers` 表），不会暴露给前端
