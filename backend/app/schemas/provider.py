"""
Provider 请求/响应 Pydantic 模型
"""
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


# ========== 请求模型 ==========

class ProviderCreateRequest(BaseModel):
    """创建 Provider 请求"""
    name: str = Field(..., min_length=1, max_length=50, description="唯一标识")
    display_name: str | None = Field(None, max_length=100, description="显示名称")
    provider_type: str = Field(..., pattern=r"^(llm|image|video)$", description="类型: llm/image/video")
    base_url: str = Field(..., min_length=1, max_length=500, description="API 基础 URL")
    api_key: str = Field(..., min_length=1, max_length=500, description="API Key")
    default_model: str = Field(..., min_length=1, max_length=100, description="默认模型")
    is_active: bool = Field(True, description="是否启用")
    sort_order: int = Field(0, description="排序权重")


class ProviderUpdateRequest(BaseModel):
    """更新 Provider 请求（所有字段可选）"""
    name: str | None = Field(None, min_length=1, max_length=50)
    display_name: str | None = Field(None, max_length=100)
    provider_type: str | None = Field(None, pattern=r"^(llm|image|video)$")
    base_url: str | None = Field(None, min_length=1, max_length=500)
    api_key: str | None = Field(None, min_length=1, max_length=500)
    default_model: str | None = Field(None, min_length=1, max_length=100)
    is_active: bool | None = None
    sort_order: int | None = None


# ========== 响应模型 ==========

class ProviderResponse(BaseModel):
    """Provider 响应（api_key 脱敏）"""
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    display_name: str | None
    provider_type: str
    base_url: str
    api_key: str  # 脱敏后的值
    default_model: str
    is_active: bool
    sort_order: int
    created_at: datetime
    updated_at: datetime

    @classmethod
    def from_provider(cls, provider) -> "ProviderResponse":
        """从 ORM 对象创建，api_key 脱敏"""
        return cls(
            id=provider.id,
            name=provider.name,
            display_name=provider.display_name,
            provider_type=provider.provider_type,
            base_url=provider.base_url,
            api_key=cls._mask_key(provider.api_key),
            default_model=provider.default_model,
            is_active=provider.is_active,
            sort_order=provider.sort_order,
            created_at=provider.created_at,
            updated_at=provider.updated_at,
        )

    @staticmethod
    def _mask_key(key: str) -> str:
        """API Key 脱敏：显示前4位 + ****"""
        if len(key) <= 4:
            return "****"
        return key[:4] + "****"


class ProviderListResponse(BaseModel):
    """Provider 列表响应"""
    total: int
    providers: list[ProviderResponse]
