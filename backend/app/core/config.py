"""
统一配置管理 - 使用 pydantic-settings
"""
from functools import lru_cache

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # 数据库
    DATABASE_URL: str = "mysql+aiomysql://storyloom:storyloom_password@mysql:3306/storyloom?charset=utf8mb4"

    # 视频生成供应商
    ZHIPU_AUTH_TOKEN: str = ""
    ZHIPU_SIGN_SECRET: str = ""

    # LLM 通道 A (fallback: 首次启动自动写入 DB)
    DEEPSEEK_API_KEY: str = ""

    # LLM 通道 B (fallback: 首次启动自动写入 DB)
    ZHIPU_API_KEY: str = ""

    # 图像通道 B (fallback: 首次启动自动写入 DB)
    OPENAI_API_KEY: str = ""

    # 图像通道 C (fallback: 首次启动自动写入 DB)
    SILICON_API_KEY: str = ""

    # 图像通道 D/E (fallback: 首次启动自动写入 DB)
    GEMINI_API_KEY: str = ""

    # CORS
    CORS_ORIGINS: list[str] = ["http://localhost:5173"]

    model_config = {"env_file": ".env", "case_sensitive": True}


@lru_cache()
def get_settings() -> Settings:
    return Settings()
