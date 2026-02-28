# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

StoryLoom 是一个专注于高质量 AI 视频生成的 Web 应用。用户可以通过文字或图片快速创作 4K 视频，无需登录即可使用。

### 技术栈

**前端:**
- React 19 + TypeScript
- Vite 作为构建工具
- ESLint 用于代码规范

**后端:**
- Python + FastAPI
- Celery 用于异步任务队列
- Redis 作为 Celery 的 broker 和结果后端

**部署:**
- Docker + Docker Compose
- Nginx 作为前端服务器和反向代理

**AI 模型:**
- 智谱 AI CogVideo-X 3: 文生视频/图生视频 (直接生成 4K)
- 智谱 AI GLM 系列: Prompt 优化
- 备选: GPT-4, Claude 3 用于 Prompt 增强

## 常用命令

### 前端开发

```bash
# 进入前端目录
cd frontend

# 安装依赖
npm install

# 启动开发服务器 (端口 5173)
npm run dev

# 构建生产版本
npm run build

# 预览生产构建
npm run preview

# 代码检查
npm run lint
```

### 后端开发 (待实现)

```bash
# 进入后端目录
cd backend

# 创建并激活虚拟环境
python -m venv venv
source venv/bin/activate  # macOS/Linux
# 或 venv\Scripts\activate  # Windows

# 安装依赖
pip install -r requirements.txt

# 启动开发服务器
python app.py  # 或 uvicorn main:app --reload

# 启动 Celery worker
celery -A tasks worker --loglevel=info

# 启动 Redis (macOS)
brew services start redis
```

### Docker 部署 (推荐)

```bash
# 配置环境变量
cp .env.example .env
# 编辑 .env 文件，填入你的 ZHIPU_API_KEY

# 构建并启动所有服务
docker-compose up -d

# 查看运行状态
docker-compose ps

# 查看日志
docker-compose logs -f

# 停止所有服务
docker-compose down

# 重新构建镜像
docker-compose build

# 重启单个服务
docker-compose restart backend
docker-compose restart frontend
docker-compose restart celery-worker

# 进入容器调试
docker-compose exec backend bash
docker-compose exec frontend sh
```

### Docker 服务说明

项目包含以下 Docker 服务:
- **frontend** (端口 80): Nginx + React 前端应用
- **backend** (端口 8000): FastAPI 后端 API
- **celery-worker**: 异步任务处理器
- **redis** (端口 6379): 消息队列和缓存
```

## 核心架构

### 前端架构

- **统一创作界面**: 用户输入 Prompt 或上传图片的中心区域
- **模式切换**: 支持"文生视频"和"图生视频"两种模式
- **Prompt 工作台**: 包含 Prompt 优化器和历史记录 (Local Storage)
- **高级参数面板**: 视频风格、画面比例 (16:9, 9:16, 1:1)、运动强度等
- **任务状态追踪器**: 实时显示视频生成状态 (排队中 -> 生成中 -> 已完成/失败)
- **作品展示**: 在线预览和 4K 视频下载

### 后端架构 (设计方案)

1. **API 层**: 接收前端请求，创建异步任务
2. **任务队列 (Celery)**: 管理视频生成任务
3. **AI 服务集成**:
   - `client.videos.generations()` 调用智谱 AI 生成视频
   - `client.videos.retrieve_videos_result()` 轮询获取结果
4. **存储层**: 保存任务状态和视频 URL

### 关键工作流程

**视频生成流程:**
1. 前端发送请求 (Prompt + 参数) → 后端 API
2. 创建 Celery 任务，返回任务 ID
3. Celery Worker 调用智谱 AI CogVideo-X 3 API
   - 参数示例: `size="3840x2160"` (4K), `quality="quality"`, `duration=5`
4. 异步等待 API 返回结果 (视频 URL)
5. 更新任务状态为"已完成"，保存 4K 视频 URL

**Prompt 优化流程:**
1. 用户输入初步 Prompt
2. 调用智谱 GLM 或其他 LLM API 进行优化
3. 返回优化后的多个版本供用户选择

## 智谱 AI SDK 集成要点

### 认证
```python
from zhipuai import ZhipuAi
client = ZhipuAi(api_key="YOUR_API_KEY")
```

### 视频生成 (4K)
```python
response = client.videos.generations(
    model="cogvideox-3",
    prompt="视频描述",
    size="3840x2160",  # 4K 分辨率
    quality="quality",  # 优先质量
    with_audio=True,
    fps=30,
    duration=5  # 支持 5 或 10 秒
)
task_id = response.id
```

### 结果检索 (异步)
```python
result = client.videos.retrieve_videos_result(id=task_id)
if result.status == "succeeded":
    video_url = result.video.url
```

## Prompt 最佳实践

遵循公式: **[主体] + [动作] + [环境/背景] + [风格/修饰词]**

**关键修饰词:**
- 画质: `8K`, `超高分辨率`, `光线追踪`, `细节丰富`
- 镜头: `特写镜头`, `无人机航拍`, `慢动作`, `低角度拍摄`
- 风格: `电影感`, `赛博朋克`, `宫崎骏风格`, `水彩画`
- 氛围: `电影光效`, `体积光`, `霓虹灯`, `黄金时刻`

**负向词**: `模糊`, `低画质`, `变形`, `水印`

## 开发注意事项

1. **API 成本**: 4K 视频生成费用较高，需考虑成本控制
2. **长时间等待**: 视频生成耗时长 (可能数分钟)，需要良好的用户反馈机制
3. **并发限制**: 智谱 API 有速率限制，需实现请求排队和重试
4. **无需登录**: 使用 Local Storage 和 Session Storage 管理用户数据
5. **安全性**: API Key 必须存储在后端环境变量，不可暴露给前端

## 项目状态

- ✅ 前端基础框架搭建 (Vite + React + TypeScript)
- ✅ Docker 部署配置完成
- ✅ 后端基础架构搭建 (FastAPI + Celery + Redis)
- ⏳ 智谱 AI SDK 集成待实现
- ⏳ 前端 UI 组件开发
- ⏳ 核心功能模块待开发

## Docker 架构说明

### 多阶段构建优化

**前端 (frontend/Dockerfile):**
- 阶段 1: 使用 Node.js 构建 React 应用
- 阶段 2: 使用 Nginx Alpine 镜像提供静态文件服务
- 优势: 最终镜像体积小 (~30MB)，性能高

**后端 (backend/Dockerfile):**
- 基于 Python 3.11-slim 镜像
- 只安装必要的 Python 依赖
- 不包含 FFmpeg（只提供 4K 下载，无需视频转码）

### 数据持久化

- `redis_data`: Redis 数据持久化卷
- `backend_uploads`: 后端上传文件存储（如果需要）

## 相关文档

- `storyloom_project_plan.md`: 完整项目方案
- `ai_video_prompt_guide.md`: Prompt 编写指南
- `zhipu_ai_cogvideox3_sdk_summary.md`: 智谱 AI SDK 关键信息
- `docker-compose.yml`: Docker 编排配置
- `.env.example`: 环境变量配置示例
