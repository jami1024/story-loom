-- 为 ai_providers 表添加 client_type 列
-- 用于区分不同的 API 调用方式: openai_image / openai_chat / gemini_sdk / gemini_native
ALTER TABLE ai_providers ADD COLUMN client_type VARCHAR(30) NOT NULL DEFAULT 'openai_image'
    COMMENT '客户端类型: openai_image / openai_chat / gemini_sdk / gemini_native';

-- 更新已有的 gemini provider 为 gemini_native
UPDATE ai_providers SET client_type = 'gemini_native' WHERE name = 'gemini';
