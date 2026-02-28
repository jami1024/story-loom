"""
智谱AI视频生成服务
使用逆向的签名算法直接调用API
"""
import aiohttp
import asyncio
import os
from typing import Optional, Dict, Any

from app.utils.zhipu_sign import generate_sign
from app.core.config import get_settings


class ZhipuVideoService:
    """智谱AI视频生成服务"""

    BASE_URL = "https://chatglm.cn"

    def __init__(self, auth_token: str = None):
        """
        初始化服务

        Args:
            auth_token: 授权token（Bearer token，可选）
        """
        self.auth_token = auth_token
        self.session: Optional[aiohttp.ClientSession] = None

    async def __aenter__(self):
        """异步上下文管理器入口"""
        self.session = aiohttp.ClientSession()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """异步上下文管理器出口"""
        if self.session:
            await self.session.close()

    def _get_headers(self, extra_headers: Dict = None) -> Dict[str, str]:
        """
        获取请求头（包含签名）

        Args:
            extra_headers: 额外的请求头

        Returns:
            完整的请求头
        """
        sign_data = generate_sign()

        headers = {
            "Accept": "application/json, text/plain, */*",
            "Content-Type": "application/json;charset=utf-8",
            "App-Name": "chatglm",
            "X-App-Platform": "pc",
            "X-App-Version": "0.0.1",
            "X-Timestamp": sign_data["timestamp"],
            "X-Nonce": sign_data["xNonce"],
            "X-Sign": sign_data["sign"],
        }

        # 添加授权token
        if self.auth_token:
            headers["Authorization"] = self.auth_token

        # 合并额外的请求头
        if extra_headers:
            headers.update(extra_headers)

        return headers

    async def _request(
        self,
        method: str,
        path: str,
        data: Dict = None,
        params: Dict = None
    ) -> Dict[str, Any]:
        """
        发送HTTP请求

        Args:
            method: 请求方法（GET/POST）
            path: API路径
            data: POST数据
            params: URL参数

        Returns:
            响应数据

        Raises:
            Exception: 请求失败时抛出异常
        """
        if not self.session:
            self.session = aiohttp.ClientSession()

        url = f"{self.BASE_URL}{path}"
        headers = self._get_headers()

        try:
            async with self.session.request(
                method,
                url,
                headers=headers,
                json=data,
                params=params
            ) as resp:
                status = resp.status
                response_data = await resp.json()

                if status == 200:
                    if response_data.get("status") == 0 or response_data.get("code") == 0:
                        return response_data.get("result", response_data)
                    else:
                        raise Exception(
                            f"API错误: {response_data.get('message', 'Unknown error')}"
                        )
                else:
                    raise Exception(f"HTTP错误: {status}, {await resp.text()}")

        except Exception as e:
            raise Exception(f"请求失败: {e}")

    async def get_trial_info(self) -> Dict[str, Any]:
        """
        获取视频生成配额信息

        Returns:
            配额信息，包含：
            - video_times: 已使用次数
            - video_total: 总配额
        """
        return await self._request("GET", "/chatglm/video-api/v1/trial/info")

    async def get_video_list(self, page: int = 1, page_size: int = 20) -> Dict[str, Any]:
        """
        获取我的视频列表

        Args:
            page: 页码
            page_size: 每页数量

        Returns:
            视频列表数据
        """
        params = {
            "page": page,
            "page_size": page_size
        }
        return await self._request(
            "GET",
            "/chatglm/video-api/v1/chat/list",
            params=params
        )

    async def generate_video_text2video(
        self,
        prompt: str,
        duration: int = 1,  # 1=5秒, 2=10秒
        ratio_width: int = 16,
        ratio_height: int = 9,
        reference_images: list[dict] | None = None,
        **kwargs
    ) -> Dict[str, Any]:
        """
        文生视频 + 可选参考图（根据真实API实现）

        Args:
            prompt: 视频描述文字
            duration: 视频时长（1=5秒, 2=10秒）
            ratio_width: 宽度比例（默认16）
            ratio_height: 高度比例（默认9）
            reference_images: 参考图列表，每项 = {"url": "...", "role": "reference_image"}
                              role 可选值: reference_image, first_frame, last_frame
            **kwargs: 其他参数

        Returns:
            任务信息，包含chat_id等
        """
        data = {
            "prompt": prompt,
            "conversation_id": "",
            "advanced_parameter_extra": {},
            "base_parameter_extra": {
                "generation_pattern": 1,
                "resolution": 1,
                "fps": 0,
                "duration": duration,
                "generation_ai_audio": 0,
                "generation_ratio_width": ratio_width,
                "generation_ratio_height": ratio_height,
                "activity_type": 0,
                "label_watermark": 1,
                "generation_type": "",
                "prompt": prompt
            }
        }

        # 传入参考图（场景/角色参考图作为视觉一致性辅助）
        if reference_images:
            data["image_with_roles"] = reference_images

        # 合并额外参数
        if kwargs:
            data["base_parameter_extra"].update(kwargs)

        return await self._request(
            "POST",
            "/chatglm/video-api/v1/chat",
            data=data
        )

    async def generate_video_image2video(
        self,
        prompt: str,
        image_url: str,
        duration: int = 5,
        **kwargs
    ) -> Dict[str, Any]:
        """
        图生视频

        Args:
            prompt: 视频描述文字
            image_url: 参考图片URL
            duration: 视频时长（秒）
            **kwargs: 其他参数

        Returns:
            任务信息
        """
        data = {
            "prompt": prompt,
            "image_url": image_url,
            "duration": duration,
            **kwargs
        }

        # TODO: 需要找到正确的API endpoint
        return await self._request(
            "POST",
            "/chatglm/video-api/v1/generate/image2video",
            data=data
        )

    async def get_video_status(self, chat_id: str) -> Dict[str, Any]:
        """
        查询视频生成状态（根据真实API实现）

        Args:
            chat_id: 聊天ID（从generate_video返回的chat_id）

        Returns:
            状态信息，包含：
            - status: 状态（init/processing/finished/failed）
            - video_url: 视频URL（完成时）
            - msg: 状态消息
            - plan: 进度信息
        """
        return await self._request(
            "GET",
            f"/chatglm/video-api/v1/chat/status/{chat_id}"
        )

    async def download_video(
        self,
        video_url: str,
        save_path: str = None,
        filename: str = None
    ) -> str:
        """
        下载视频

        Args:
            video_url: 视频URL
            save_path: 保存目录（默认当前目录）
            filename: 文件名（默认从URL提取）

        Returns:
            保存的文件路径
        """
        if not self.session:
            self.session = aiohttp.ClientSession()

        # 确定保存路径
        if save_path is None:
            save_path = os.getcwd()

        # 确定文件名
        if filename is None:
            # 从URL提取文件名
            filename = video_url.split('/')[-1]
            if '?' in filename:
                filename = filename.split('?')[0]
            # 确保有.mp4扩展名
            if not filename.endswith('.mp4'):
                filename += '.mp4'

        # 完整路径
        full_path = os.path.join(save_path, filename)

        # 下载视频
        try:
            async with self.session.get(video_url) as resp:
                if resp.status == 200:
                    # 获取文件大小
                    total_size = int(resp.headers.get('content-length', 0))
                    downloaded = 0

                    with open(full_path, 'wb') as f:
                        async for chunk in resp.content.iter_chunked(8192):
                            f.write(chunk)
                            downloaded += len(chunk)

                            # 显示下载进度
                            if total_size > 0:
                                progress = (downloaded / total_size) * 100
                                print(f"\r📥 下载进度: {progress:.1f}% ({downloaded}/{total_size} bytes)", end='', flush=True)

                    print()  # 换行
                    return full_path
                else:
                    raise Exception(f"下载失败: HTTP {resp.status}")

        except Exception as e:
            raise Exception(f"下载视频失败: {e}")

    async def close(self):
        """关闭会话"""
        if self.session:
            await self.session.close()
            self.session = None


