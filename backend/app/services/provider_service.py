"""
Provider CRUD 服务 + 环境变量 fallback 初始化
"""
import logging

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.exceptions import AppException
from app.models.provider import AIProvider

logger = logging.getLogger(__name__)


class ProviderService:
    """AI Provider 管理服务"""

    # 环境变量 → 默认 provider 映射
    _DEFAULT_PROVIDERS = [
        {
            "env_key": "DEEPSEEK_API_KEY",
            "name": "deepseek",
            "display_name": "LLM 通道 A",
            "provider_type": "llm",
            "base_url": "https://api.deepseek.com",
            "default_model": "deepseek-chat",
            "client_type": "openai_image",
            "sort_order": 0,
        },
        {
            "env_key": "ZHIPU_API_KEY",
            "name": "zhipu",
            "display_name": "LLM 通道 B",
            "provider_type": "llm",
            "base_url": "https://open.bigmodel.cn/api/paas/v4/",
            "default_model": "glm-4-flash",
            "client_type": "openai_image",
            "sort_order": 1,
        },
        {
            "env_key": "ZHIPU_API_KEY",
            "name": "zhipu-image",
            "display_name": "图像通道 A",
            "provider_type": "image",
            "base_url": "https://open.bigmodel.cn/api/paas/v4/",
            "default_model": "cogview-4",
            "client_type": "openai_image",
            "sort_order": 0,
        },
        {
            "env_key": "OPENAI_API_KEY",
            "name": "openai",
            "display_name": "图像通道 B",
            "provider_type": "image",
            "base_url": "https://api.openai.com/v1",
            "default_model": "dall-e-3",
            "client_type": "openai_image",
            "sort_order": 1,
        },
        {
            "env_key": "SILICON_API_KEY",
            "name": "silicon",
            "display_name": "图像通道 C",
            "provider_type": "image",
            "base_url": "https://api.siliconflow.cn/v1",
            "default_model": "black-forest-labs/FLUX.1-schnell",
            "client_type": "openai_image",
            "sort_order": 2,
        },
        {
            "env_key": "GEMINI_API_KEY",
            "name": "gemini",
            "display_name": "图像通道 D",
            "provider_type": "image",
            "base_url": "https://co.yes.vg/team/gemini",
            "default_model": "gemini-3.1-flash-image",
            "client_type": "gemini_native",
            "sort_order": 3,
        },
        {
            "env_key": "GEMINI_API_KEY",
            "name": "gemini-chat",
            "display_name": "图像通道 E（Chat 兼容）",
            "provider_type": "image",
            "base_url": "https://aiberm.com/v1",
            "default_model": "gemini-3-pro-image-preview",
            "client_type": "openai_chat",
            "sort_order": 4,
        },
    ]

    @staticmethod
    async def init_default_providers(db: AsyncSession) -> None:
        """首次启动：从环境变量创建默认 provider（如果 DB 为空）"""
        result = await db.execute(select(AIProvider).limit(1))
        if result.scalars().first() is not None:
            logger.info("数据库已有 provider 记录，跳过初始化")
            return

        settings = get_settings()
        created = 0

        for cfg in ProviderService._DEFAULT_PROVIDERS:
            api_key = getattr(settings, cfg["env_key"], "")
            if not api_key:
                logger.debug(f"环境变量 {cfg['env_key']} 未设置，跳过 {cfg['name']}")
                continue

            provider = AIProvider(
                name=cfg["name"],
                display_name=cfg["display_name"],
                provider_type=cfg["provider_type"],
                base_url=cfg["base_url"],
                api_key=api_key,
                default_model=cfg["default_model"],
                client_type=cfg.get("client_type", "openai_image"),
                sort_order=cfg["sort_order"],
            )
            db.add(provider)
            created += 1
            logger.info(f"创建默认 provider: {cfg['name']} ({cfg['provider_type']})")

        if created > 0:
            await db.commit()
            logger.info(f"从环境变量初始化了 {created} 个默认 provider")
        else:
            logger.warning("未发现任何 API Key 环境变量，provider 表为空")

    @staticmethod
    async def get_providers_by_type(
        db: AsyncSession, provider_type: str
    ) -> list[AIProvider]:
        """按类型获取已启用的 provider 列表"""
        result = await db.execute(
            select(AIProvider)
            .where(AIProvider.provider_type == provider_type, AIProvider.is_active.is_(True))
            .order_by(AIProvider.sort_order)
        )
        return list(result.scalars().all())

    @staticmethod
    async def get_all_providers(
        db: AsyncSession, provider_type: str | None = None
    ) -> list[AIProvider]:
        """获取所有 provider（可按类型筛选）"""
        stmt = select(AIProvider).order_by(AIProvider.provider_type, AIProvider.sort_order)
        if provider_type:
            stmt = stmt.where(AIProvider.provider_type == provider_type)
        result = await db.execute(stmt)
        return list(result.scalars().all())

    @staticmethod
    async def get_provider_by_id(db: AsyncSession, provider_id: int) -> AIProvider:
        """根据 ID 获取 provider"""
        result = await db.execute(
            select(AIProvider).where(AIProvider.id == provider_id)
        )
        provider = result.scalars().first()
        if not provider:
            raise AppException(f"Provider (id={provider_id}) 不存在", status_code=404)
        return provider

    @staticmethod
    async def create_provider(db: AsyncSession, **data) -> AIProvider:
        """创建 provider"""
        # 检查 name 唯一性
        existing = await db.execute(
            select(AIProvider).where(AIProvider.name == data.get("name"))
        )
        if existing.scalars().first():
            raise AppException(f"Provider name '{data['name']}' 已存在", status_code=409)

        provider = AIProvider(**data)
        db.add(provider)
        await db.commit()
        await db.refresh(provider)
        logger.info(f"创建 provider: {provider.name} ({provider.provider_type})")
        return provider

    @staticmethod
    async def update_provider(
        db: AsyncSession, provider_id: int, **data
    ) -> AIProvider:
        """更新 provider"""
        provider = await ProviderService.get_provider_by_id(db, provider_id)

        # 如果修改了 name，检查唯一性
        new_name = data.get("name")
        if new_name and new_name != provider.name:
            existing = await db.execute(
                select(AIProvider).where(AIProvider.name == new_name)
            )
            if existing.scalars().first():
                raise AppException(f"Provider name '{new_name}' 已存在", status_code=409)

        for key, value in data.items():
            if value is not None:
                setattr(provider, key, value)

        await db.commit()
        await db.refresh(provider)
        logger.info(f"更新 provider: {provider.name} (id={provider_id})")
        return provider

    @staticmethod
    async def delete_provider(db: AsyncSession, provider_id: int) -> bool:
        """删除 provider"""
        provider = await ProviderService.get_provider_by_id(db, provider_id)
        await db.delete(provider)
        await db.commit()
        logger.info(f"删除 provider: {provider.name} (id={provider_id})")
        return True
