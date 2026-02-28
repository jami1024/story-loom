import { useState } from 'react'
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
      console.error('场景图片生成失败:', err)
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
      console.error('批量生成失败:', err)
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
    return <div className="text-center text-gray-400 py-16">暂无场景数据</div>
  }

  return (
    <div>
      {/* 头部：标题 + 批量操作按钮 */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">场景列表 ({scenes.length})</h2>
        <div className="flex gap-2">
          <button
            onClick={handleBatchCalibrate}
            disabled={batchCalibrating}
            className="px-4 py-1.5 bg-amber-600 text-white text-sm rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {batchCalibrating ? (
              <span className="flex items-center gap-1.5">
                <SpinnerIcon />
                批量校准中...
              </span>
            ) : 'AI 批量校准'}
          </button>
          <button
            onClick={handleBatchGenerate}
            disabled={batchGenerating}
            className="px-4 py-1.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {batchGenerating ? (
              <span className="flex items-center gap-1.5">
                <SpinnerIcon />
                批量生成中...
              </span>
            ) : '批量生成场景图片'}
          </button>
        </div>
      </div>

      {/* 图片预览弹窗 */}
      {previewUrl && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-8"
          onClick={() => setPreviewUrl(null)}
        >
          <div className="relative max-w-4xl max-h-[80vh]">
            <img
              src={previewUrl}
              alt="场景图片预览"
              className="max-w-full max-h-[80vh] rounded-lg shadow-2xl object-contain"
            />
            <button
              onClick={() => setPreviewUrl(null)}
              className="absolute -top-3 -right-3 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-600 hover:text-gray-900"
            >
              &times;
            </button>
          </div>
        </div>
      )}

      {/* 场景卡片网格 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {scenes.map(scene => (
          <div key={scene.id} className="border border-gray-200 rounded-lg overflow-hidden hover:border-gray-300 transition-colors">
            {editingId === scene.id ? (
              /* ========== 编辑模式 ========== */
              <div className="p-4 space-y-3">
                <input
                  value={editData.name || ''}
                  onChange={e => setEditData(d => ({ ...d, name: e.target.value }))}
                  placeholder="场景名称"
                  className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
                />
                <input
                  value={editData.location || ''}
                  onChange={e => setEditData(d => ({ ...d, location: e.target.value }))}
                  placeholder="地点描述"
                  className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    value={editData.time_of_day || ''}
                    onChange={e => setEditData(d => ({ ...d, time_of_day: e.target.value }))}
                    placeholder="时间（如：黄昏）"
                    className="px-2 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
                  />
                  <input
                    value={editData.weather || ''}
                    onChange={e => setEditData(d => ({ ...d, weather: e.target.value }))}
                    placeholder="天气（如：晴）"
                    className="px-2 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
                  />
                </div>
                <textarea
                  value={editData.atmosphere || ''}
                  onChange={e => setEditData(d => ({ ...d, atmosphere: e.target.value }))}
                  placeholder="氛围描述"
                  rows={2}
                  className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm resize-none focus:outline-none focus:ring-1 focus:ring-gray-400"
                />

                {/* 分隔线 + 视觉设计区域 */}
                <div className="border-t border-gray-100 pt-3">
                  <p className="text-xs text-gray-400 mb-2">视觉设计</p>
                  <input
                    value={editData.architecture_style || ''}
                    onChange={e => setEditData(d => ({ ...d, architecture_style: e.target.value }))}
                    placeholder="建筑/环境风格"
                    className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-gray-400 mb-2"
                  />
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <input
                      value={editData.lighting_design || ''}
                      onChange={e => setEditData(d => ({ ...d, lighting_design: e.target.value }))}
                      placeholder="光影设计"
                      className="px-2 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
                    />
                    <input
                      value={editData.color_palette || ''}
                      onChange={e => setEditData(d => ({ ...d, color_palette: e.target.value }))}
                      placeholder="色彩基调"
                      className="px-2 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
                    />
                  </div>
                  <textarea
                    value={editData.visual_prompt_zh || ''}
                    onChange={e => setEditData(d => ({ ...d, visual_prompt_zh: e.target.value }))}
                    placeholder="视觉锚点描述（中文场景 Prompt）"
                    rows={3}
                    className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm resize-none focus:outline-none focus:ring-1 focus:ring-gray-400"
                  />
                </div>

                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => setEditingId(null)}
                    className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-4 py-1.5 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800 disabled:opacity-50"
                  >
                    {saving ? '保存中...' : '保存'}
                  </button>
                </div>
              </div>
            ) : (
              /* ========== 展示模式 ========== */
              <div>
                {/* 16:9 场景参考图区域 */}
                <div className="aspect-video bg-gray-50 relative">
                  {isGenerating(scene) ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <svg className="animate-spin h-8 w-8 text-indigo-500 mb-2" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      <span className="text-sm text-gray-400">场景图片生成中...</span>
                    </div>
                  ) : scene.image_url ? (
                    <div className="relative group w-full h-full">
                      <img
                        src={scene.image_url}
                        alt={scene.name}
                        className="w-full h-full object-cover cursor-pointer"
                        onClick={(e) => { e.stopPropagation(); setPreviewUrl(scene.image_url) }}
                      />
                      <button
                        onClick={(e) => handleGenerateImage(scene.id, e)}
                        className="absolute top-2 right-2 w-7 h-7 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-full flex items-center justify-center text-gray-400 hover:text-indigo-600 hover:border-indigo-300 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                        title="重新生成"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={(e) => handleGenerateImage(scene.id, e)}
                      className="absolute inset-0 flex flex-col items-center justify-center border-2 border-dashed border-gray-200 hover:border-indigo-300 text-gray-400 hover:text-indigo-500 transition-colors"
                      title="生成场景图片"
                    >
                      <svg className="w-8 h-8 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                      </svg>
                      <span className="text-xs">生成场景图片</span>
                    </button>
                  )}
                </div>

                {/* 场景信息区 */}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-gray-900">{scene.name}</h3>
                    <span className="text-xs text-gray-400">出场 {scene.appearance_count} 次</span>
                  </div>

                  <div className="space-y-1 text-sm text-gray-600">
                    {scene.location && <p>{scene.location}</p>}
                    <p>
                      {scene.time_of_day && <span>{scene.time_of_day}</span>}
                      {scene.time_of_day && scene.weather && <span className="mx-1">·</span>}
                      {scene.weather && <span>{scene.weather}</span>}
                    </p>
                  </div>

                  {/* 视觉锚点标签 */}
                  {scene.visual_prompt_zh && (
                    <div className="mt-2 px-2 py-1.5 bg-amber-50 border border-amber-100 rounded text-xs text-amber-700 line-clamp-2">
                      <span className="font-medium">视觉锚点:</span> {scene.visual_prompt_zh}
                    </div>
                  )}

                  {scene.atmosphere && (
                    <p className="text-gray-400 text-xs mt-1">{scene.atmosphere}</p>
                  )}

                  {/* 操作按钮 */}
                  <div className="flex items-center justify-between mt-3">
                    <p className="text-xs text-gray-300 cursor-pointer" onClick={() => startEdit(scene)}>点击编辑</p>
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => handleCalibrate(scene.id, e)}
                        disabled={isCalibrating(scene.id)}
                        className="px-3 py-1 text-xs border border-amber-200 text-amber-600 rounded hover:bg-amber-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {isCalibrating(scene.id) ? (
                          <span className="flex items-center gap-1">
                            <SpinnerIcon size={3} />
                            校准中
                          </span>
                        ) : 'AI 校准'}
                      </button>
                      <button
                        onClick={(e) => handleGenerateImage(scene.id, e)}
                        disabled={isGenerating(scene)}
                        className="px-3 py-1 text-xs border border-indigo-200 text-indigo-600 rounded hover:bg-indigo-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {isGenerating(scene) ? (
                          <span className="flex items-center gap-1">
                            <SpinnerIcon size={3} />
                            生成中
                          </span>
                        ) : '生成图片'}
                      </button>
                    </div>
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

/** 加载旋转图标 */
function SpinnerIcon({ size = 4 }: { size?: number }) {
  const cls = size === 3 ? 'animate-spin h-3 w-3' : 'animate-spin h-4 w-4'
  return (
    <svg className={cls} viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}
