-- 为 ai_providers 表添加 relay_type 列
-- 用于标识中转站类型: aiberm, one-api, new-api 等，空值表示直连官方 API
ALTER TABLE ai_providers ADD COLUMN relay_type VARCHAR(50) DEFAULT NULL
    COMMENT '中转站类型: aiberm, one-api, new-api 等，空值表示直连';
