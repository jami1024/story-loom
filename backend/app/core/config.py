"""
统一配置管理 - 使用 pydantic-settings
"""
from functools import lru_cache

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # 数据库
    DATABASE_URL: str = "mysql+aiomysql://storyloom:storyloom_password@mysql:3306/storyloom?charset=utf8mb4"

    # 智谱 AI
    ZHIPU_AUTH_TOKEN: str = ""
    ZHIPU_SIGN_SECRET: str = ""

    # DeepSeek (fallback: 首次启动自动写入 DB)
    DEEPSEEK_API_KEY: str = ""

    # 智谱 GLM (fallback: 首次启动自动写入 DB)
    ZHIPU_API_KEY: str = ""

    # OpenAI (fallback: 首次启动自动写入 DB)
    OPENAI_API_KEY: str = ""

    # SiliconFlow (fallback: 首次启动自动写入 DB)
    SILICON_API_KEY: str = ""

    # Google Gemini (fallback: 首次启动自动写入 DB)
    GEMINI_API_KEY: str = ""

    # CORS
    CORS_ORIGINS: list[str] = ["http://localhost:5173"]

    model_config = {"env_file": ".env", "case_sensitive": True}


@lru_cache()
def get_settings() -> Settings:
    return Settings()
