#!/bin/bash
# FastAPI 项目初始化脚本

echo "创建 FastAPI 项目结构..."

# 创建主要目录结构
mkdir -p app/core
mkdir -p app/api/v1/endpoints
mkdir -p app/models
mkdir -p app/schemas
mkdir -p app/services
mkdir -p app/db
mkdir -p app/tests/api/v1
mkdir -p alembic

# 创建 __init__.py 文件
touch app/__init__.py
touch app/core/__init__.py
touch app/api/__init__.py
touch app/api/v1/__init__.py
touch app/api/v1/endpoints/__init__.py
touch app/models/__init__.py
touch app/schemas/__init__.py
touch app/services/__init__.py
touch app/db/__init__.py
touch app/tests/__init__.py
touch app/tests/api/__init__.py
touch app/tests/api/v1/__init__.py

# 创建基础文件
cat > app/main.py << 'EOF'
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import get_settings

settings = get_settings()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_PREFIX}/openapi.json"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Welcome to FastAPI"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
EOF

cat > app/core/config.py << 'EOF'
from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    """应用配置"""
    PROJECT_NAME: str = "FastAPI Project"
    VERSION: str = "1.0.0"
    API_V1_PREFIX: str = "/api/v1"

    DATABASE_URL: str

    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    BACKEND_CORS_ORIGINS: list[str] = ["http://localhost:3000"]

    class Config:
        env_file = ".env"
        case_sensitive = True

@lru_cache()
def get_settings() -> Settings:
    return Settings()
EOF

cat > app/db/session.py << 'EOF'
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import get_settings

settings = get_settings()

engine = create_async_engine(settings.DATABASE_URL, echo=True)
async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

Base = declarative_base()

async def get_db() -> AsyncSession:
    async with async_session() as session:
        yield session
EOF

cat > .env.example << 'EOF'
# API 配置
PROJECT_NAME="FastAPI Project"
VERSION="1.0.0"
API_V1_PREFIX="/api/v1"

# 数据库
DATABASE_URL="postgresql+asyncpg://user:password@localhost/dbname"

# 安全
SECRET_KEY="your-secret-key-here-change-in-production"
ALGORITHM="HS256"
ACCESS_TOKEN_EXPIRE_MINUTES=30

# CORS
BACKEND_CORS_ORIGINS=["http://localhost:3000"]
EOF

cat > pyproject.toml << 'EOF'
[tool.poetry]
name = "fastapi-project"
version = "1.0.0"
description = "FastAPI project following best practices"
authors = ["Your Name <your.email@example.com>"]

[tool.poetry.dependencies]
python = "^3.11"
fastapi = "^0.109.0"
uvicorn = {extras = ["standard"], version = "^0.27.0"}
pydantic = "^2.5.0"
pydantic-settings = "^2.1.0"
sqlalchemy = {extras = ["asyncio"], version = "^2.0.0"}
asyncpg = "^0.29.0"
alembic = "^1.13.0"
python-jose = {extras = ["cryptography"], version = "^3.3.0"}
passlib = {extras = ["bcrypt"], version = "^1.7.4"}
python-multipart = "^0.0.6"

[tool.poetry.group.dev.dependencies]
pytest = "^7.4.0"
pytest-asyncio = "^0.21.0"
httpx = "^0.26.0"
black = "^24.0.0"
ruff = "^0.1.0"

[build-system]
requires = ["poetry-core"]
build-backend = "poetry.core.masonry.api"
EOF

cat > requirements.txt << 'EOF'
fastapi>=0.109.0
uvicorn[standard]>=0.27.0
pydantic>=2.5.0
pydantic-settings>=2.1.0
sqlalchemy[asyncio]>=2.0.0
asyncpg>=0.29.0
alembic>=1.13.0
python-jose[cryptography]>=3.3.0
passlib[bcrypt]>=1.7.4
python-multipart>=0.0.6

# Dev dependencies
pytest>=7.4.0
pytest-asyncio>=0.21.0
httpx>=0.26.0
black>=24.0.0
ruff>=0.1.0
EOF

cat > .gitignore << 'EOF'
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
env/
venv/
ENV/
.venv
.env
.idea/
.vscode/
*.log
.DS_Store
*.db
*.sqlite
alembic/versions/*.py
!alembic/versions/__init__.py
EOF

cat > README.md << 'EOF'
# FastAPI Project

基于 FastAPI 最佳实践构建的项目。

## 快速开始

1. 安装依赖：
```bash
pip install -r requirements.txt
# 或使用 poetry
poetry install
```

2. 复制环境变量文件：
```bash
cp .env.example .env
```

3. 编辑 `.env` 文件，配置数据库和密钥

4. 运行数据库迁移：
```bash
alembic upgrade head
```

5. 启动开发服务器：
```bash
uvicorn app.main:app --reload
```

6. 访问 API 文档：
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## 项目结构

```
app/
├── core/          # 核心配置
├── api/           # API 路由
├── models/        # 数据库模型
├── schemas/       # Pydantic schemas
├── services/      # 业务逻辑
└── db/            # 数据库配置
```

## 开发

运行测试：
```bash
pytest
```

代码格式化：
```bash
black app/
ruff check app/ --fix
```
EOF

echo "✅ FastAPI 项目结构创建完成！"
echo ""
echo "下一步："
echo "1. 复制 .env.example 到 .env"
echo "2. 配置数据库连接"
echo "3. 安装依赖: pip install -r requirements.txt"
echo "4. 运行: uvicorn app.main:app --reload"
