"""
Provider 管理 API — CRUD + 热更新
"""
import logging

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.provider import (
    ProviderCreateRequest,
    ProviderListResponse,
    ProviderResponse,
    ProviderUpdateRequest,
)
from app.services.image_client import get_image_client
from app.services.llm_client import get_llm_client
from app.services.provider_service import ProviderService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/providers", tags=["Provider 管理"])


@router.get("", summary="列出所有 Provider", response_model=ProviderListResponse)
async def list_providers(
    provider_type: str | None = Query(None, alias="type", description="按类型筛选: llm/image/video"),
    db: AsyncSession = Depends(get_db),
):
    providers = await ProviderService.get_all_providers(db, provider_type)
    return ProviderListResponse(
        total=len(providers),
        providers=[ProviderResponse.from_provider(p) for p in providers],
    )


@router.get("/{provider_id}", summary="获取单个 Provider", response_model=ProviderResponse)
async def get_provider(
    provider_id: int,
    db: AsyncSession = Depends(get_db),
):
    provider = await ProviderService.get_provider_by_id(db, provider_id)
    return ProviderResponse.from_provider(provider)


@router.post("", summary="创建 Provider", response_model=ProviderResponse)
async def create_provider(
    req: ProviderCreateRequest,
    db: AsyncSession = Depends(get_db),
):
    provider = await ProviderService.create_provider(db, **req.model_dump())
    return ProviderResponse.from_provider(provider)


@router.put("/{provider_id}", summary="更新 Provider", response_model=ProviderResponse)
async def update_provider(
    provider_id: int,
    req: ProviderUpdateRequest,
    db: AsyncSession = Depends(get_db),
):
    update_data = req.model_dump(exclude_unset=True)
    provider = await ProviderService.update_provider(db, provider_id, **update_data)
    return ProviderResponse.from_provider(provider)


@router.delete("/{provider_id}", summary="删除 Provider")
async def delete_provider(
    provider_id: int,
    db: AsyncSession = Depends(get_db),
):
    await ProviderService.delete_provider(db, provider_id)
    return {"message": "删除成功"}


@router.post("/reload", summary="热更新：重新加载客户端配置")
async def reload_providers(db: AsyncSession = Depends(get_db)):
    """从数据库重新加载所有 provider 配置到 LLM/Image 客户端"""
    llm_providers = await ProviderService.get_providers_by_type(db, "llm")
    image_providers = await ProviderService.get_providers_by_type(db, "image")

    llm_client = get_llm_client()
    await llm_client.reload([p.to_config() for p in llm_providers])

    image_client = get_image_client()
    await image_client.reload([p.to_config() for p in image_providers])

    logger.info(f"客户端热更新完成: LLM={len(llm_providers)}, Image={len(image_providers)}")
    return {
        "message": "客户端配置已重新加载",
        "llm_providers": len(llm_providers),
        "image_providers": len(image_providers),
    }
