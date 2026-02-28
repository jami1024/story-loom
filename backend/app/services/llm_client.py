"""
统一 LLM 客户端 — 从数据库加载 provider 配置
"""
import json
import logging
import re

from openai import AsyncOpenAI

from app.core.exceptions import AppException

logger = logging.getLogger(__name__)


class LLMClient:
    """统一 LLM 客户端"""

    def __init__(self, providers: list[dict] | None = None):
        """
        providers = [{"name": "deepseek", "base_url": "...", "api_key": "...", "default_model": "..."}]
        """
        self._clients: dict[str, AsyncOpenAI] = {}
        self._models: dict[str, str] = {}
        if providers:
            self._load_providers(providers)

    def _load_providers(self, providers: list[dict]):
        """从 provider 配置列表初始化客户端"""
        for p in providers:
            self._clients[p["name"]] = AsyncOpenAI(
                api_key=p["api_key"],
                base_url=p["base_url"],
            )
            self._models[p["name"]] = p["default_model"]
            logger.info(f"LLM 客户端已初始化: {p['name']} ({p['default_model']})")

    async def reload(self, providers: list[dict]):
        """热更新：关闭旧客户端，加载新配置"""
        await self.close()
        self._load_providers(providers)
        logger.info(f"LLM 客户端热更新完成，已加载 {len(providers)} 个 provider")

    def _get_client(self, provider: str) -> AsyncOpenAI:
        """获取指定提供商的客户端"""
        client = self._clients.get(provider)
        if not client:
            available = list(self._clients.keys())
            raise AppException(
                f"LLM 提供商 '{provider}' 未配置或 API Key 缺失。"
                f"可用提供商: {available}",
                status_code=400,
            )
        return client

    async def chat(
        self,
        system_prompt: str,
        user_prompt: str,
        provider: str = "deepseek",
        model: str | None = None,
        temperature: float = 0.7,
        max_tokens: int = 4096,
    ) -> str:
        """发送消息并返回文本响应"""
        client = self._get_client(provider)
        use_model = model or self._models.get(provider, "deepseek-chat")

        response = await client.chat.completions.create(
            model=use_model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=temperature,
            max_tokens=max_tokens,
        )

        return response.choices[0].message.content.strip()

    async def chat_json(
        self,
        system_prompt: str,
        user_prompt: str,
        provider: str = "deepseek",
        model: str | None = None,
        temperature: float = 0.3,
        max_tokens: int = 8192,
        retries: int = 2,
    ) -> dict:
        """发送消息并解析 JSON 响应，带重试"""
        last_error = None

        for attempt in range(retries + 1):
            try:
                text = await self.chat(
                    system_prompt=system_prompt,
                    user_prompt=user_prompt,
                    provider=provider,
                    model=model,
                    temperature=temperature,
                    max_tokens=max_tokens,
                )

                # 处理 markdown code block 包裹的 JSON
                cleaned = self._extract_json(text)
                result = json.loads(cleaned)
                return result

            except json.JSONDecodeError as e:
                last_error = e
                logger.warning(
                    f"JSON 解析失败 (尝试 {attempt + 1}/{retries + 1}): {e}"
                )
                if attempt < retries:
                    temperature = min(temperature + 0.1, 0.5)

        raise AppException(f"LLM 返回无法解析的 JSON: {last_error}", status_code=502)

    @staticmethod
    def _extract_json(text: str) -> str:
        """从可能包含 markdown code block 的文本中提取 JSON"""
        # 匹配 ```json ... ``` 或 ``` ... ```
        match = re.search(r"```(?:json)?\s*\n?(.*?)\n?\s*```", text, re.DOTALL)
        if match:
            return match.group(1).strip()
        return text.strip()

    async def close(self):
        """关闭所有客户端连接"""
        for name, client in self._clients.items():
            await client.close()
            logger.info(f"LLM 客户端 '{name}' 已关闭")
        self._clients.clear()
        self._models.clear()


# ========== 单例管理 ==========

_llm_client: LLMClient | None = None


async def init_llm_client(providers: list[dict] | None = None) -> None:
    """在应用启动时初始化 LLMClient 单例"""
    global _llm_client
    try:
        _llm_client = LLMClient(providers)
        logger.info("LLMClient 单例初始化成功")
    except Exception as e:
        logger.warning(f"LLMClient 初始化跳过: {e}")


async def close_llm_client() -> None:
    """在应用关闭时清理 LLMClient"""
    global _llm_client
    if _llm_client is not None:
        await _llm_client.close()
        _llm_client = None
        logger.info("LLMClient 单例已关闭")


def get_llm_client() -> LLMClient:
    """依赖注入函数 — 获取 LLMClient 单例"""
    if _llm_client is None:
        raise AppException("LLM 服务未初始化", status_code=503)
    return _llm_client
