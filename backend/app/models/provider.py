"""
AI Provider 数据模型 — 存储各 AI 服务商配置
"""
from sqlalchemy import Boolean, Column, DateTime, Integer, String
from sqlalchemy.sql import func

from app.database import Base


class AIProvider(Base):
    """AI 服务提供商配置"""
    __tablename__ = "ai_providers"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(50), unique=True, nullable=False, comment="唯一标识: deepseek, zhipu-image")
    display_name = Column(String(100), nullable=True, comment="显示名称: LLM 通道 A / 图像通道 A")
    provider_type = Column(String(20), nullable=False, comment="类型: llm / image / video")
    base_url = Column(String(500), nullable=False, comment="API 基础 URL（支持代理站）")
    api_key = Column(String(500), nullable=False, comment="API Key")
    default_model = Column(String(100), nullable=False, comment="默认模型")
    is_active = Column(Boolean, default=True, nullable=False, comment="是否启用")
    client_type = Column(
        String(30), default="openai_image", nullable=False,
        comment="客户端类型: openai_image / openai_chat / gemini_sdk / gemini_native",
    )
    relay_type = Column(String(50), nullable=True, default=None, comment="中转站类型: aiberm, one-api, new-api 等，空值表示直连")
    sort_order = Column(Integer, default=0, nullable=False, comment="排序权重")
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    def to_config(self) -> dict:
        """转换为客户端初始化所需的配置字典"""
        return {
            "name": self.name,
            "base_url": self.base_url,
            "api_key": self.api_key,
            "default_model": self.default_model,
            "client_type": self.client_type,
            "relay_type": self.relay_type,
        }
