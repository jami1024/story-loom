# React 辅助脚本

本目录包含 React 项目常用的开发辅助脚本，**所有环境通过 Docker Compose 管理**。

## 核心理念

- 使用 **Docker Compose** 统一管理开发、测试、生产环境
- 脚本只做辅助工作（lint、分析、依赖检查等）
- 通过 Makefile 提供统一的命令入口

## 脚本列表

| 脚本 | 说明 | 用法 |
|------|------|------|
| `lint.sh` | 代码检查 | `./scripts/lint.sh` |
| `analyze.sh` | Bundle 分析 | `./scripts/analyze.sh` |
| `check-deps.sh` | 依赖更新检查 | `./scripts/check-deps.sh` |
| `docker-build.sh` | 构建 Docker 镜像 | `./scripts/docker-build.sh [image] [tag]` |

## Docker Compose 使用

### 开发环境

```bash
# 启动开发环境
docker compose --profile dev up -d

# 查看日志
docker compose logs -f app-dev

# 停止服务
docker compose down
```

### 测试

```bash
# 在容器中运行测试
docker compose exec app-dev npm run test

# 或使用 Makefile
make test
```

### 生产环境

```bash
# 构建并启动生产环境
docker compose --profile prod up -d --build

# 查看生产环境日志
docker compose logs -f app-prod
```

## 脚本使用

### 1. 添加执行权限

```bash
chmod +x scripts/*.sh
```

### 2. 代码检查

```bash
# 在容器中运行
docker compose exec app-dev ./scripts/lint.sh

# 或本地运行
./scripts/lint.sh
```

### 3. Bundle 分析

```bash
# 分析打包大小
./scripts/analyze.sh
```

### 4. 依赖检查

```bash
# 检查依赖更新和安全问题
./scripts/check-deps.sh
```

## 推荐：使用 Makefile

使用 Makefile 作为统一命令入口：

```bash
make dev           # 启动开发环境 (docker compose)
make build         # 构建生产版本
make test          # 运行测试
make lint          # 代码检查
make analyze       # Bundle 分析
make docker-dev    # 启动 Docker 开发环境
make docker-prod   # 启动 Docker 生产环境
make docker-down   # 停止服务
```
