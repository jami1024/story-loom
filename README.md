# StoryLoom - AI 视频生成平台

StoryLoom 是一个专注于高质量 AI 视频生成的 Web 应用。用户可以通过文字或图片快速创作 4K 视频，无需登录即可使用。

## 技术栈

- **前端**: React 19 + TypeScript + Vite
- **后端**: Python + FastAPI + Celery
- **消息队列**: Redis
- **AI 模型**: 智谱 AI CogVideo-X 3
- **部署**: Docker + Docker Compose

## 快速开始

### 前置要求

- Docker 和 Docker Compose
- 智谱 AI API Key ([获取地址](https://open.bigmodel.cn/))

### 安装步骤

1. **克隆项目**

```bash
git clone <repository-url>
cd StoryLoom
```

2. **配置环境变量**

```bash
cp .env.example .env
```

编辑 `.env` 文件，填入你的智谱 AI API Key:

```
ZHIPU_API_KEY=your_api_key_here
```

3. **启动服务**

```bash
docker-compose up -d
```

4. **访问应用**

- 前端: http://localhost
- 后端 API: http://localhost:8000
- API 文档: http://localhost:8000/docs

## Docker 命令

### 基础操作

```bash
# 启动所有服务
docker-compose up -d

# 查看运行状态
docker-compose ps

# 查看日志
docker-compose logs -f

# 停止所有服务
docker-compose down
```

### 开发调试

```bash
# 重新构建镜像
docker-compose build

# 重启单个服务
docker-compose restart backend
docker-compose restart frontend
docker-compose restart celery-worker

# 进入容器调试
docker-compose exec backend bash
docker-compose exec frontend sh

# 查看特定服务日志
docker-compose logs -f backend
docker-compose logs -f celery-worker
```

## 项目结构

```
StoryLoom/
├── frontend/               # React 前端
│   ├── src/               # 源代码
│   ├── Dockerfile         # 前端 Docker 配置
│   └── nginx.conf         # Nginx 配置
├── backend/               # FastAPI 后端
│   ├── main.py           # API 入口
│   ├── tasks.py          # Celery 任务
│   ├── requirements.txt  # Python 依赖
│   └── Dockerfile        # 后端 Docker 配置
├── docker-compose.yml    # Docker 编排配置
├── .env.example          # 环境变量示例
└── CLAUDE.md             # Claude Code 开发指南
```

## 核心功能

- ✅ 文生视频：通过文字描述生成 4K 视频
- ✅ 图生视频：上传图片生成 4K 视频
- ✅ Prompt 优化：AI 辅助优化视频描述
- ✅ 实时状态追踪：查看视频生成进度
- ✅ 4K 视频下载：高质量视频导出

## 开发指南

### 前端开发

```bash
cd frontend
npm install
npm run dev
```

### 后端开发

```bash
cd backend
python -m venv venv
source venv/bin/activate  # macOS/Linux
pip install -r requirements.txt
uvicorn main:app --reload
```

### Celery Worker

```bash
celery -A tasks worker --loglevel=info
```

## 注意事项

1. **API 成本**: 4K 视频生成费用较高，请注意 API 使用量
2. **生成时间**: 视频生成可能需要数分钟，请耐心等待
3. **并发限制**: 智谱 API 有速率限制，建议合理控制并发请求
4. **安全性**: 切勿将 API Key 提交到代码仓库

## 许可证

[MIT License](LICENSE)

## 相关文档

- [项目方案](storyloom_project_plan.md)
- [Prompt 编写指南](ai_video_prompt_guide.md)
- [智谱 AI SDK 文档](zhipu_ai_cogvideox3_sdk_summary.md)
- [Claude Code 开发指南](CLAUDE.md)
