"""
Prompt 生成服务 - 使用 DeepSeek API 优化视频描述
"""
import os
import logging
from openai import AsyncOpenAI

from app.core.config import get_settings
from app.core.exceptions import AppException

logger = logging.getLogger(__name__)


class PromptService:
    """Prompt 优化服务"""

    def __init__(self, api_key: str | None = None, base_url: str | None = None):
        """
        初始化 DeepSeek 客户端

        Args:
            api_key: DeepSeek API Key (默认从 settings 读取)
            base_url: DeepSeek API 基础 URL (默认从 settings 读取)
        """
        settings = get_settings()
        self.api_key = api_key or settings.DEEPSEEK_API_KEY
        self.base_url = base_url or "https://api.deepseek.com"

        if not self.api_key:
            raise ValueError("未配置 DEEPSEEK_API_KEY 环境变量")

        self.client = AsyncOpenAI(
            api_key=self.api_key,
            base_url=self.base_url
        )

        # 加载系统提示词 (从 final_prompt_guide.md 读取)
        self.system_prompt = self._load_prompt_guide()

    def _load_prompt_guide(self) -> str:
        """
        从 final_prompt_guide.md 文件加载提示词指南

        Returns:
            系统提示词内容
        """
        try:
            guide_path = os.path.join(
                os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
                "docs",
                "final_prompt_guide.md"
            )

            if os.path.exists(guide_path):
                with open(guide_path, "r", encoding="utf-8") as f:
                    content = f.read()

                    # 在原有内容基础上添加严格的字数限制说明
                    enhanced_content = content + """

---

# ⚠️ 重要约束（必须严格遵守）

**绝对规则:**

1. **字数限制**: 主描述部分必须严格控制在 95 字以内（不含标点符号和空格，只计算中文字符和英文单词）
2. **禁止输出**: 绝对不要输出技术参数（如 4K、8K、UHD、HDR、帧率、fps、长宽比、aspect ratio 等）
3. **禁止输出**: 绝对不要输出负向提示词（如 flicker、ghosting、blur 等）
4. **禁止输出**: 绝对不要输出 "**技术参数:**"、"**负向提示词:**" 等标题文字
5. **格式要求**: 只输出主描述内容，格式严格遵循：[镜头设置], [场景/环境], [主体], [动作/运动强度], [环境细节], [光影/氛围], [艺术风格]
6. **运动强度**: 必须在结尾标注运动强度（gentle motion、moderate motion 或 intense motion）

**正确示例（92字，符合要求）:**
稳定器跟拍+低角度拍摄，中雨中的赛博朋克城市夜晚，身穿黑色装甲的跑酷特工，急速翻越倒塌车辆并爆发火花，背景充满霓虹标识与蒸汽管道，体积光穿透雨幕形成光柱，赛博朋克粗糙风格，intense motion

**错误示例 1（包含了技术参数，违规）:**
稳定器跟拍，赛博朋克城市，跑酷特工急速翻越车辆，霓虹灯光

**技术参数:** 4K UHD, 48fps ❌ 绝对不要输出这行

**错误示例 2（超过字数限制，违规）:**
稳定器环绕+特写切换+推轨拉近，昏暗复古爵士酒吧深夜时分氛围浓厚，一位身穿黑色晚礼服的复古妆容爵士女歌手... (超过95字)

**输出时请严格检查:**
- ✅ 只输出主描述，一段话
- ✅ 字数在 95 字以内
- ✅ 包含运动强度标注
- ❌ 没有技术参数
- ❌ 没有负向提示词
- ❌ 没有额外标题
"""

                    logger.info(f"✅ 【完整版】成功加载 Prompt 指南 - 文件: {guide_path}")
                    logger.info(f"📊 提示词统计 - 原始内容: {len(content)} 字符, 增强后: {len(enhanced_content)} 字符")
                    return enhanced_content
            else:
                logger.warning(f"⚠️  Prompt 指南文件不存在: {guide_path}")
                logger.warning(f"🔄 降级使用默认提示词（功能受限，建议检查文件配置）")
                return self._get_default_prompt_guide()

        except Exception as e:
            logger.error(f"❌ 加载 Prompt 指南失败: {e}")
            logger.warning(f"🔄 降级使用默认提示词（功能受限，建议检查文件配置）")
            return self._get_default_prompt_guide()

    def _get_default_prompt_guide(self) -> str:
        """
        获取默认的 Prompt 指南 (简化版)

        Returns:
            默认系统提示词
        """
        logger.info("📝 【默认版】使用内置简化提示词（约200字符）")
        logger.warning("⚠️  建议配置 final_prompt_guide.md 以获得更好的生成效果")

        return """你是一位国际知名的电影摄像师和AI视频生成专家。

你的任务是将用户输入的想法转化为专业、简洁且富有画面感的视频描述 (Prompt)。

输出格式:
[镜头设置(运动+景别+角度)], [场景/时间/环境], [主体], [动作/运动强度], [环境细节/交互元素], [光影/氛围], [艺术/材质风格]

要求:
1. 简洁精准: 主描述严格控制在 95 字以内 (不含标点符号和空格)
2. 善用魔法词: 使用专业的摄影术语和艺术风格词汇
3. 从简到繁: 先构思核心的"主体"+"动作"，然后丰富细节
4. 注重运动感: 必须在结尾标注运动强度 (gentle motion/moderate motion/intense motion)
5. 禁止输出: 不要包含技术参数、负向提示词或任何额外标题

请直接输出优化后的 Prompt，只输出一段主描述文字。"""

    async def generate_prompt(
        self,
        user_input: str,
        model: str = "deepseek-chat",
        temperature: float = 0.7,
        max_tokens: int = 500
    ) -> dict:
        """
        使用 DeepSeek 生成视频描述 Prompt

        Args:
            user_input: 用户输入的想法或概念
            model: 使用的模型 (默认 deepseek-chat)
            temperature: 温度参数 (0-1, 越高越有创意)
            max_tokens: 最大 token 数

        Returns:
            {
                "prompt": "生成的视频描述",
                "original_input": "用户原始输入",
                "model": "使用的模型",
                "usage": {...}  # token 使用统计
            }
        """
        try:
            logger.info(f"🤖 开始生成 Prompt - 用户输入: {user_input[:50]}...")

            # 在用户输入中明确强调字数限制
            enhanced_user_input = f"{user_input}\n\n注意：生成的视频描述必须严格控制在95字以内（不含标点和空格），只输出主描述，不要包含技术参数和负向提示词。"

            response = await self.client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": self.system_prompt},
                    {"role": "user", "content": enhanced_user_input}
                ],
                temperature=temperature,
                max_tokens=max_tokens
            )

            generated_prompt = response.choices[0].message.content.strip()
            usage = {
                "prompt_tokens": response.usage.prompt_tokens,
                "completion_tokens": response.usage.completion_tokens,
                "total_tokens": response.usage.total_tokens
            }

            logger.info(f"✅ Prompt 生成成功 - 输出长度: {len(generated_prompt)} 字符")
            logger.debug(f"Token 使用: {usage}")

            return {
                "prompt": generated_prompt,
                "original_input": user_input,
                "model": model,
                "usage": usage
            }

        except Exception as e:
            logger.error(f"❌ Prompt 生成失败: {str(e)}")
            raise Exception(f"DeepSeek API 调用失败: {str(e)}")

    async def close(self):
        """关闭客户端连接"""
        await self.client.close()

    async def __aenter__(self):
        """异步上下文管理器入口"""
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """异步上下文管理器出口"""
        await self.close()


# --------------- 单例管理 ---------------

_prompt_service: PromptService | None = None


async def init_prompt_service() -> None:
    """在应用启动时初始化 PromptService 单例"""
    global _prompt_service
    try:
        _prompt_service = PromptService()
        logger.info("PromptService 单例初始化成功")
    except ValueError as e:
        logger.warning(f"PromptService 初始化跳过 (配置缺失): {e}")


async def close_prompt_service() -> None:
    """在应用关闭时清理 PromptService"""
    global _prompt_service
    if _prompt_service is not None:
        await _prompt_service.close()
        _prompt_service = None
        logger.info("PromptService 单例已关闭")


def get_prompt_service() -> PromptService:
    """依赖注入函数 - 获取 PromptService 单例"""
    if _prompt_service is None:
        raise AppException("Prompt 服务未初始化", status_code=503)
    return _prompt_service
