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
    return <div className="shot-empty">暂无分镜数据</div>
  }

  return (
    <div>
      <div className="shot-panel-header">
        <h2>分镜列表 ({shots.length})</h2>
      </div>

      <div className="shot-list">
        {shots.map(shot => {
          const isExpanded = expandedId === shot.id
          return (
            <div key={shot.id} className={`shot-card ${isExpanded ? 'shot-card-expanded' : ''}`}>
              {/* 分镜头部 */}
              <div className="shot-header" onClick={() => toggleExpand(shot)}>
                <span className="shot-number">#{shot.shot_number}</span>
                <span className="shot-title">{shot.title}</span>
                <span className="shot-scene-name">{shot.scene_name}</span>
                <span className="shot-type-badge">
                  {SHOT_TYPES.find(t => t.value === shot.shot_type)?.label || shot.shot_type}
                </span>
                <span className="shot-char-count">{shot.character_emotions.length} 角色</span>
                <svg
                  className={`shot-chevron ${isExpanded ? 'shot-chevron-open' : ''}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>

              {/* 展开详情 */}
              {isExpanded && (
                <div className="shot-detail">
                  {/* 所属场景 */}
                  {shot.scene_name && (
                    <div className="shot-edit-field">
                      <label className="shot-edit-label">所属场景</label>
                      <span className="shot-scene-name">{shot.scene_name}</span>
                    </div>
                  )}
                  {/* 分镜基本信息编辑 */}
                  <div className="shot-edit-field">
                    <label className="shot-edit-label">分镜标题</label>
                    <input
                      value={editData.title || ''}
                      onChange={e => setEditData(d => ({ ...d, title: e.target.value }))}
                      className="char-edit-input"
                    />
                  </div>
                  <div className="shot-edit-field">
                    <label className="shot-edit-label">动作描述</label>
                    <textarea
                      value={editData.action_summary || ''}
                      onChange={e => setEditData(d => ({ ...d, action_summary: e.target.value }))}
                      rows={2}
                      className="char-edit-textarea"
                    />
                  </div>
                  <div className="shot-edit-grid">
                    <div className="shot-edit-field">
                      <label className="shot-edit-label">景别</label>
                      <select
                        value={editData.shot_type || 'MS'}
                        onChange={e => setEditData(d => ({ ...d, shot_type: e.target.value }))}
                        className="char-edit-select"
                      >
                        {SHOT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                      </select>
                    </div>
                    <div className="shot-edit-field">
                      <label className="shot-edit-label">角度</label>
                      <select
                        value={editData.camera_angle || 'eye-level'}
                        onChange={e => setEditData(d => ({ ...d, camera_angle: e.target.value }))}
                        className="char-edit-select"
                      >
                        {CAMERA_ANGLES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                      </select>
                    </div>
                    <div className="shot-edit-field">
                      <label className="shot-edit-label">运镜</label>
                      <select
                        value={editData.camera_movement || 'static'}
                        onChange={e => setEditData(d => ({ ...d, camera_movement: e.target.value }))}
                        className="char-edit-select"
                      >
                        {CAMERA_MOVEMENTS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                      </select>
                    </div>
                  </div>

                  {shot.dialogue && (
                    <div className="shot-edit-field">
                      <label className="shot-edit-label">对白</label>
                      <p className="shot-dialogue">"{shot.dialogue}"</p>
                    </div>
                  )}

                  <div className="shot-edit-actions">
                    <button
                      onClick={() => handleSaveShot(shot.id)}
                      disabled={saving}
                      className="btn btn-primary"
                    >
                      {saving ? (
                        <span className="btn-loading-content">
                          <span className="spinner" />
                          保存中...
                        </span>
                      ) : '保存分镜'}
                    </button>
                  </div>

                  {/* 角色情绪编辑 */}
                  {shot.character_emotions.length > 0 && (
                    <div className="shot-emotions-section">
                      <h4 className="shot-emotions-title">角色情绪</h4>
                      <div className="shot-emotions-list">
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
          )
        })}
      </div>
    </div>
  )
}
