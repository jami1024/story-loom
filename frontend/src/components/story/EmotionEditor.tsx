import type { CharacterEmotion, EmotionPresets } from '../../types/story'
import { updateEmotion } from '../../services/api'
import { useState } from 'react'

interface EmotionEditorProps {
  emotion: CharacterEmotion
  presets: EmotionPresets | null
  onSaved: () => void
}

export default function EmotionEditor({ emotion, presets, onSaved }: EmotionEditorProps) {
  const [data, setData] = useState({
    emotion_tag: emotion.emotion_tag,
    emotion_intensity: emotion.emotion_intensity,
    expression_start: emotion.expression_start || '',
    expression_peak: emotion.expression_peak || '',
    expression_end: emotion.expression_end || '',
    body_language: emotion.body_language || '',
    emotion_transition: emotion.emotion_transition || 'stable',
  })
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)

  const update = (key: string, value: string | number) => {
    setData(d => ({ ...d, [key]: value }))
    setDirty(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await updateEmotion(emotion.shot_id, emotion.character_id, data)
      setDirty(false)
      onSaved()
    } catch (e) {
      console.error('保存情绪失败:', e)
    } finally {
      setSaving(false)
    }
  }

  const tags = presets?.tags || []
  const transitions = presets?.transitions || []

  return (
    <div className="emo-card">
      <div className="emo-header">
        <span className="emo-char-name">{emotion.character_name}</span>
        {dirty && (
          <button
            onClick={handleSave}
            disabled={saving}
            className="emo-save-btn"
          >
            {saving ? '...' : '保存'}
          </button>
        )}
      </div>

      <div className="emo-body">
        {/* 情绪标签 + 强度 */}
        <div className="emo-tag-row">
          <div className="emo-tag-field">
            <label className="emo-label">情绪</label>
            <select
              value={data.emotion_tag}
              onChange={e => update('emotion_tag', e.target.value)}
              className="char-edit-select"
            >
              {tags.map(t => (
                <option key={t.id} value={t.id}>{t.zh} ({t.en})</option>
              ))}
            </select>
          </div>
          <div className="emo-intensity-field">
            <label className="emo-label">强度 {data.emotion_intensity}/5</label>
            <input
              type="range"
              min={1}
              max={5}
              value={data.emotion_intensity}
              onChange={e => update('emotion_intensity', parseInt(e.target.value))}
              className="emo-range"
            />
          </div>
        </div>

        {/* 表情描述 */}
        <div className="emo-expression-row">
          <div className="emo-field">
            <label className="emo-label">起始表情</label>
            <input
              value={data.expression_start}
              onChange={e => update('expression_start', e.target.value)}
              placeholder="起始..."
              className="char-edit-input"
            />
          </div>
          <div className="emo-field">
            <label className="emo-label">高潮表情</label>
            <input
              value={data.expression_peak}
              onChange={e => update('expression_peak', e.target.value)}
              placeholder="高潮..."
              className="char-edit-input"
            />
          </div>
          <div className="emo-field">
            <label className="emo-label">结束表情</label>
            <input
              value={data.expression_end}
              onChange={e => update('expression_end', e.target.value)}
              placeholder="结束..."
              className="char-edit-input"
            />
          </div>
        </div>

        {/* 肢体语言 */}
        <div className="emo-field">
          <label className="emo-label">肢体语言</label>
          <input
            value={data.body_language}
            onChange={e => update('body_language', e.target.value)}
            placeholder="如：双手握拳，身体前倾"
            className="char-edit-input"
          />
        </div>

        {/* 变化方向 */}
        <div className="emo-transition-row">
          <span className="emo-transition-label">变化:</span>
          {transitions.map(t => (
            <label key={t.id} className="emo-radio-label">
              <input
                type="radio"
                name={`transition-${emotion.shot_id}-${emotion.character_id}`}
                value={t.id}
                checked={data.emotion_transition === t.id}
                onChange={() => update('emotion_transition', t.id)}
              />
              {t.zh}
            </label>
          ))}
        </div>
      </div>
    </div>
  )
}
