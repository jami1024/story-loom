-- 001_scene_image_fields.sql
-- 为 story_scenes 表添加场景一致性相关的新列
-- 这些列在 ORM 模型中已定义，但 create_all() 不会为已有表添加新列

ALTER TABLE story_scenes ADD COLUMN architecture_style VARCHAR(200) NULL COMMENT '建筑/环境风格';
ALTER TABLE story_scenes ADD COLUMN lighting_design VARCHAR(200) NULL COMMENT '光影设计';
ALTER TABLE story_scenes ADD COLUMN color_palette VARCHAR(200) NULL COMMENT '色彩基调';
ALTER TABLE story_scenes ADD COLUMN key_props JSON NULL COMMENT '关键道具';
ALTER TABLE story_scenes ADD COLUMN spatial_layout TEXT NULL COMMENT '空间布局描述';
ALTER TABLE story_scenes ADD COLUMN visual_prompt_zh TEXT NULL COMMENT '中文场景Prompt';
ALTER TABLE story_scenes ADD COLUMN visual_prompt_en TEXT NULL COMMENT '英文场景Prompt';
ALTER TABLE story_scenes ADD COLUMN image_url VARCHAR(512) NULL COMMENT '场景参考图片URL';
ALTER TABLE story_scenes ADD COLUMN image_prompt TEXT NULL COMMENT '生成图片时使用的Prompt';
ALTER TABLE story_scenes ADD COLUMN image_status VARCHAR(20) DEFAULT 'none' COMMENT '图片状态: none/generating/completed/failed';
