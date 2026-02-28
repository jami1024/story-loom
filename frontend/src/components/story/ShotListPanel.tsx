import { useState } from 'react'
import type { StoryShot, EmotionPresets } from '../../types/story'
import { updateShot } from '../../services/api'
import EmotionEditor from './EmotionEditor'

interface ShotListPanelProps {
  shots: StoryShot[]
  presets: EmotionPresets | null
  onRefresh: () => void
}

const SHOT_TYPES = [
  { value: 'WS', label: '远景' },
  { value: 'LS', label: '全景' },
  { value: 'MS', label: '中景' },
  { value: 'CU', label: '近景' },
  { value: 'ECU', label: '特写' },
]

const CAMERA_ANGLES = [
  { value: 'eye-level', label: '平视' },
  { value: 'high-angle', label: '俯拍' },
  { value: 'low-angle', label: '仰拍' },
  { value: 'over-shoulder', label: '过肩' },
  { value: 'dutch-angle', label: '荷兰角' },
]

const CAMERA_MOVEMENTS = [
  { value: 'static', label: '固定' },
  { value: 'tracking', label: '跟拍' },
  { value: 'pan-left', label: '左摇' },
  { value: 'pan-right', label: '右摇' },
  { value: 'dolly-in', label: '推进' },
  { value: 'dolly-out', label: '拉远' },
  { value: 'crane-up', label: '上升' },
  { value: 'crane-down', label: '下降' },
]

export default function ShotListPanel({ shots, presets, onRefresh }: ShotListPanelProps) {
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [editData, setEditData] = useState<Partial<StoryShot>>({})
  const [saving, setSaving] = useState(false)

  const toggleExpand = (shot: StoryShot) => {
    if (expandedId === shot.id) {
      setExpandedId(null)
    } else {
      setExpandedId(shot.id)
      setEditData({
        title: shot.title,
        action_summary: shot.action_summary,
        shot_type: shot.shot_type,
        camera_angle: shot.camera_angle,
        camera_movement: shot.camera_movement,
      })
    }
  }

  const handleSaveShot = async (shotId: number) => {
    setSaving(true)
    try {
      await updateShot(shotId, editData)
      onRefresh()
    } catch (e) {
      console.error('保存失败:', e)
    } finally {
      setSaving(false)
    }
  }

  if (!shots.length) {
    return <div className="text-center text-gray-400 py-16">暂无分镜数据</div>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">分镜列表 ({shots.length})</h2>
      </div>

      <div className="space-y-3">
        {shots.map(shot => (
          <div key={shot.id} className="border border-gray-200 rounded-lg overflow-hidden">
            {/* 分镜头部 */}
            <div
              onClick={() => toggleExpand(shot)}
              className="flex items-center gap-4 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
            >
              <span className="text-xs font-mono text-gray-400 w-8">#{shot.shot_number}</span>
              <span className="font-medium text-gray-900 flex-1">{shot.title}</span>
              <span className="text-xs text-gray-400">{shot.scene_name}</span>
              <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-500">
                {SHOT_TYPES.find(t => t.value === shot.shot_type)?.label || shot.shot_type}
              </span>
              <span className="text-xs text-gray-400">{shot.character_emotions.length} 角色</span>
              <svg
                className={`w-4 h-4 text-gray-400 transition-transform ${expandedId === shot.id ? 'rotate-180' : ''}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>

            {/* 展开详情 */}
            {expandedId === shot.id && (
              <div className="border-t border-gray-100 p-4 space-y-4">
                {/* 分镜基本信息编辑 */}
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-500">分镜标题</label>
                    <input
                      value={editData.title || ''}
                      onChange={e => setEditData(d => ({ ...d, title: e.target.value }))}
                      className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">动作描述</label>
                    <textarea
                      value={editData.action_summary || ''}
                      onChange={e => setEditData(d => ({ ...d, action_summary: e.target.value }))}
                      rows={2}
                      className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm resize-none focus:outline-none focus:ring-1 focus:ring-gray-400"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs text-gray-500">景别</label>
                      <select
                        value={editData.shot_type || 'MS'}
                        onChange={e => setEditData(d => ({ ...d, shot_type: e.target.value }))}
                        className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
                      >
                        {SHOT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">角度</label>
                      <select
                        value={editData.camera_angle || 'eye-level'}
                        onChange={e => setEditData(d => ({ ...d, camera_angle: e.target.value }))}
                        className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
                      >
                        {CAMERA_ANGLES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">运镜</label>
                      <select
                        value={editData.camera_movement || 'static'}
                        onChange={e => setEditData(d => ({ ...d, camera_movement: e.target.value }))}
                        className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
                      >
                        {CAMERA_MOVEMENTS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                      </select>
                    </div>
                  </div>

                  {shot.dialogue && (
                    <div>
                      <label className="text-xs text-gray-500">对白</label>
                      <p className="text-sm text-gray-600 italic">"{shot.dialogue}"</p>
                    </div>
                  )}

                  <div className="flex justify-end">
                    <button
                      onClick={() => handleSaveShot(shot.id)}
                      disabled={saving}
                      className="px-4 py-1.5 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800 disabled:opacity-50"
                    >
                      {saving ? '保存中...' : '保存分镜'}
                    </button>
                  </div>
                </div>

                {/* 角色情绪编辑 */}
                {shot.character_emotions.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">角色情绪</h4>
                    <div className="space-y-2">
                      {shot.character_emotions.map(emo => (
                        <EmotionEditor
                          key={`${emo.shot_id}-${emo.character_id}`}
                          emotion={emo}
                          presets={presets}
                          onSaved={onRefresh}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
