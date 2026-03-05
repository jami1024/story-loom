"""
统一图片生成客户端 — 通过 client_type 路由到不同适配器
支持 4 种调用方式：
  - openai_image:  AsyncOpenAI.images.generate()
  - openai_chat:   AsyncOpenAI.chat.completions.create() → markdown 中提取 base64
  - gemini_sdk:    google-genai 原生异步 SDK
  - gemini_native: httpx 直接 POST 图片 REST API
"""
import base64
import logging
import re
import uuid
from pathlib import Path

import httpx
from openai import AsyncOpenAI

from app.core.exceptions import AppException

logger = logging.getLogger(__name__)

# 静态图片存储目录
STATIC_IMAGES_DIR = Path("static/images")

# size → 宽高比映射（gemini_sdk 用原生 aspect_ratio，其余路径 append 到 prompt）
_SIZE_TO_ASPECT_RATIO = {
    "1024x1024": "1:1",
    "1024x576": "16:9",
    "576x1024": "9:16",
    "1024x768": "4:3",
    "768x1024": "3:4",
    "1536x1024": "3:2",
    "1024x1536": "2:3",
}

# size → prompt 追加的宽高比描述（openai_chat / gemini_native 用）
_SIZE_TO_ASPECT_SUFFIX = {
    "1024x1024": "",
    "1024x576": ", wide landscape 16:9 aspect ratio",
    "576x1024": ", tall portrait 9:16 aspect ratio",
    "1024x768": ", landscape 4:3 aspect ratio",
    "768x1024": ", portrait 3:4 aspect ratio",
    "1536x1024": ", wide landscape 3:2 aspect ratio",
    "1024x1536": ", tall portrait 2:3 aspect ratio",
}

# 从 openai_chat 响应中提取 base64 图片的正则
_BASE64_IMAGE_RE = re.compile(
    r"data:image/(?P<fmt>[a-zA-Z]+);base64,(?P<data>[A-Za-z0-9+/\n=]+)"
)


