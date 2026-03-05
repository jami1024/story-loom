-- 创建故事解析任务表
CREATE TABLE IF NOT EXISTS story_parse_tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' COMMENT '状态: pending/processing/completed/failed',
    progress FLOAT NOT NULL DEFAULT 0 COMMENT '进度 0.0 ~ 1.0',
    message VARCHAR(500) DEFAULT NULL COMMENT '当前阶段消息',
    error_detail TEXT DEFAULT NULL COMMENT '失败时的详细错误信息',
    result_metadata JSON DEFAULT NULL COMMENT '完成后的统计元数据',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    started_at DATETIME DEFAULT NULL,
    completed_at DATETIME DEFAULT NULL,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_parse_task_project FOREIGN KEY (project_id) REFERENCES story_projects(id) ON DELETE CASCADE,
    INDEX idx_parse_task_project (project_id),
    INDEX idx_parse_task_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
