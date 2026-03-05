"""
视频生成API路由
"""
from fastapi import APIRouter, HTTPException, Depends
import logging
import asyncio
from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas.video import (
    VideoGenerateRequest,
    VideoGenerateResponse,
    BatchVideoGenerateResponse,
    VideoStatusResponse,
    QuotaInfoResponse,
)
from app.services.zhipu_video import ZhipuVideoService
from app.services.task_service import TaskService
from app.database import get_db
from app.core.config import get_settings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/video", tags=["视频生成"])


def _get_auth_token() -> str:
    """从配置中获取授权token"""
    token = get_settings().ZHIPU_AUTH_TOKEN
    if not token:
        raise HTTPException(
            status_code=401,
            detail="未配置 ZHIPU_AUTH_TOKEN 环境变量，请在 .env 文件中配置",
        )
    if not token.startswith("Bearer "):
        token = f"Bearer {token}"
    return token


@router.post("/generate", response_model=BatchVideoGenerateResponse, summary="生成视频")
async def generate_video(request: VideoGenerateRequest, db: AsyncSession = Depends(get_db)):
    """
    批量生成视频（文生视频）

    - **prompt**: 视频描述文字（必填）
    - **duration**: 视频时长（1=5秒, 2=10秒，默认5秒）
    - **ratio**: 视频比例（默认16:9）
    - **count**: 生成视频条数（1-5条，默认1条）

    返回任务列表，每个任务包含chat_id用于查询生成状态
    """
    logger.info(f"收到视频生成请求 - Prompt: {request.prompt[:50]}... 条数: {request.count}")

    try:
        auth_token = _get_auth_token()

        ratio_map = {
            "16:9": (16, 9),
            "9:16": (9, 16),
            "1:1": (1, 1),
            "3:2": (3, 2),
        }
        ratio_width, ratio_height = ratio_map.get(request.ratio.value, (16, 9))

        logger.info(f"调用视频生成 API - 时长: {request.duration.value}, 比例: {request.ratio.value}, 条数: {request.count}")

        tasks = []
        success_count = 0
        failed_count = 0

        async with ZhipuVideoService(auth_token) as service:
            for index in range(request.count):
                try:
                    if index > 0:
                        logger.info(f"等待 3 秒后创建任务 {index + 1}/{request.count}...")
                        await asyncio.sleep(3)

                    result = await service.generate_video_text2video(
                        prompt=request.prompt,
                        duration=request.duration.value,
                        ratio_width=ratio_width,
                        ratio_height=ratio_height,
                    )

                    chat_id = result.get("chat_id")
                    logger.info(f"任务 {index + 1}/{request.count} 创建成功 - ChatID: {chat_id}")

                    await TaskService.create_task(
                        db=db,
                        chat_id=chat_id,
                        prompt=request.prompt,
                        status=result.get("status"),
                        msg=result.get("msg"),
                        duration=request.duration.value,
                        ratio=request.ratio.value,
                    )

                    tasks.append(VideoGenerateResponse(
                        chat_id=chat_id,
                        status=result.get("status"),
                        msg=result.get("msg"),
                    ))
                    success_count += 1

                except Exception as e:
                    logger.error(f"任务 {index + 1}/{request.count} 创建失败 - 错误: {e}")
                    failed_count += 1

        logger.info(f"批量任务创建完成 - 成功: {success_count}, 失败: {failed_count}")

        if success_count == 0:
            raise HTTPException(status_code=500, detail="所有视频生成任务均创建失败")

        return BatchVideoGenerateResponse(
            tasks=tasks,
            total=request.count,
            success=success_count,
            failed=failed_count,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"视频生成失败 - 错误: {e}")
        raise HTTPException(status_code=500, detail=f"视频生成失败: {e}")


