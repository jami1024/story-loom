import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import type { StoryScene } from '../../types/story'
import {
  updateScene,
  generateSceneImage,
  generateAllSceneImages,
  calibrateScenes,
  calibrateScene,
} from '../../services/api'

interface SceneListPanelProps {
  scenes: StoryScene[]
  projectId: number
  onRefresh: () => void
}

export default function SceneListPanel({ scenes, projectId, onRefresh }: SceneListPanelProps) {
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editData, setEditData] = useState<Partial<StoryScene>>({})
  const [saving, setSaving] = useState(false)
  const [generatingIds, setGeneratingIds] = useState<Set<number>>(new Set())
  const [calibratingIds, setCalibratingIds] = useState<Set<number>>(new Set())
  const [batchGenerating, setBatchGenerating] = useState(false)
  const [batchCalibrating, setBatchCalibrating] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [genError, setGenError] = useState<string | null>(null)

  // Auto-dismiss error after 5 seconds
  useEffect(() => {
    if (!genError) return
    const timer = setTimeout(() => setGenError(null), 5000)
    return () => clearTimeout(timer)
  }, [genError])

  // ESC 关闭预览
  useEffect(() => {
    if (!previewUrl) return
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setPreviewUrl(null) }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [previewUrl])

  const startEdit = (scene: StoryScene) => {
    setEditingId(scene.id)
    setEditData({
      name: scene.name,
      location: scene.location,
      time_of_day: scene.time_of_day,
      weather: scene.weather,
      atmosphere: scene.atmosphere,
      architecture_style: scene.architecture_style,
      lighting_design: scene.lighting_design,
      color_palette: scene.color_palette,
      visual_prompt_zh: scene.visual_prompt_zh,
    })
  }

  const handleSave = async () => {
    if (!editingId) return
    setSaving(true)
    try {
      await updateScene(editingId, editData)
      setEditingId(null)
      onRefresh()
    } catch (e) {
      console.error('保存失败:', e)
    } finally {
      setSaving(false)
    }
  }

  const handleGenerateImage = async (sceneId: number, e: React.MouseEvent) => {
    e.stopPropagation()
    setGeneratingIds(prev => new Set(prev).add(sceneId))
    try {
      await generateSceneImage(sceneId)
      onRefresh()
    } catch (err) {
      setGenError(err instanceof Error ? err.message : '场景图片生成失败')
    } finally {
      setGeneratingIds(prev => {
        const next = new Set(prev)
        next.delete(sceneId)
        return next
      })
    }
  }

  const handleBatchGenerate = async () => {
    setBatchGenerating(true)
    try {
      await generateAllSceneImages(projectId)
      onRefresh()
    } catch (err) {
      setGenError(err instanceof Error ? err.message : '批量生成失败')
    } finally {
      setBatchGenerating(false)
    }
  }

  const handleCalibrate = async (sceneId: number, e: React.MouseEvent) => {
    e.stopPropagation()
    setCalibratingIds(prev => new Set(prev).add(sceneId))
    try {
      await calibrateScene(sceneId)
      onRefresh()
    } catch (err) {
      console.error('AI 校准失败:', err)
    } finally {
      setCalibratingIds(prev => {
        const next = new Set(prev)
        next.delete(sceneId)
        return next
      })
    }
  }

  const handleBatchCalibrate = async () => {
    setBatchCalibrating(true)
    try {
      await calibrateScenes(projectId)
      onRefresh()
    } catch (err) {
      console.error('批量校准失败:', err)
    } finally {
      setBatchCalibrating(false)
    }
  }

  const isGenerating = (scene: StoryScene) =>
    generatingIds.has(scene.id) || scene.image_status === 'generating'

  const isCalibrating = (sceneId: number) => calibratingIds.has(sceneId)

  if (!scenes.length) {
    return <div className="scene-empty">暂无场景数据</div>
  }

  return (
    <div>
      {/* 头部：标题 + 批量操作按钮 */}
      <div className="scene-panel-header">
        <h2>场景列表 ({scenes.length})</h2>
        <div className="scene-panel-actions">
          <button
            onClick={handleBatchCalibrate}
            disabled={batchCalibrating}
            className="btn btn-ghost"
          >
            {batchCalibrating ? (
              <span className="btn-loading-content">
                <span className="spinner" />
                批量校准中...
              </span>
            ) : 'AI 批量校准'}
          </button>
          <button
            onClick={handleBatchGenerate}
            disabled={batchGenerating}
            className="btn btn-ghost"
          >
            {batchGenerating ? (
              <span className="btn-loading-content">
                <span className="spinner" />
                批量生成中...
              </span>
            ) : '批量生成场景图片'}
          </button>
        </div>
      </div>

      {genError && (
        <div className="gen-error-banner">
          <span>{genError}</span>
          <button onClick={() => setGenError(null)} className="gen-error-close">&times;</button>
        </div>
      )}

      {/* 图片预览弹窗 — Portal 到 body 避免被父容器裁切 */}
      {previewUrl && createPortal(
        <div className="scene-preview-overlay" onClick={() => setPreviewUrl(null)}>
          <div className="scene-preview-container" onClick={e => e.stopPropagation()}>
            <img src={previewUrl} alt="场景图片预览" className="scene-preview-img" />
            <button className="scene-preview-close" onClick={() => setPreviewUrl(null)}>
              &times;
            </button>
          </div>
        </div>,
        document.body,
      )}

      {/* 场景卡片网格 */}
      <div className="scene-grid">
        {scenes.map(scene => (
          <div key={scene.id} className="scene-card">
            {editingId === scene.id ? (
              /* ========== 编辑模式 ========== */
              <div className="scene-edit-form">
                <input
                  value={editData.name || ''}
                  onChange={e => setEditData(d => ({ ...d, name: e.target.value }))}
                  placeholder="场景名称"
                  className="char-edit-input"
                />
                <input
                  value={editData.location || ''}
                  onChange={e => setEditData(d => ({ ...d, location: e.target.value }))}
                  placeholder="地点描述"
                  className="char-edit-input"
                />
                <div className="scene-edit-row">
                  <input
                    value={editData.time_of_day || ''}
                    onChange={e => setEditData(d => ({ ...d, time_of_day: e.target.value }))}
                    placeholder="时间（如：黄昏）"
                    className="char-edit-input"
                  />
                  <input
                    value={editData.weather || ''}
                    onChange={e => setEditData(d => ({ ...d, weather: e.target.value }))}
                    placeholder="天气（如：晴）"
                    className="char-edit-input"
                  />
                </div>
                <textarea
                  value={editData.atmosphere || ''}
                  onChange={e => setEditData(d => ({ ...d, atmosphere: e.target.value }))}
                  placeholder="氛围描述"
                  rows={2}
                  className="char-edit-textarea"
                />

                {/* 视觉设计区域 */}
                <hr className="scene-edit-divider" />
                <p className="scene-edit-section-label">视觉设计</p>
                <input
                  value={editData.architecture_style || ''}
                  onChange={e => setEditData(d => ({ ...d, architecture_style: e.target.value }))}
                  placeholder="建筑/环境风格"
                  className="char-edit-input"
                />
                <div className="scene-edit-row">
                  <input
                    value={editData.lighting_design || ''}
                    onChange={e => setEditData(d => ({ ...d, lighting_design: e.target.value }))}
                    placeholder="光影设计"
                    className="char-edit-input"
                  />
                  <input
                    value={editData.color_palette || ''}
                    onChange={e => setEditData(d => ({ ...d, color_palette: e.target.value }))}
                    placeholder="色彩基调"
                    className="char-edit-input"
                  />
                </div>
                <textarea
                  value={editData.visual_prompt_zh || ''}
                  onChange={e => setEditData(d => ({ ...d, visual_prompt_zh: e.target.value }))}
                  placeholder="视觉锚点描述（中文场景 Prompt）"
                  rows={3}
                  className="char-edit-textarea"
                />

                <div className="char-edit-actions">
                  <button onClick={() => setEditingId(null)} className="btn btn-ghost">
                    取消
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="btn btn-primary"
                  >
                    {saving ? (
                      <span className="btn-loading-content">
                        <span className="spinner" />
                        保存中...
                      </span>
                    ) : '保存'}
                  </button>
                </div>
              </div>
            ) : (
              /* ========== 展示模式 ========== */
              <div>
                {/* 16:9 场景参考图区域 */}
                <div className="scene-thumb">
                  {isGenerating(scene) ? (
                    <div className="scene-thumb-loading">
                      <svg className="animate-spin" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      <span>场景图片生成中...</span>
                    </div>
                  ) : scene.image_url ? (
                    <>
                      <img
                        src={scene.image_url}
                        alt={scene.name}
                        className="scene-thumb-img"
                        onClick={(e) => { e.stopPropagation(); setPreviewUrl(scene.image_url) }}
                      />
                      <button
                        onClick={(e) => handleGenerateImage(scene.id, e)}
                        className="scene-thumb-regen"
                        title="重新生成"
                      >
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={(e) => handleGenerateImage(scene.id, e)}
                      className="scene-thumb-empty"
                      title="生成场景图片"
                    >
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                      </svg>
                      <span>生成场景图片</span>
                    </button>
                  )}
                </div>

                {/* 场景信息区 */}
                <div className="scene-body" onClick={() => startEdit(scene)} style={{ cursor: 'pointer' }}>
                  <div className="scene-body-header">
                    <span className="scene-name">{scene.name}</span>
                    <span className="scene-count">出场 {scene.appearance_count} 次</span>
                  </div>

                  {scene.location && <p className="scene-location">{scene.location}</p>}

                  {(scene.time_of_day || scene.weather) && (
                    <p className="scene-meta">
                      {scene.time_of_day && <span>{scene.time_of_day}</span>}
                      {scene.time_of_day && scene.weather && <span className="scene-meta-dot">·</span>}
                      {scene.weather && <span>{scene.weather}</span>}
                    </p>
                  )}

                  {scene.visual_prompt_zh && (
                    <div className="scene-anchor">
                      <strong>视觉锚点:</strong> {scene.visual_prompt_zh}
                    </div>
                  )}

                  {scene.atmosphere && (
                    <p className="scene-atmosphere">{scene.atmosphere}</p>
                  )}

                  {/* 操作按钮 */}
                  <div className="scene-actions">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleCalibrate(scene.id, e) }}
                      disabled={isCalibrating(scene.id)}
                      className="scene-action-btn scene-action-calibrate"
                    >
                      {isCalibrating(scene.id) ? (
                        <>
                          <span className="spinner" style={{ width: 12, height: 12 }} />
                          校准中
                        </>
                      ) : 'AI 校准'}
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleGenerateImage(scene.id, e) }}
                      disabled={isGenerating(scene)}
                      className="scene-action-btn scene-action-generate"
                    >
                      {isGenerating(scene) ? (
                        <>
                          <span className="spinner" style={{ width: 12, height: 12 }} />
                          生成中
                        </>
                      ) : '生成图片'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
