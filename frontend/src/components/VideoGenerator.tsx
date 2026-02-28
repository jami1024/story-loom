import { useState } from 'react'
import './VideoGenerator.css'

interface VideoGeneratorProps {
  onTaskCreated: (taskIds: string[], prompt: string) => void
}

// 使用相对路径(空字符串)让 Nginx 代理处理,或在开发环境使用 localhost:8001
const API_BASE_URL = import.meta.env.VITE_API_URL !== undefined
  ? import.meta.env.VITE_API_URL
  : 'http://localhost:8001'

export default function VideoGenerator({ onTaskCreated }: VideoGeneratorProps) {
  // 表单字段
  const [cameraWork, setCameraWork] = useState('')
  const [lighting, setLighting] = useState('')
  const [subject, setSubject] = useState('')
  const [subjectDescription, setSubjectDescription] = useState('')
  const [subjectMotion, setSubjectMotion] = useState('')
  const [scene, setScene] = useState('')
  const [sceneDescription, setSceneDescription] = useState('')
  const [mood, setMood] = useState('')

  // 生成的完整描述
  const [prompt, setPrompt] = useState('')

  // 生成条数
  const [count, setCount] = useState(1)

  // 选中的标签状态
  const [selectedCameraTag, setSelectedCameraTag] = useState('')
  const [selectedLightingTag, setSelectedLightingTag] = useState('')
  const [selectedMoodTag, setSelectedMoodTag] = useState('')

  // 状态
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')

  // 生成 Prompt 描述
  const handleGeneratePrompt = async () => {
    // 验证必填字段
    if (!subject || !scene) {
      setError('请至少填写主体和场景')
      return
    }

    setGenerating(true)
    setError('')

    try {
      const response = await fetch(`${API_BASE_URL}/api/prompt/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          camera_work: cameraWork,
          lighting,
          subject,
          subject_description: subjectDescription,
          subject_motion: subjectMotion,
          scene,
          scene_description: sceneDescription,
          mood
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        const errorMessage = errorData?.detail || `生成描述失败 (${response.status})`
        throw new Error(errorMessage)
      }

      const data = await response.json()

      // 将生成的描述填充到输入框
      setPrompt(data.prompt || data.description || '')

    } catch (err) {
      console.error('生成 Prompt 失败:', err)
      setError(err instanceof Error ? err.message : '生成描述失败，请重试')
    } finally {
      setGenerating(false)
    }
  }

  // 提交视频生成
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!prompt.trim()) {
      setError('请先生成视频描述')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch(`${API_BASE_URL}/api/video/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          count
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        const errorMessage = errorData?.detail || `请求失败 (${response.status}): ${response.statusText}`
        throw new Error(errorMessage)
      }

      const data = await response.json()

      // 通知父组件任务已创建（批量生成返回 tasks 数组）
      const taskIds = data.tasks.map((task: { chat_id: string }) => task.chat_id)
      onTaskCreated(taskIds, prompt)

      // 清空所有输入
      setPrompt('')
      setCameraWork('')
      setLighting('')
      setSubject('')
      setSubjectDescription('')
      setSubjectMotion('')
      setScene('')
      setSceneDescription('')
      setMood('')

      // 清空选中状态
      setSelectedCameraTag('')
      setSelectedLightingTag('')
      setSelectedMoodTag('')

    } catch (err) {
      console.error('视频生成请求失败:', err)
      setError(err instanceof Error ? err.message : '生成失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="video-generator">
      <form onSubmit={handleSubmit} className="generator-form">
        {/* 步骤 1: 填写视频元素 */}
        <div className="form-section step-1">
          <h3 className="section-title">
            <span className="step-number">1</span>
            填写视频元素
          </h3>

          {/* 镜头与光影卡片 */}
          <div className="input-card">
            <div className="card-header">
              <span className="card-icon">🎥</span>
              <h4 className="card-title">镜头与光影</h4>
            </div>
            <div className="form-grid">
              <div className="form-group">
                <div className="label-with-select">
                  <label htmlFor="cameraWork">镜头语言</label>
                  <select
                    className="quick-select"
                    value={selectedCameraTag}
                    onChange={(e) => {
                      const value = e.target.value
                      if (value) {
                        setCameraWork(value)
                        setSelectedCameraTag(value)
                      }
                    }}
                    disabled={generating || loading}
                  >
                    <option value="">快速选择</option>
                    <option value="特写镜头">特写镜头</option>
                    <option value="无人机航拍">无人机航拍</option>
                    <option value="慢动作">慢动作</option>
                    <option value="低角度拍摄">低角度拍摄</option>
                    <option value="跟踪镜头">跟踪镜头</option>
                    <option value="推拉镜头">推拉镜头</option>
                  </select>
                </div>
                <textarea
                  id="cameraWork"
                  value={cameraWork}
                  onChange={(e) => {
                    setCameraWork(e.target.value)
                    setSelectedCameraTag('')
                  }}
                  placeholder="描述镜头运动和角度，如：特写镜头、无人机航拍、低角度拍摄"
                  className="form-textarea"
                  rows={2}
                  disabled={generating || loading}
                />
              </div>

              <div className="form-group">
                <div className="label-with-select">
                  <label htmlFor="lighting">光影</label>
                  <select
                    className="quick-select"
                    value={selectedLightingTag}
                    onChange={(e) => {
                      const value = e.target.value
                      if (value) {
                        setLighting(value)
                        setSelectedLightingTag(value)
                      }
                    }}
                    disabled={generating || loading}
                  >
                    <option value="">快速选择</option>
                    <option value="电影级光效">电影级光效</option>
                    <option value="霓虹灯">霓虹灯</option>
                    <option value="金色阳光">金色阳光</option>
                    <option value="体积光">体积光</option>
                    <option value="逆光">逆光</option>
                    <option value="柔光">柔光</option>
                  </select>
                </div>
                <textarea
                  id="lighting"
                  value={lighting}
                  onChange={(e) => {
                    setLighting(e.target.value)
                    setSelectedLightingTag('')
                  }}
                  placeholder="描述光影效果，如：电影级光效、霓虹灯、金色阳光"
                  className="form-textarea"
                  rows={2}
                  disabled={generating || loading}
                />
              </div>
            </div>
          </div>

          {/* 主体卡片 */}
          <div className="input-card">
            <div className="card-header">
              <span className="card-icon">🎯</span>
              <h4 className="card-title">主体</h4>
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="subject">
                  主体 <span className="required">*</span>
                </label>
                <textarea
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="描述视频的主要对象，如：一只布偶猫、一个骑士、一艘飞船"
                  className="form-textarea"
                  rows={2}
                  disabled={generating || loading}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="subjectDescription">主体描述</label>
                <textarea
                  id="subjectDescription"
                  value={subjectDescription}
                  onChange={(e) => setSubjectDescription(e.target.value)}
                  placeholder="描述主体的特征，如：可爱的、穿着盔甲的、巨大的"
                  className="form-textarea"
                  rows={2}
                  disabled={generating || loading}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="subjectMotion">主体运动</label>
              <textarea
                id="subjectMotion"
                value={subjectMotion}
                onChange={(e) => setSubjectMotion(e.target.value)}
                placeholder="描述主体的动作，如：在键盘上打字、飞翔、旋转"
                className="form-textarea"
                rows={2}
                disabled={generating || loading}
              />
            </div>
          </div>

          {/* 场景卡片 */}
          <div className="input-card">
            <div className="card-header">
              <span className="card-icon">🌍</span>
              <h4 className="card-title">场景与氛围</h4>
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="scene">
                  场景 <span className="required">*</span>
                </label>
                <textarea
                  id="scene"
                  value={scene}
                  onChange={(e) => setScene(e.target.value)}
                  placeholder="描述场景环境，如：赛博朋克房间、森林、太空"
                  className="form-textarea"
                  rows={2}
                  disabled={generating || loading}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="sceneDescription">场景描述</label>
                <textarea
                  id="sceneDescription"
                  value={sceneDescription}
                  onChange={(e) => setSceneDescription(e.target.value)}
                  placeholder="描述场景细节，如：霓虹灯闪烁、阳光斑驳、星空璀璨"
                  className="form-textarea"
                  rows={2}
                  disabled={generating || loading}
                />
              </div>
            </div>

            <div className="form-group">
              <div className="label-with-select">
                <label htmlFor="mood">情绪/氛围/风格</label>
                <select
                  className="quick-select"
                  value={selectedMoodTag}
                  onChange={(e) => {
                    const value = e.target.value
                    if (value) {
                      setMood(value)
                      setSelectedMoodTag(value)
                    }
                  }}
                  disabled={generating || loading}
                >
                  <option value="">快速选择</option>
                  <option value="电影感">电影感</option>
                  <option value="赛博朋克">赛博朋克</option>
                  <option value="宫崎骏风格">宫崎骏风格</option>
                  <option value="水彩画">水彩画</option>
                  <option value="复古胶片">复古胶片</option>
                  <option value="未来主义">未来主义</option>
                </select>
              </div>
              <textarea
                id="mood"
                value={mood}
                onChange={(e) => {
                  setMood(e.target.value)
                  setSelectedMoodTag('')
                }}
                placeholder="描述整体氛围，如：电影感、温馨、科幻、赛博朋克风格"
                className="form-textarea"
                rows={2}
                disabled={generating || loading}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handleGeneratePrompt}
            className="generate-prompt-btn"
            disabled={generating || loading || !subject || !scene}
          >
            {generating ? (
              <>
                <span className="btn-spinner"></span>
                生成中...
              </>
            ) : (
              <>
                <span className="btn-icon">✨</span>
                生成视频描述
              </>
            )}
          </button>
        </div>

        {/* 步骤 2: 生成的描述 */}
        {prompt && (
          <div className="form-section step-2">
            <h3 className="section-title">
              <span className="step-number">2</span>
              预览与编辑描述
            </h3>
            <div className="form-group">
              <div className="label-row">
                <label htmlFor="generatedPrompt">视频描述（可编辑）</label>
                <span className="char-count">{prompt.length} / 500</span>
              </div>
              <textarea
                id="generatedPrompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="生成的视频描述将显示在这里..."
                rows={4}
                maxLength={500}
                disabled={loading}
                className="generated-textarea"
              />
            </div>
          </div>
        )}

        {/* 步骤 3: 生成条数 */}
        <div className="form-section step-3">
          <h3 className="section-title">
            <span className="step-number">3</span>
            生成视频条数
          </h3>

          <div className="params-grid">
            {/* 生成条数 */}
            <div className="form-group">
              <label htmlFor="count">生成条数</label>
              <select
                id="count"
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
                disabled={loading}
                className="form-select"
              >
                <option value={1}>1 条</option>
                <option value={2}>2 条</option>
                <option value={3}>3 条</option>
                <option value={4}>4 条</option>
                <option value={5}>5 条</option>
              </select>
            </div>
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

        <button
          type="submit"
          className="submit-btn"
          disabled={loading || !prompt.trim()}
        >
          {loading ? (
            <>
              <span className="btn-spinner"></span>
              生成中...
            </>
          ) : (
            <>
              <span className="btn-icon">🚀</span>
              开始生成 4K 视频
            </>
          )}
        </button>
      </form>
    </div>
  )
}
