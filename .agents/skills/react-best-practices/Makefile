.PHONY: help install dev build test lint format docker clean

# 默认目标：显示帮助信息
help:
	@echo "Available commands:"
	@echo "  make install  - Install dependencies"
	@echo "  make dev      - Start development server"
	@echo "  make build    - Build for production"
	@echo "  make preview  - Preview production build"
	@echo "  make test     - Run tests"
	@echo "  make lint     - Run linters"
	@echo "  make format   - Format code"
	@echo "  make docker   - Start Docker services"
	@echo "  make clean    - Clean build artifacts and cache"

# 安装依赖
install:
	npm install

# 启动开发服务器
dev:
	npm run dev

# 构建生产版本
build:
	npm run build

# 预览生产构建
preview:
	npm run preview

# 运行测试
test:
	npm run test

# 运行测试（UI 模式）
test-ui:
	npm run test:ui

# 代码检查
lint:
	npm run lint

# 代码格式化
format:
	npm run format

# 类型检查
type-check:
	npm run type-check

# 启动 Docker 服务（开发模式）
docker-dev:
	docker-compose --env-file .env.dev --profile dev up -d

# 启动 Docker 服务（生产模式）
docker-prod:
	docker-compose --env-file .env.prod --profile prod up -d --build

# 构建 Docker 镜像
docker-build:
	docker-compose --env-file .env.prod --profile prod build --no-cache

# 查看 Docker 日志
docker-logs-dev:
	docker-compose logs -f app-dev

docker-logs-prod:
	docker-compose logs -f app-prod

# 停止 Docker 服务
docker-down:
	docker-compose down

# Bundle 分析
analyze:
	npm run build -- --mode analyze

# 清理构建产物和缓存
clean:
	rm -rf node_modules/ dist/ coverage/ .vite/ .turbo/
	rm -f package-lock.json
