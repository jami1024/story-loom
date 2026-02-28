# Prompt 服务日志说明

## 日志级别说明

### 1. 正常情况（使用完整版提示词）

```log
2025-11-16 09:34:26,505 - app.services.prompt_service - INFO - ✅ 【完整版】成功加载 Prompt 指南 - 文件: /Users/xxx/StoryLoom/final_prompt_guide.md
2025-11-16 09:34:26,505 - app.services.prompt_service - INFO - 📊 提示词统计 - 原始内容: 5566 字符, 增强后: 6200 字符
```

**说明:**
- ✅ 文件加载成功
- 使用完整的 5566 字 Prompt 指南 + 约束增强
- 生成效果最佳

---

### 2. 降级情况（文件不存在）

```log
2025-11-16 09:34:26,505 - app.services.prompt_service - WARNING - ⚠️  Prompt 指南文件不存在: /Users/xxx/StoryLoom/final_prompt_guide.md
2025-11-16 09:34:26,505 - app.services.prompt_service - WARNING - 🔄 降级使用默认提示词（功能受限，建议检查文件配置）
2025-11-16 09:34:26,505 - app.services.prompt_service - INFO - 📝 【默认版】使用内置简化提示词（约200字符）
2025-11-16 09:34:26,505 - app.services.prompt_service - WARNING - ⚠️  建议配置 final_prompt_guide.md 以获得更好的生成效果
```

**说明:**
- ⚠️ 文件未找到，自动降级
- 使用内置的简化版提示词（200字符）
- 功能可用但生成质量较低
- **需要检查配置**

---

### 3. 异常情况（读取失败）

```log
2025-11-16 09:34:26,505 - app.services.prompt_service - ERROR - ❌ 加载 Prompt 指南失败: [Errno 13] Permission denied: '/path/to/final_prompt_guide.md'
2025-11-16 09:34:26,505 - app.services.prompt_service - WARNING - 🔄 降级使用默认提示词（功能受限，建议检查文件配置）
2025-11-16 09:34:26,505 - app.services.prompt_service - INFO - 📝 【默认版】使用内置简化提示词（约200字符）
2025-11-16 09:34:26,505 - app.services.prompt_service - WARNING - ⚠️  建议配置 final_prompt_guide.md 以获得更好的生成效果
```

**说明:**
- ❌ 文件存在但读取失败（权限、编码等问题）
- 自动降级到默认提示词
- **需要检查文件权限或内容**

---

## 日志关键词对照表

| Emoji | 日志级别 | 含义 | 处理建议 |
|-------|---------|------|----------|
| ✅ | INFO | 【完整版】加载成功 | 正常，无需处理 |
| 📊 | INFO | 提示词统计信息 | 正常，查看字符数 |
| ⚠️ | WARNING | 文件不存在/建议配置 | 检查文件路径和配置 |
| 🔄 | WARNING | 降级使用默认版 | 功能受限，建议修复 |
| 📝 | INFO | 【默认版】使用简化版 | 降级模式，建议升级 |
| ❌ | ERROR | 加载失败（异常） | 检查文件权限/内容 |

---

## 如何查看日志

### 1. 启动服务时查看

```bash
cd backend
python3 -m uvicorn app.main:app --reload
```

输出示例（正常）:
```
2025-11-16 09:34:26 - app.services.prompt_service - INFO - ✅ 【完整版】成功加载 Prompt 指南
2025-11-16 09:34:26 - app.services.prompt_service - INFO - 📊 提示词统计 - 原始内容: 5566 字符, 增强后: 6200 字符
```

### 2. Docker 环境查看日志

```bash
# 查看服务日志
docker-compose logs -f backend

# 过滤 Prompt 服务相关日志
docker-compose logs backend | grep prompt_service
```

### 3. 健康检查接口

```bash
# 调用健康检查接口
curl http://localhost:8000/api/prompt/health

# 正常响应（使用完整版）
{
  "status": "healthy",
  "service": "Prompt Generation Service",
  "configured": true,
  "base_url": "https://api.deepseek.com"
}
```

---

## 排查指南

### 问题 1: 看到 "降级使用默认提示词"

**原因:** `final_prompt_guide.md` 文件未找到

**解决:**
```bash
# 检查文件是否存在
ls -la /path/to/StoryLoom/final_prompt_guide.md

# 如果不存在，从项目根目录运行
cd /path/to/StoryLoom
cat final_prompt_guide.md  # 确认文件存在

# 检查 Docker 挂载（如果使用 Docker）
docker-compose exec backend ls -la /app/final_prompt_guide.md
```

### 问题 2: 看到权限错误

**原因:** 文件权限不足

**解决:**
```bash
# 修改文件权限
chmod 644 final_prompt_guide.md

# Docker 环境下检查文件所有者
docker-compose exec backend ls -l /app/final_prompt_guide.md
```

### 问题 3: 日志中字符数异常

**正常范围:**
- 原始内容: 5400-5700 字符
- 增强后: 6100-6400 字符

**如果差异过大:**
```bash
# 检查文件内容是否完整
wc -c final_prompt_guide.md

# 检查文件编码
file -I final_prompt_guide.md  # 应该是 utf-8
```

---

## 监控建议

### 生产环境监控点

1. **启动时检查**
   - 监控日志中是否出现 "【完整版】" 标识
   - 如果出现 "【默认版】"，触发告警

2. **定期检查**
   ```bash
   # 每小时检查一次日志
   docker-compose logs backend --since 1h | grep "默认版"

   # 如果有输出，说明系统在降级模式运行
   ```

3. **健康检查脚本**
   ```bash
   #!/bin/bash
   response=$(curl -s http://localhost:8000/api/prompt/health)

   if echo "$response" | grep -q '"configured":true'; then
     echo "✅ Prompt 服务正常"
   else
     echo "❌ Prompt 服务配置异常"
     exit 1
   fi
   ```

---

## 版本对比

| 特性 | 完整版 | 默认版 |
|------|--------|--------|
| 日志标识 | ✅ 【完整版】 | 📝 【默认版】 |
| 提示词长度 | ~6200 字符 | ~200 字符 |
| 魔法词库 | 包含完整词库 | 仅核心规则 |
| 生成质量 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| 文件依赖 | 需要 final_prompt_guide.md | 无需文件 |
| 启动日志 | 2 条 INFO | 2 条 WARNING |
