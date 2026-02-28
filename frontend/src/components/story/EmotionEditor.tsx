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
    <div className="border border-gray-100 rounded-lg p-3 bg-gray-50">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-gray-700">{emotion.character_name}</span>
        {dirty && (
          <button
            onClick={handleSave}
            disabled={saving}
            className="text-xs px-2 py-1 bg-gray-900 text-white rounded hover:bg-gray-800 disabled:opacity-50"
          >
            {saving ? '...' : '保存'}
          </button>
        )}
      </div>

      <div className="space-y-2">
        {/* 情绪标签 + 强度 */}
        <div className="flex gap-3 items-center">
          <div className="flex-1">
            <label className="text-xs text-gray-500">情绪</label>
            <select
              value={data.emotion_tag}
              onChange={e => update('emotion_tag', e.target.value)}
              className="w-full px-2 py-1 border border-gray-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-gray-400"
            >
              {tags.map(t => (
                <option key={t.id} value={t.id}>{t.zh} ({t.en})</option>
              ))}
            </select>
          </div>
          <div className="w-32">
            <label className="text-xs text-gray-500">强度 {data.emotion_intensity}/5</label>
            <input
              type="range"
              min={1}
              max={5}
              value={data.emotion_intensity}
              onChange={e => update('emotion_intensity', parseInt(e.target.value))}
              className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-gray-900"
            />
          </div>
        </div>

        {/* 表情描述 */}
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="text-xs text-gray-500">起始表情</label>
            <input
              value={data.expression_start}
              onChange={e => update('expression_start', e.target.value)}
              placeholder="起始..."
              className="w-full px-2 py-1 border border-gray-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-gray-400"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500">高潮表情</label>
            <input
              value={data.expression_peak}
              onChange={e => update('expression_peak', e.target.value)}
              placeholder="高潮..."
              className="w-full px-2 py-1 border border-gray-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-gray-400"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500">结束表情</label>
            <input
              value={data.expression_end}
              onChange={e => update('expression_end', e.target.value)}
              placeholder="结束..."
              className="w-full px-2 py-1 border border-gray-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-gray-400"
            />
          </div>
        </div>

        {/* 肢体语言 */}
        <div>
          <label className="text-xs text-gray-500">肢体语言</label>
          <input
            value={data.body_language}
            onChange={e => update('body_language', e.target.value)}
            placeholder="如：双手握拳，身体前倾"
            className="w-full px-2 py-1 border border-gray-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-gray-400"
          />
        </div>

        {/* 变化方向 */}
        <div className="flex gap-3 items-center">
          <span className="text-xs text-gray-500">变化:</span>
          {transitions.map(t => (
            <label key={t.id} className="flex items-center gap-1 text-xs text-gray-600 cursor-pointer">
              <input
                type="radio"
                name={`transition-${emotion.shot_id}-${emotion.character_id}`}
                value={t.id}
                checked={data.emotion_transition === t.id}
                onChange={() => update('emotion_transition', t.id)}
                className="w-3 h-3 accent-gray-900"
              />
              {t.zh}
            </label>
          ))}
        </div>
      </div>
    </div>
  )
}
