"""
故事项目 CRUD 服务 + 流程编排
"""
import logging

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.exceptions import AppException
from app.models.story import (
    ShotCharacterEmotion,
    StoryCharacter,
    StoryProject,
    StoryScene,
    StoryShot,
)
from app.services.prompts.character_image import build_character_image_prompt
from app.services.prompts.scene_image import build_scene_image_prompt

logger = logging.getLogger(__name__)


class StoryService:
    """故事项目服务"""

    @staticmethod
    async def create_project(db: AsyncSession, **data) -> StoryProject:
        """创建项目"""
        project = StoryProject(**data)
        db.add(project)
        await db.commit()
        await db.refresh(project)
        return project

    @staticmethod
    async def get_project_list(
        db: AsyncSession, limit: int = 20, offset: int = 0
    ) -> tuple[list[dict], int]:
        """获取项目列表（含统计信息）"""
        # 查询项目
        stmt = (
            select(StoryProject)
            .order_by(StoryProject.created_at.desc())
            .offset(offset)
            .limit(limit)
        )
        result = await db.execute(stmt)
        projects = list(result.scalars().all())

        # 总数
        count_stmt = select(func.count(StoryProject.id))
        total = (await db.execute(count_stmt)).scalar_one()

        # 统计每个项目的角色/场景/分镜数
        items = []
        for p in projects:
            char_count = (
                await db.execute(
                    select(func.count(StoryCharacter.id)).where(
                        StoryCharacter.project_id == p.id
                    )
                )
            ).scalar_one()
            scene_count = (
                await db.execute(
                    select(func.count(StoryScene.id)).where(
                        StoryScene.project_id == p.id
                    )
                )
            ).scalar_one()
            shot_count = (
                await db.execute(
                    select(func.count(StoryShot.id)).where(
                        StoryShot.project_id == p.id
                    )
                )
            ).scalar_one()

            d = p.to_dict()
            d["character_count"] = char_count
            d["scene_count"] = scene_count
            d["shot_count"] = shot_count
            items.append(d)

        return items, total

    @staticmethod
    async def get_project_detail(db: AsyncSession, project_id: int) -> dict | None:
        """获取项目完整详情（含角色/场景/分镜/情绪的嵌套数据）"""
        stmt = (
            select(StoryProject)
            .where(StoryProject.id == project_id)
            .options(
                selectinload(StoryProject.characters),
                selectinload(StoryProject.scenes),
                selectinload(StoryProject.shots)
                .selectinload(StoryShot.character_emotions)
                .selectinload(ShotCharacterEmotion.character),
                selectinload(StoryProject.shots).selectinload(StoryShot.scene),
            )
        )
        result = await db.execute(stmt)
        project = result.scalar_one_or_none()
        if not project:
            return None

        data = project.to_dict()
        data["characters"] = [c.to_dict() for c in sorted(project.characters, key=lambda x: x.sort_order)]
        data["scenes"] = [s.to_dict() for s in sorted(project.scenes, key=lambda x: x.sort_order)]

        shots_data = []
        for shot in sorted(project.shots, key=lambda x: x.sort_order):
            sd = shot.to_dict()
            sd["scene_name"] = shot.scene.name if shot.scene else None
            sd["character_emotions"] = [e.to_dict() for e in shot.character_emotions]
            shots_data.append(sd)
        data["shots"] = shots_data

        return data

    @staticmethod
    async def delete_project(db: AsyncSession, project_id: int) -> bool:
        """删除项目（级联删除）"""
        stmt = select(StoryProject).where(StoryProject.id == project_id)
        result = await db.execute(stmt)
        project = result.scalar_one_or_none()
        if not project:
            return False
        await db.delete(project)
        await db.commit()
        return True

    @staticmethod
    async def get_project(db: AsyncSession, project_id: int) -> StoryProject | None:
        """获取项目实体"""
        stmt = select(StoryProject).where(StoryProject.id == project_id)
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    @staticmethod
    async def update_character(db: AsyncSession, char_id: int, **data) -> dict | None:
        """编辑角色"""
        stmt = select(StoryCharacter).where(StoryCharacter.id == char_id)
        result = await db.execute(stmt)
        char = result.scalar_one_or_none()
        if not char:
            return None
        for key, value in data.items():
            if value is not None and hasattr(char, key):
                setattr(char, key, value)
        await db.commit()
        await db.refresh(char)
        return char.to_dict()

    @staticmethod
    async def update_scene(db: AsyncSession, scene_id: int, **data) -> dict | None:
        """编辑场景"""
        stmt = select(StoryScene).where(StoryScene.id == scene_id)
        result = await db.execute(stmt)
        scene = result.scalar_one_or_none()
        if not scene:
            return None
        for key, value in data.items():
            if value is not None and hasattr(scene, key):
                setattr(scene, key, value)
        await db.commit()
        await db.refresh(scene)
        return scene.to_dict()

    @staticmethod
    async def update_shot(db: AsyncSession, shot_id: int, **data) -> dict | None:
        """编辑分镜"""
        stmt = select(StoryShot).where(StoryShot.id == shot_id)
        result = await db.execute(stmt)
        shot = result.scalar_one_or_none()
        if not shot:
            return None
        for key, value in data.items():
            if value is not None and hasattr(shot, key):
                setattr(shot, key, value)
        await db.commit()
        await db.refresh(shot)
        return shot.to_dict()

    @staticmethod
    async def update_emotion(
        db: AsyncSession, shot_id: int, char_id: int, **data
    ) -> dict | None:
        """编辑角色情绪"""
        stmt = select(ShotCharacterEmotion).where(
            ShotCharacterEmotion.shot_id == shot_id,
            ShotCharacterEmotion.character_id == char_id,
        )
        result = await db.execute(stmt)
        emotion = result.scalar_one_or_none()

        if not emotion:
            # 如果不存在则创建
            emotion = ShotCharacterEmotion(shot_id=shot_id, character_id=char_id)
            for key, value in data.items():
                if hasattr(emotion, key):
                    setattr(emotion, key, value)
            db.add(emotion)
            await db.commit()
            await db.refresh(emotion)
        else:
            for key, value in data.items():
                if value is not None and hasattr(emotion, key):
                    setattr(emotion, key, value)
            await db.commit()
            await db.refresh(emotion)

        # 加载关联的 character
        stmt2 = (
            select(ShotCharacterEmotion)
            .where(ShotCharacterEmotion.id == emotion.id)
            .options(selectinload(ShotCharacterEmotion.character))
        )
        result2 = await db.execute(stmt2)
        emotion = result2.scalar_one()
        return emotion.to_dict()

    # ========== 角色图片生成 ==========

    @staticmethod
    async def generate_character_image(
        db: AsyncSession,
        char_id: int,
        image_client,
        custom_prompt: str | None = None,
    ) -> dict:
        """为角色生成参考图片"""
        # 查询角色 + 关联项目
        stmt = (
            select(StoryCharacter)
            .where(StoryCharacter.id == char_id)
            .options(selectinload(StoryCharacter.project))
        )
        result = await db.execute(stmt)
        char = result.scalar_one_or_none()
        if not char:
            raise AppException("角色不存在", status_code=404)

        project = char.project

        # 构建 image prompt
        if custom_prompt:
            prompt = custom_prompt
        else:
            prompt = build_character_image_prompt(
                name=char.name,
                gender=char.gender,
                age=char.age,
                appearance_brief=char.appearance_brief,
                personality=char.personality,
                clothing=char.clothing,
                project_style=project.style if project else None,
            )

        # 更新状态为 generating
        char.image_status = "generating"
        char.image_prompt = prompt
        await db.commit()

        try:
            # 获取 provider 和 model 配置（若项目指定的 provider 不可用则回退到首个可用通道）
            requested = project.image_provider if project else None
            if requested and requested in image_client.available_providers:
                provider = requested
            else:
                provider = image_client.get_default_provider()
            model = project.image_model if project else None
            if not provider:
                raise AppException("无可用的图片生成通道，请在设置中配置", status_code=400)

            # 调用图片生成
            image_url = await image_client.generate_image(
                prompt=prompt,
                provider=provider,
                model=model or None,
            )

            # 保存结果
            char.image_url = image_url
            char.image_status = "completed"
            await db.commit()
            await db.refresh(char)

            return char.to_dict()

        except Exception as e:
            logger.error(f"角色 {char_id} 图片生成失败: {e}")
            char.image_status = "failed"
            await db.commit()
            raise AppException(f"图片生成失败: {e}", status_code=500)

    @staticmethod
    async def generate_all_character_images(
        db: AsyncSession,
        project_id: int,
        image_client,
    ) -> list[dict]:
        """批量为项目所有角色生成图片"""
        # 查询项目的所有角色
        stmt = (
            select(StoryCharacter)
            .where(StoryCharacter.project_id == project_id)
            .order_by(StoryCharacter.sort_order)
        )
        result = await db.execute(stmt)
        characters = list(result.scalars().all())

        if not characters:
            raise AppException("该项目暂无角色", status_code=400)

        results = []
        for char in characters:
            try:
                char_result = await StoryService.generate_character_image(
                    db, char.id, image_client
                )
                results.append(char_result)
            except Exception as e:
                logger.error(f"角色 {char.id} ({char.name}) 图片生成失败: {e}")
                results.append({
                    "id": char.id,
                    "name": char.name,
                    "image_status": "failed",
                    "error": str(e),
                })

        return results

    # ========== 场景图片生成 ==========

    @staticmethod
    async def generate_scene_image(
        db: AsyncSession,
        scene_id: int,
        image_client,
        custom_prompt: str | None = None,
    ) -> dict:
        """为场景生成参考图片"""
        # 查询场景 + 关联项目
        stmt = (
            select(StoryScene)
            .where(StoryScene.id == scene_id)
            .options(selectinload(StoryScene.project))
        )
        result = await db.execute(stmt)
        scene = result.scalar_one_or_none()
        if not scene:
            raise AppException("场景不存在", status_code=404)

        project = scene.project

        # 构建 image prompt
        if custom_prompt:
            prompt = custom_prompt
        else:
            prompt = build_scene_image_prompt(
                name=scene.name,
                location=scene.location,
                time_of_day=scene.time_of_day,
                weather=scene.weather,
                atmosphere=scene.atmosphere,
                architecture_style=scene.architecture_style,
                lighting_design=scene.lighting_design,
                color_palette=scene.color_palette,
                key_props=scene.key_props if isinstance(scene.key_props, list) else None,
                spatial_layout=scene.spatial_layout,
                visual_prompt_zh=scene.visual_prompt_zh,
                project_style=project.style if project else None,
            )

        # 更新状态为 generating
        scene.image_status = "generating"
        scene.image_prompt = prompt
        await db.commit()

        try:
            # 获取 provider 和 model 配置（若项目指定的 provider 不可用则回退到首个可用通道）
            requested = project.image_provider if project else None
            if requested and requested in image_client.available_providers:
                provider = requested
            else:
                provider = image_client.get_default_provider()
            model = project.image_model if project else None
            if not provider:
                raise AppException("无可用的图片生成通道，请在设置中配置", status_code=400)

            # 调用图片生成（宽景 16:9）
            image_url = await image_client.generate_image(
                prompt=prompt,
                provider=provider,
                model=model or None,
                size="1024x576",
            )

            # 保存结果
            scene.image_url = image_url
            scene.image_status = "completed"
            await db.commit()
            await db.refresh(scene)

            return scene.to_dict()

        except Exception as e:
            logger.error(f"场景 {scene_id} 图片生成失败: {e}")
            scene.image_status = "failed"
            await db.commit()
            raise AppException(f"图片生成失败: {e}", status_code=500)

    @staticmethod
    async def generate_all_scene_images(
        db: AsyncSession,
        project_id: int,
        image_client,
    ) -> list[dict]:
        """批量为项目所有场景生成参考图片"""
        stmt = (
            select(StoryScene)
            .where(StoryScene.project_id == project_id)
            .order_by(StoryScene.sort_order)
        )
        result = await db.execute(stmt)
        scenes = list(result.scalars().all())

        if not scenes:
            raise AppException("该项目暂无场景", status_code=400)

        results = []
        for scene in scenes:
            try:
                scene_result = await StoryService.generate_scene_image(
                    db, scene.id, image_client
                )
                results.append(scene_result)
            except Exception as e:
                logger.error(f"场景 {scene.id} ({scene.name}) 图片生成失败: {e}")
                results.append({
                    "id": scene.id,
                    "name": scene.name,
                    "image_status": "failed",
                    "error": str(e),
                })

        return results
