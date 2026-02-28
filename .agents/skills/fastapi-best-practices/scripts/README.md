# FastAPI 辅助脚本

本目录包含 FastAPI 项目常用的开发辅助脚本，**所有环境通过 Docker Compose 管理**。

## 核心理念

- 使用 **Docker Compose** 统一管理开发、测试、生产环境
- 脚本只做辅助工作（lint、迁移等）
- 通过 Makefile 提供统一的命令入口

## 脚本列表

| 脚本 | 说明 | 用法 |
|------|------|------|
| `lint.sh` | 代码检查 | `./scripts/lint.sh` |
| `db-migrate.sh` | 数据库迁移 | `./scripts/db-migrate.sh {upgrade\|downgrade\|revision}` |
| `docker-build.sh` | 构建 Docker 镜像 | `./scripts/docker-build.sh [image] [tag]` |

## Docker Compose 使用

### 开发环境

```bash
# 启动开发环境
docker compose --profile dev up -d

# 查看日志
docker compose logs -f app

# 停止服务
docker compose down
```

### 测试

```bash
# 在容器中运行测试
docker compose exec app pytest tests/ -v --cov=app

# 或使用 Makefile
make test
```

### 生产环境

```bash
# 构建并启动生产环境
docker compose --profile prod up -d --build
```

## 脚本使用

### 1. 添加执行权限

```bash
chmod +x scripts/*.sh
```

### 2. 代码检查

```bash
# 在容器中运行 lint
docker compose exec app ./scripts/lint.sh

# 或本地运行
./scripts/lint.sh
```

### 3. 数据库迁移

```bash
# 在容器中执行迁移
docker compose exec app ./scripts/db-migrate.sh upgrade

# 创建新迁移
docker compose exec app ./scripts/db-migrate.sh revision "add user table"
```

## 推荐：使用 Makefile

使用 Makefile 作为统一命令入口：

```bash
make dev           # 启动开发环境 (docker compose)
make test          # 运行测试
make lint          # 代码检查
make docker-build  # 构建镜像
make docker-down   # 停止服务
```
