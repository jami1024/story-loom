.PHONY: help install dev test lint format docker clean

# 默认目标：显示帮助信息
help:
	@echo "Available commands:"
	@echo "  make install  - Install dependencies"
	@echo "  make dev      - Start development server"
	@echo "  make test     - Run tests with coverage"
	@echo "  make lint     - Run linters"
	@echo "  make format   - Format code"
	@echo "  make docker   - Start Docker services"
	@echo "  make clean    - Clean cache and build artifacts"

# 安装依赖
install:
	pip install -r requirements.txt -r requirements-dev.txt

# 启动开发服务器
dev:
	uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# 运行测试
test:
	pytest tests/ -v --cov=app --cov-report=html --cov-report=term

# 代码检查
lint:
	ruff check .
	mypy app/

# 代码格式化
format:
	ruff format .
	isort .

# 启动 Docker 服务
docker:
	docker-compose --env-file .env.dev up -d

# 构建 Docker 镜像
docker-build:
	docker-compose build --no-cache

# 查看 Docker 日志
docker-logs:
	docker-compose logs -f

# 停止 Docker 服务
docker-down:
	docker-compose down

# 清理缓存和构建产物
clean:
	find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name .pytest_cache -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name .ruff_cache -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name .mypy_cache -exec rm -rf {} + 2>/dev/null || true
	rm -rf htmlcov/ dist/ build/ *.egg-info
