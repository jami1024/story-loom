# Prompt 生成接口文档

## 概述

使用 DeepSeek API 根据用户输入的简单想法,生成专业的 AI 视频描述 Prompt。

## API 端点

### 1. 生成 Prompt

**URL:** `POST /api/prompt/generate`

**请求体:**
```json
{
  "user_input": "用户输入的想法或概念 (1-500字符)",
  "temperature": 0.7  // 可选,0-1之间,越高越有创意,默认0.7
}
```

**响应:**
```json
{
  "prompt": "生成的专业视频描述 Prompt",
  "original_input": "用户原始输入",
  "model": "deepseek-chat",
  "usage": {
    "prompt_tokens": 2618,
    "completion_tokens": 123,
    "total_tokens": 2741
  }
}
```

**示例请求:**
```bash
curl -X POST http://localhost:8000/api/prompt/generate \
  -H "Content-Type: application/json" \
  -d '{
    "user_input": "一个特工在未来城市里跑酷逃脱",
    "temperature": 0.7
  }'
```

**示例响应 (生成的 Prompt):**
```
稳定器跟拍+低角度拍摄，中雨中的赛博朋克城市夜晚，身穿装甲的跑酷特工，急速翻越倒塌车辆并爆发火花，背景充满霓虹标识与蒸汽管道，体积光穿透雨幕形成光柱，赛博朋克粗糙风格，intense motion
```

**字数统计:** 总字符 98 字，去除标点空格后 90 字 ✅
```

---

### 2. 健康检查

**URL:** `GET /api/prompt/health`

**响应:**
```json
{
  "status": "healthy",
  "service": "Prompt Generation Service",
  "configured": true,
  "base_url": "https://api.deepseek.com"
}
```

---

## 配置要求

在 `.env` 文件中添加以下配置:

```env
DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxx
DEEPSEEK_BASE_URL=https://api.deepseek.com
```

---

## 生成 Prompt 的特点

根据 `final_prompt_guide.md` 的指导,生成的 Prompt 包含以下元素:

1. **镜头设置** (运动+景别+角度)
2. **场景/时间/环境**
3. **主体**
4. **动作/运动强度**
5. **环境细节/交互元素**
6. **光影/氛围**
7. **艺术/材质风格**

**优化特性:**
- ✅ **严格字数控制**: 生成内容控制在 95 字以内（不含标点和空格）
- ✅ **纯净输出**: 只输出主描述，不包含技术参数和负向提示词
- ✅ **运动强度标注**: 每个 Prompt 结尾都会标注运动强度 (gentle motion/moderate motion/intense motion)
- ✅ **专业术语**: 使用专业的摄影和电影术语，如"稳定器跟拍"、"体积光"、"侧逆光"等

---

## 使用示例

### 示例 1: 动作场景
```bash
curl -X POST http://localhost:8000/api/prompt/generate \
  -H "Content-Type: application/json" \
  -d '{"user_input": "一个特工在未来城市里跑酷逃脱"}'
```

**生成结果:**
```
稳定器跟拍+低角度拍摄，中雨中的赛博朋克城市夜晚，身穿装甲的跑酷特工，急速翻越倒塌车辆并爆发火花，背景充满霓虹标识与蒸汽管道，体积光穿透雨幕形成光柱，赛博朋克粗糙风格，intense motion
```
**字数:** 90 字 ✅

---

### 示例 2: 自然风光
```bash
curl -X POST http://localhost:8000/api/prompt/generate \
  -H "Content-Type: application/json" \
  -d '{"user_input": "高山湖泊的清晨,一只牦牛在湖边吃草"}'
```

**生成结果:**
```
无人机平滑俯冲+广角镜头，晨雾环绕的高山湖泊黎明时分，一只牦牛在湖岸慢步啃草，湖面倒映粉紫朝霞与雪山倒影，黄金时刻柔光穿透薄雾，摄影级写实风格，gentle motion
```
**字数:** 78 字 ✅

---

### 示例 3: 人物特写
```bash
curl -X POST http://localhost:8000/api/prompt/generate \
  -H "Content-Type: application/json" \
  -d '{"user_input": "一个复古爵士歌手在酒吧深情演唱"}'
```

**生成结果:**
```
轨道推进特写+中景切换，昏暗爵士酒吧深夜，复古妆容女歌手轻闭双眼深情演唱，手握老式麦克风，背景虚化的暖色灯串与雪茄烟雾，侧逆光勾勒面部轮廓，黑色电影油画质感，gentle motion
```
**字数:** 84 字 ✅

---

## API 文档

启动服务后,访问以下地址查看自动生成的 API 文档:

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

---

## Token 使用统计

每次调用 DeepSeek API 会返回 Token 使用统计:

- **prompt_tokens**: 系统提示词 + 用户输入消耗的 Token (约 3100-3200)
- **completion_tokens**: 生成内容消耗的 Token (约 50-60，已优化)
- **total_tokens**: 总消耗 Token (约 3150-3260)

---

## 错误处理

- **500 错误**: 服务配置错误 (如未设置 DEEPSEEK_API_KEY)
- **500 错误**: DeepSeek API 调用失败 (网络问题或 API 异常)

---

## 集成到前端

前端可以通过以下方式调用接口:

```javascript
const response = await fetch('http://localhost:8000/api/prompt/generate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    user_input: '用户输入的想法',
    temperature: 0.7
  })
});

const data = await response.json();
console.log('生成的 Prompt:', data.prompt);
```