# 便捷函数
async def get_quota_info(auth_token: str = None) -> Dict[str, Any]:
    """
    获取配额信息（便捷函数）

    Args:
        auth_token: 授权token

    Returns:
        配额信息
    """
    async with ZhipuVideoService(auth_token) as service:
        return await service.get_trial_info()


if __name__ == "__main__":
    # 测试代码
    async def test():
        print("=" * 60)
        print("智谱AI视频服务测试")
        print("=" * 60)

        async with ZhipuVideoService() as service:
            # 测试1: 获取配额信息
            print("\n[测试1] 获取配额信息...")
            try:
                quota = await service.get_trial_info()
                print(f"✅ 配额信息:")
                print(f"   已使用: {quota.get('video_times', 0)}")
                print(f"   总配额: {quota.get('video_total', 0)}")
                print(f"   剩余: {quota.get('video_total', 0) - quota.get('video_times', 0)}")
            except Exception as e:
                print(f"❌ 失败: {e}")

            # 测试2: 获取视频列表
            print("\n[测试2] 获取视频列表...")
            try:
                videos = await service.get_video_list(page=1, page_size=5)
                video_list = videos.get('data', [])
                print(f"✅ 找到 {len(video_list)} 个视频")
                for i, video in enumerate(video_list[:3], 1):
                    print(f"   {i}. {video.get('prompt', 'N/A')[:50]}...")
            except Exception as e:
                print(f"❌ 失败: {e}")

        print("\n" + "=" * 60)
        print("测试完成")
        print("=" * 60)

    asyncio.run(test())
