"""
StoryLoom FastAPI 应用入口
"""
import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import get_settings
from app.core.exceptions import (
    AppException,
    app_exception_handler,
    generic_exception_handler,
    validation_exception_handler,
)
from app.core.logging import setup_logging
from app.database import async_session, init_db
from app.routers import prompt, provider, story, video
from app.services.image_client import close_image_client, init_image_client
from app.services.llm_client import close_llm_client, init_llm_client
from app.services.prompt_service import close_prompt_service, init_prompt_service
from app.services.provider_service import ProviderService

setup_logging()
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期管理"""
    # 启动
    logger.info("正在初始化数据库...")
    try:
        await init_db()
        logger.info("数据库初始化完成")
    except Exception as e:
        logger.error(f"数据库初始化失败: {e}")

    await init_prompt_service()

    # 初始化 provider（从 DB 加载，首次启动从环境变量创建默认值）
    try:
        async with async_session() as db:
            await ProviderService.init_default_providers(db)
            llm_providers = await ProviderService.get_providers_by_type(db, "llm")
            image_providers = await ProviderService.get_providers_by_type(db, "image")

        await init_llm_client([p.to_config() for p in llm_providers])
        await init_image_client([p.to_config() for p in image_providers])
    except Exception as e:
        logger.error(f"Provider 初始化失败，使用空客户端: {e}")
        await init_llm_client()
        await init_image_client()

    yield

    # 关闭
    await close_prompt_service()
    await close_llm_client()
    await close_image_client()
    logger.info("应用关闭")


# 创建 FastAPI 应用
app = FastAPI(
    title="StoryLoom API",
    description="智谱AI视频生成服务 - 4K视频创作平台",
    version="1.0.0",
    lifespan=lifespan,
)

# 注册异常处理器
app.add_exception_handler(AppException, app_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(Exception, generic_exception_handler)

# 配置 CORS
settings = get_settings()
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 挂载静态文件目录（Gemini 图片本地存储）
static_images_dir = Path("static/images")
static_images_dir.mkdir(parents=True, exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")

# 注册路由
app.include_router(video.router)
app.include_router(prompt.router)
app.include_router(story.router)
app.include_router(provider.router)


@app.get("/", tags=["健康检查"])
async def root():
    """根路径 - 健康检查"""
    return {
        "message": "StoryLoom API is running",
        "version": "1.0.0",
        "docs": "/docs",
    }


@app.get("/health", tags=["健康检查"])
async def health_check():
    """健康检查接口"""
    return {
        "status": "healthy",
        "service": "StoryLoom Video Generation API",
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