class ImageClient:
    """统一图片生成客户端 — 通过 client_type 分发到不同适配器"""

    def __init__(self, providers: list[dict] | None = None):
        self._configs: dict[str, dict] = {}
        self._openai_clients: dict[str, AsyncOpenAI] = {}
        self._genai_clients: dict[str, object] = {}  # genai.Client
        self._httpx_client: httpx.AsyncClient | None = None
        if providers:
            self._load_providers(providers)

    # ── 初始化 / 热更新 ──────────────────────────

    def _load_providers(self, providers: list[dict]):
        for p in providers:
            name = p["name"]
            client_type = p.get("client_type", "openai_image")
            base_url = self._normalize_base_url(p["base_url"], client_type)
            self._configs[name] = {
                "base_url": base_url,
                "api_key": p["api_key"],
                "default_model": p["default_model"],
                "client_type": client_type,
            }

            if client_type in ("openai_image", "openai_chat"):
                self._openai_clients[name] = AsyncOpenAI(
                    api_key=p["api_key"],
                    base_url=base_url,
                )
            elif client_type == "gemini_sdk":
                self._init_genai_client(name, p["api_key"], base_url)
            # gemini_native 用 httpx，懒初始化即可

            logger.info(f"图片客户端已初始化: {name} (type={client_type}, model={p['default_model']}, base_url={base_url})")

    @staticmethod
    def _normalize_base_url(url: str, client_type: str) -> str:
        """为 OpenAI 兼容客户端补全 /v1 路径（中转站常见遗漏）"""
        if client_type not in ("openai_image", "openai_chat"):
            return url
        from urllib.parse import urlparse
        parsed = urlparse(url.rstrip("/"))
        # 如果路径为空或仅 '/'，补 /v1
        if not parsed.path or parsed.path == "/":
            fixed = url.rstrip("/") + "/v1"
            logger.warning(f"base_url '{url}' 缺少路径前缀，已自动补全为 '{fixed}'")
            return fixed
        return url

    def _init_genai_client(self, name: str, api_key: str, base_url: str | None = None):
        """初始化 google-genai SDK 客户端（支持中转站 base_url）"""
        try:
            from google import genai
            from google.genai import types as genai_types

            kwargs: dict = {"api_key": api_key}
            if base_url:
                kwargs["http_options"] = genai_types.HttpOptions(
                    api_version="v1beta",
                    base_url=base_url.rstrip("/"),
                )
                logger.info(f"genai 客户端 '{name}' 使用中转站: {base_url}")

            self._genai_clients[name] = genai.Client(**kwargs)
        except ImportError:
            logger.warning("google-genai 未安装，gemini_sdk 不可用。pip install google-genai")
        except Exception as e:
            logger.error(f"初始化 genai 客户端失败 ({name}): {e}")

    def _get_httpx_client(self) -> httpx.AsyncClient:
        if self._httpx_client is None or self._httpx_client.is_closed:
            self._httpx_client = httpx.AsyncClient(timeout=120.0)
        return self._httpx_client

    async def reload(self, providers: list[dict]):
        """热更新：关闭旧客户端，加载新配置"""
        await self.close()
        self._load_providers(providers)
        logger.info(f"图片客户端热更新完成，已加载 {len(providers)} 个 provider")

    @property
    def available_providers(self) -> list[str]:
        """返回已配置的 provider 名称列表"""
        return list(self._configs.keys())

    def get_default_provider(self) -> str | None:
        """返回第一个可用的 provider 名称，无可用则返回 None"""
        keys = list(self._configs.keys())
        return keys[0] if keys else None

    # ── 统一入口 ──────────────────────────────────

    async def generate_image(
        self,
        prompt: str,
        provider: str = "zhipu-image",
        model: str | None = None,
        size: str = "1024x1024",
    ) -> str:
        """生成图片，返回图片 URL"""
        cfg = self._configs.get(provider)
        if not cfg:
            available = list(self._configs.keys())
            raise AppException(
                f"图片生成提供商 '{provider}' 未配置或 API Key 缺失。可用: {available}",
                status_code=400,
            )

        use_model = model or cfg["default_model"]
        client_type = cfg["client_type"]

        logger.info(f"图片生成请求: provider={provider}, type={client_type}, model={use_model}, size={size}")

        _dispatchers = {
            "openai_image": self._generate_openai_image,
            "openai_chat": self._generate_openai_chat,
            "gemini_sdk": self._generate_gemini_sdk,
            "gemini_native": self._generate_gemini_native,
        }
        handler = _dispatchers.get(client_type)
        if not handler:
            raise AppException(f"未知的 client_type: {client_type}", status_code=400)
        return await handler(provider, use_model, prompt, size)

    # ── 适配器 1: 图像 API (images.generate) ────────

    async def _generate_openai_image(
        self, provider: str, model: str, prompt: str, size: str
    ) -> str:
        """通过 images.generate() 生成，直接返回 URL"""
        client = self._openai_clients[provider]
        response = await client.images.generate(
            model=model,
            prompt=prompt,
            size=size,
            n=1,
        )

        # 兼容中转站返回的非标准格式
        image_url = self._extract_openai_image_url(response)
        if not image_url:
            resp_str = str(response)[:300]
            if isinstance(response, str) and resp_str.lstrip().lower().startswith(("<!doctype", "<html")):
                logger.error(f"[openai_image] 端点返回 HTML 而非 JSON，请检查 base_url 是否包含 /v1，或将 client_type 改为 openai_chat")
                raise AppException(
                    "图片 API 端点返回了 HTML 页面而非 JSON。请在设置中检查该通道的 base_url（通常需要以 /v1 结尾）或将 client_type 改为 openai_chat。",
                    status_code=502,
                )
            logger.error(f"[openai_image] 无法解析响应: type={type(response).__name__}, value={resp_str}")
            raise AppException("图片 API 返回了无法解析的格式", status_code=502)

        logger.info(f"[openai_image] 生成成功: {image_url[:80]}...")
        return image_url

    @staticmethod
    def _extract_openai_image_url(response) -> str | None:
        """从 images.generate() 的各种响应格式中提取图片 URL / base64"""
        # 标准格式: ImagesResponse 对象
        if hasattr(response, "data") and response.data:
            item = response.data[0]
            if hasattr(item, "url") and item.url:
                return item.url
            if hasattr(item, "b64_json") and item.b64_json:
                return ImageClient._save_base64_image(item.b64_json)
            # data[0] 可能本身就是 URL 字符串
            if isinstance(item, str) and item.startswith(("http://", "https://", "/")):
                return item

        # 中转站可能直接返回 URL 字符串
        if isinstance(response, str):
            if response.startswith(("http://", "https://", "/")):
                return response

        # 中转站可能返回 dict
        if isinstance(response, dict):
            data = response.get("data")
            if isinstance(data, list) and data:
                first = data[0]
                if isinstance(first, dict):
                    return first.get("url") or first.get("b64_json")
                if isinstance(first, str):
                    return first
            # 直接包含 url 字段
            if "url" in response:
                return response["url"]

        return None

    # ── 适配器 2: Chat 兼容 API ────────────────────

    async def _generate_openai_chat(
        self, provider: str, model: str, prompt: str, size: str
    ) -> str:
        """通过 chat.completions.create() 生成，从 markdown 中提取 base64 图片"""
        client = self._openai_clients[provider]

        # 追加宽高比描述到 prompt
        aspect_suffix = _SIZE_TO_ASPECT_SUFFIX.get(size, "")
        full_prompt = prompt + aspect_suffix if aspect_suffix else prompt

        response = await client.chat.completions.create(
            model=model,
            messages=[
                {"role": "user", "content": f"Generate an image: {full_prompt}"},
            ],
        )

        content = response.choices[0].message.content or ""
        logger.debug(f"[openai_chat] 响应长度: {len(content)} chars")

        # 从 markdown 中提取 base64 图片
        match = _BASE64_IMAGE_RE.search(content)
        if not match:
            # 可能直接返回了 URL
            url_match = re.search(r"https?://\S+\.(?:png|jpg|jpeg|webp)", content)
            if url_match:
                logger.info(f"[openai_chat] 提取到 URL: {url_match.group()[:80]}...")
                return url_match.group()
            raise AppException(
                "openai_chat 响应中未找到图片数据",
                status_code=502,
            )

        fmt = match.group("fmt")
        b64_data = match.group("data").replace("\n", "")
        image_path = self._save_base64_image(b64_data, fmt=fmt)
        logger.info(f"[openai_chat] 生成成功，已保存: {image_path}")
        return image_path

    # ── 适配器 3: SDK 通道 ─────────────────────────

    async def _generate_gemini_sdk(
        self, provider: str, model: str, prompt: str, size: str
    ) -> str:
        """通过 google-genai SDK 异步生成图片"""
        genai_client = self._genai_clients.get(provider)
        if not genai_client:
            raise AppException(
                f"图片 SDK 客户端 '{provider}' 未初始化（google-genai 未安装？）",
                status_code=503,
            )

        from google.genai import types

        aspect_ratio = _SIZE_TO_ASPECT_RATIO.get(size, "1:1")

        response = await genai_client.aio.models.generate_content(
            model=model,
            contents=prompt,
            config=types.GenerateContentConfig(
                response_modalities=["IMAGE"],
                image_config=types.ImageConfig(aspect_ratio=aspect_ratio),
            ),
        )

        # 从 response.candidates[].content.parts[] 中提取图片
        for part in response.candidates[0].content.parts:
            if part.inline_data and part.inline_data.data:
                # inline_data.data 是 bytes
                b64_data = base64.b64encode(part.inline_data.data).decode()
                mime = part.inline_data.mime_type or "image/png"
                fmt = mime.split("/")[-1] if "/" in mime else "png"
                image_path = self._save_base64_image(b64_data, fmt=fmt)
                logger.info(f"[gemini_sdk] 生成成功，已保存: {image_path}")
                return image_path

        raise AppException("图片 SDK 返回中未找到图片数据", status_code=502)

    # ── 适配器 4: Native REST 通道 ─────────────────

    async def _generate_gemini_native(
        self, provider: str, model: str, prompt: str, size: str
    ) -> str:
        """通过 httpx 直接 POST 图片 REST API"""
        cfg = self._configs[provider]
        base_url = cfg["base_url"].rstrip("/")
        api_key = cfg["api_key"]

        aspect_suffix = _SIZE_TO_ASPECT_SUFFIX.get(size, "")
        full_prompt = prompt + aspect_suffix if aspect_suffix else prompt

        url = f"{base_url}/v1beta/models/{model}:generateContent"
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}",
        }
        payload = {
            "contents": [{"parts": [{"text": full_prompt}]}],
            "generationConfig": {"responseModalities": ["TEXT", "IMAGE"]},
        }

        client = self._get_httpx_client()
        response = await client.post(url, json=payload, headers=headers)

        if response.status_code != 200:
            logger.error(f"图片 API 错误: {response.status_code} {response.text[:500]}")
            raise AppException(
                f"图片生成失败: HTTP {response.status_code}",
                status_code=502,
            )

        data = response.json()
        b64_data = self._extract_gemini_native_image(data)
        if not b64_data:
            raise AppException("图片通道返回中未找到图片数据", status_code=502)

        image_path = self._save_base64_image(b64_data)
        logger.info(f"[gemini_native] 生成成功，已保存: {image_path}")
        return image_path

    @staticmethod
    def _extract_gemini_native_image(data: dict) -> str | None:
        """从图片 REST API 响应中提取 base64 图片数据"""
        try:
            for candidate in data.get("candidates", []):
                for part in candidate.get("content", {}).get("parts", []):
                    inline_data = part.get("inlineData")
                    if inline_data and inline_data.get("data"):
                        return inline_data["data"]
        except (KeyError, IndexError, TypeError) as e:
            logger.error(f"解析图片响应失败: {e}")
        return None

    # ── 公共工具方法 ──────────────────────────────

    @staticmethod
    def _save_base64_image(b64_data: str, fmt: str = "png") -> str:
        """将 base64 图片数据保存为本地文件，返回 URL 路径"""
        STATIC_IMAGES_DIR.mkdir(parents=True, exist_ok=True)
        # 规范化格式
        fmt = fmt.lower().replace("jpeg", "jpg")
        if fmt not in ("png", "jpg", "webp", "gif"):
            fmt = "png"
        filename = f"{uuid.uuid4().hex}.{fmt}"
        filepath = STATIC_IMAGES_DIR / filename
        filepath.write_bytes(base64.b64decode(b64_data))
        logger.info(f"图片已保存: {filepath} ({filepath.stat().st_size} bytes)")
        return f"/static/images/{filename}"

    async def close(self):
        """关闭所有客户端连接"""
        for name, client in self._openai_clients.items():
            await client.close()
            logger.debug(f"图像客户端 '{name}' 已关闭")
        self._openai_clients.clear()
        self._configs.clear()
        self._genai_clients.clear()
        if self._httpx_client and not self._httpx_client.is_closed:
            await self._httpx_client.aclose()
            self._httpx_client = None


# ========== 单例管理 ==========

_image_client: ImageClient | None = None


async def init_image_client(providers: list[dict] | None = None) -> None:
    """在应用启动时初始化 ImageClient 单例"""
    global _image_client
    try:
        _image_client = ImageClient(providers)
        logger.info("ImageClient 单例初始化成功")
    except Exception as e:
        logger.warning(f"ImageClient 初始化跳过: {e}")


async def close_image_client() -> None:
    """在应用关闭时清理 ImageClient"""
    global _image_client
    if _image_client is not None:
        await _image_client.close()
        _image_client = None
        logger.info("ImageClient 单例已关闭")


def get_image_client() -> ImageClient:
    """依赖注入函数 — 获取 ImageClient 单例"""
    if _image_client is None:
        raise AppException("图片生成服务未初始化", status_code=503)
    return _image_client
