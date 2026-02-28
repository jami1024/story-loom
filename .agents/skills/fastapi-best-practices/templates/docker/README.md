# FastAPI Docker 快速部署

本目录包含 FastAPI 项目的 Docker 配置，支持开发、测试、生产多环境部署。

## 📁 文件说明

- `Dockerfile` - 多阶段构建，已配置国内源（pip + apt 清华源）
- `docker-compose.yml` - FastAPI + PostgreSQL + Redis 完整编排
- `.env.example` - 环境变量配置模板
- `.dockerignore` - 构建优化

## 🚀 快速开始

### 1. 配置环境变量

```bash
# 根据环境复制配置文件
cp .env.example .env.dev

# 修改关键配置
vim .env.dev
```

**必须修改的配置**:
```bash
ENV=development
HOST_PORT=8000          # 宿主机端口（外部访问）
APP_PORT=8000           # 容器内部端口
WORKERS=1               # Worker 数量

# 生产环境必须修改
SECRET_KEY=<强随机密钥>  # openssl rand -hex 32
DB_PASSWORD=<强密码>
```

### 2. 启动服务

```bash
# 开发环境
docker-compose --env-file .env.dev up -d

# 测试环境（不同端口，避免冲突）
docker-compose --env-file .env.test up -d

# 生产环境
docker-compose --env-file .env.prod up -d
```

### 3. 验证运行

```bash
# 查看日志
docker-compose logs -f

# 访问应用
curl http://localhost:8000/health
# 或
open http://localhost:8000/docs
```

### 4. 停止服务

```bash
# 停止但保留数据
docker-compose down

# 停止并删除数据（注意：会丢失数据库数据！）
docker-compose down -v
```

## 🔧 环境配置说明

### 端口配置（重要）

本配置通过 `HOST_PORT` 和 `APP_PORT` 实现灵活的端口映射：

| 环境 | HOST_PORT | APP_PORT | WORKERS | 说明 |
|------|-----------|----------|---------|------|
| 开发 | 8000 | 8000 | 1 | 本地开发 |
| 测试 | 8001 | 8000 | 2 | 避免端口冲突 |
| 生产 | 80 | 8000 | 5 | 标准 HTTP 端口 |

**同时运行多个环境**:
```bash
# 使用不同项目名称
docker-compose -p myapp-dev --env-file .env.dev up -d
docker-compose -p myapp-test --env-file .env.test up -d

# 分别访问
curl http://localhost:8000/health  # 开发环境
curl http://localhost:8001/health  # 测试环境
```

### 服务说明

- **app**: FastAPI 应用（Uvicorn + 多 Workers）
- **db**: PostgreSQL 16（持久化到 volume）
- **redis**: Redis 7（缓存和队列）

### 性能配置

**Workers 数量建议**:
```bash
# 公式：(CPU 核心数 × 2) + 1
WORKERS=1   # 开发环境
WORKERS=5   # 2 核生产环境
WORKERS=9   # 4 核生产环境
```

## 🔐 生产环境配置

### 必须修改的安全配置

```bash
# 生成强密钥
openssl rand -hex 32

# .env.prod 中配置
SECRET_KEY=<生成的密钥>
DB_PASSWORD=<强密码>

# 限制 CORS
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

### 数据库端口保护

生产环境不要暴露数据库和 Redis 端口到宿主机：

```yaml
# docker-compose.yml 中注释掉
# db:
#   ports:
#     - "${DB_PORT:-5432}:5432"  # 生产环境注释此行
```

## 🛠️ 常用命令

```bash
# 查看状态
docker-compose ps

# 查看日志
docker-compose logs -f app      # 只看应用日志
docker-compose logs -f db       # 只看数据库日志

# 进入容器
docker-compose exec app bash    # 进入应用容器
docker-compose exec db psql -U myapp  # 进入数据库

# 重启服务
docker-compose restart app      # 重启应用
docker-compose restart          # 重启所有服务

# 重新构建
docker-compose build --no-cache app
docker-compose up -d
```

## 🐛 快速问题排查

**端口被占用**:
```bash
lsof -i :8000
# 修改 .env 中的 HOST_PORT
```

**数据库连接失败**:
```bash
# 检查数据库状态
docker-compose ps
docker-compose logs db

# 检查连接配置
docker-compose exec app env | grep DATABASE_URL
```

**构建很慢**:
已配置清华源加速，如仍慢可检查网络或更换镜像源。

## 📚 详细文档

完整的 Docker 使用指南和最佳实践：

- **[统一 Docker 指南](../../../DOCKER_GUIDE.md)** - 多环境部署、镜像源配置、安全实践
- **配置文件说明**:
  - [Dockerfile](./Dockerfile) - 多阶段构建 + 国内源配置
  - [docker-compose.yml](./docker-compose.yml) - 服务编排详细配置
  - [.env.example](./.env.example) - 所有环境变量说明

## 💡 最佳实践

✅ 使用 `.env.dev`、`.env.test`、`.env.prod` 分别管理不同环境
✅ 生产环境必须修改 `SECRET_KEY` 和 `DB_PASSWORD`
✅ 生产环境不要暴露数据库端口
✅ 根据 CPU 核心数调整 `WORKERS` 数量
✅ 定期更新基础镜像（`docker-compose pull`）
✅ 数据库使用 volume 持久化，避免使用 `-v` 删除

---

需要更多帮助？查看 [DOCKER_GUIDE.md](../../../DOCKER_GUIDE.md) 获取详细说明。