@router.get("/status/{chat_id}", response_model=VideoStatusResponse, summary="查询视频状态")
async def get_video_status(chat_id: str, db: AsyncSession = Depends(get_db)):
    """
    查询视频生成状态

    - **chat_id**: 任务ID（从generate接口返回）

    返回视频生成状态，包括进度和视频URL（完成时）
    """
    logger.info(f"查询任务状态 - ChatID: {chat_id}")

    try:
        auth_token = _get_auth_token()

        async with ZhipuVideoService(auth_token) as service:
            result = await service.get_video_status(chat_id)

        status = result.get("status")
        plan = result.get("plan")
        video_url = result.get("video_url")

        if status == "finished":
            logger.info(f"任务完成 - ChatID: {chat_id}, 视频URL: {video_url[:50] if video_url else 'N/A'}...")
        elif status == "processing":
            logger.info(f"任务处理中 - ChatID: {chat_id}, 进度: {plan or 'N/A'}")
        elif status == "failed":
            logger.warning(f"任务失败 - ChatID: {chat_id}, 消息: {result.get('msg')}")
        else:
            logger.info(f"任务状态: {status} - ChatID: {chat_id}")

        updated_task = await TaskService.update_task(
            db=db,
            chat_id=chat_id,
            status=result.get("status"),
            msg=result.get("msg"),
            plan=result.get("plan"),
            video_url=result.get("video_url"),
            cover_url=result.get("cover_url"),
            video_resolution=result.get("video_resolution"),
            video_duration=result.get("video_duration"),
            video_fps=result.get("video_fps"),
        )

        if updated_task:
            logger.debug(f"任务状态已更新到数据库 - ChatID: {chat_id}")
        else:
            logger.warning(f"未找到任务记录 - ChatID: {chat_id}")

        return VideoStatusResponse(
            chat_id=result.get("chat_id", chat_id),
            status=result.get("status"),
            msg=result.get("msg"),
            plan=result.get("plan"),
            video_url=result.get("video_url"),
            cover_url=result.get("cover_url"),
            video_resolution=result.get("video_resolution"),
            video_duration=result.get("video_duration"),
            video_fps=result.get("video_fps"),
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"查询状态失败 - ChatID: {chat_id}, 错误: {e}")
        raise HTTPException(status_code=500, detail=f"查询状态失败: {e}")


@router.get("/quota", response_model=QuotaInfoResponse, summary="查询配额")
async def get_quota():
    """
    查询视频生成配额

    返回已使用次数、总配额和剩余次数
    """
    logger.info("查询配额信息")

    try:
        auth_token = _get_auth_token()

        async with ZhipuVideoService(auth_token) as service:
            result = await service.get_trial_info()

        video_times = result.get("video_times", 0)
        video_total = result.get("video_total", 0)
        remaining = video_total - video_times

        logger.info(f"配额查询成功 - 已用: {video_times}/{video_total}, 剩余: {remaining}")

        return QuotaInfoResponse(
            video_times=video_times,
            video_total=video_total,
            remaining=remaining,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"查询配额失败 - 错误: {e}")
        raise HTTPException(status_code=500, detail=f"查询配额失败: {e}")


@router.get("/history", summary="查询历史记录")
async def get_history(limit: int = 50, offset: int = 0, db: AsyncSession = Depends(get_db)):
    """
    查询视频生成历史记录

    - **limit**: 返回数量限制（默认50）
    - **offset**: 偏移量（默认0）

    返回最近的任务列表，按时间倒序
    """
    logger.info(f"查询历史记录 - Limit: {limit}, Offset: {offset}")

    try:
        tasks = await TaskService.get_all_tasks(db=db, limit=limit, offset=offset)
        total = await TaskService.get_task_count(db=db)

        logger.info(f"历史记录查询成功 - 总数: {total}, 返回: {len(tasks)} 条")

        return {
            "total": total,
            "tasks": [task.to_dict() for task in tasks],
        }

    except Exception as e:
        logger.error(f"查询历史记录失败 - 错误: {e}")
        raise HTTPException(status_code=500, detail=f"查询历史记录失败: {e}")
