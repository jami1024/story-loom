# 视频模型 SDK 关键信息总结

本文档总结了视频模型 SDK 的核心使用方法、认证机制、视频生成参数（特别是 4K 分辨率支持）以及异步操作处理方式，以指导后端集成。

---

## 1. API 使用与认证

*   **SDK 名称:** `zai-sdk` (Python SDK)
*   **客户端初始化:** 通过对应 SDK Client 进行初始化。
*   **认证方式:** 在初始化客户端时，通过传入 `api_key` 进行身份验证。

    ```python
    from provider_sdk import VideoClient

    client = VideoClient(api_key="YOUR_API_KEY") # 替换为您的实际 API Key
    ```

*   **视频生成入口:** 使用 `client.videos.generations` 方法发起视频生成请求。
*   **结果检索入口:** 使用 `client.videos.retrieve_videos_result` 方法根据任务 ID 获取最终视频结果。

---

## 2. 视频生成参数 (Generations API)

`client.videos.generations` 方法支持以下关键参数：

*   **`model` (字符串, 必填):** 指定使用的模型，对于视频生成，应为 `"cogvideox-3"`。

*   **`prompt` (字符串, 必填):** 视频的文字描述，即 Prompt。这是 AI 生成视频的核心输入。

*   **`quality` (字符串, 可选):** 输出模式，用于平衡生成速度和视频质量。
    *   `"quality"`: 优先保证视频质量。
    *   `"speed"`: 优先保证生成速度。

*   **`with_audio` (布尔值, 可选):** 是否在生成的视频中包含音频。
    *   `True`: 包含音频。
    *   `False`: 不包含音频。

*   **`size` (字符串, 可选):** 视频的输出分辨率。**支持 4K 分辨率。**
    *   示例值: `"1920x1080"` (1080p), `"3840x2160"` (4K)。

*   **`fps` (整数, 可选):** 视频的帧率。
    *   可选值: `30`, `60`。

*   **输入模式:** 除了文本 Prompt，还支持其他输入模式，如 `image` (图片生视频) 和 `start_frame`/`end_frame` (起始/结束帧控制)。

*   **`duration` (整数, 可选):** 视频的时长。
    *   可选值: `5` (秒), `10` (秒)。

**示例 (Python):**

```python
response = client.videos.generations(
    model="cogvideox-3",
    prompt="A cat is playing with a ball.",
    size="3840x2160", # 请求生成 4K 视频
    quality="quality",
    with_audio=True,
    fps=30,
    duration=5
)

print(response.id) # 获取任务 ID
```

---

## 3. 异步操作处理 (结果检索)

视频生成是一个耗时且异步的过程。`generations` 调用会立即返回一个任务 ID，而不是最终视频。需要通过轮询或回调机制来获取最终结果。

*   **获取任务 ID:** `generations` 调用的响应中包含一个 `id` 字段，用于标识本次生成任务。

*   **检索结果:** 使用 `client.videos.retrieve_videos_result` 方法，传入任务 ID 来查询任务状态和获取视频 URL。

**示例 (Python):**

```python
video_id = response.id # 从 generations 响应中获取的 ID

# 假设在一个循环中轮询，直到任务完成
while True:
    result = client.videos.retrieve_videos_result(id=video_id)
    if result.status == "succeeded": # 检查任务状态
        print("Video URL:", result.video.url)
        break
    elif result.status == "failed":
        print("Video generation failed.")
        break
    # else: 任务仍在进行中，等待一段时间后再次查询
    # time.sleep(5) # 实际应用中需要适当的等待时间
```

---

## 4. 其他注意事项

*   **并发限制:** API 调用受并发请求的速率限制。根据您的用户等级 (V0-V3)，会有不同的并发额度。在设计后端时需要考虑请求的排队和重试机制。
*   **API 成本:** 直接生成 4K 视频的 API 调用费用通常较高，需在项目预算中予以考虑。
*   **视频时长:** 目前支持 5 秒和 10 秒的视频时长，在设计前端界面时需告知用户此限制。
