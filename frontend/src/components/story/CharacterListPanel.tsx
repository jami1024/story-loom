import { useState } from 'react'
import type { StoryCharacter } from '../../types/story'
import { updateCharacter, generateCharacterImage, generateAllCharacterImages } from '../../services/api'

interface CharacterListPanelProps {
  characters: StoryCharacter[]
  projectId: number
  onRefresh: () => void
}

export default function CharacterListPanel({ characters, projectId, onRefresh }: CharacterListPanelProps) {
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editData, setEditData] = useState<Partial<StoryCharacter>>({})
  const [saving, setSaving] = useState(false)
  const [generatingIds, setGeneratingIds] = useState<Set<number>>(new Set())
  const [batchGenerating, setBatchGenerating] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const startEdit = (char: StoryCharacter) => {
    setEditingId(char.id)
    setEditData({
      name: char.name,
      gender: char.gender,
      age: char.age,
      role: char.role,
      personality: char.personality,
      appearance_brief: char.appearance_brief,
      default_emotion: char.default_emotion,
    })
  }

  const handleSave = async () => {
    if (!editingId) return
    setSaving(true)
    try {
      await updateCharacter(editingId, editData)
      setEditingId(null)
      onRefresh()
    } catch (e) {
      console.error('保存失败:', e)
    } finally {
      setSaving(false)
    }
  }

  const handleGenerateImage = async (charId: number, e: React.MouseEvent) => {
    e.stopPropagation()
    setGeneratingIds(prev => new Set(prev).add(charId))
    try {
      await generateCharacterImage(charId)
      onRefresh()
    } catch (err) {
      console.error('图片生成失败:', err)
    } finally {
      setGeneratingIds(prev => {
        const next = new Set(prev)
        next.delete(charId)
        return next
      })
    }
  }

  const handleBatchGenerate = async () => {
    setBatchGenerating(true)
    try {
      await generateAllCharacterImages(projectId)
      onRefresh()
    } catch (err) {
      console.error('批量生成失败:', err)
    } finally {
      setBatchGenerating(false)
    }
  }

  const roleLabels: Record<string, string> = {
    protagonist: '主角',
    supporting: '配角',
    minor: '次要',
  }

  if (!characters.length) {
    return <div className="text-center text-gray-400 py-16">暂无角色数据</div>
  }

  const isGenerating = (char: StoryCharacter) =>
    generatingIds.has(char.id) || char.image_status === 'generating'

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">角色列表 ({characters.length})</h2>
        <button
          onClick={handleBatchGenerate}
          disabled={batchGenerating}
          className="px-4 py-1.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {batchGenerating ? (
            <span className="flex items-center gap-1.5">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              批量生成中...
            </span>
          ) : '批量生成所有角色图片'}
        </button>
      </div>

      {/* 图片预览弹窗 */}
      {previewUrl && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-8"
          onClick={() => setPreviewUrl(null)}
        >
          <div className="relative max-w-2xl max-h-[80vh]">
            <img
              src={previewUrl}
              alt="角色图片预览"
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {characters.map(char => (
          <div key={char.id} className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
            {editingId === char.id ? (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  <input
                    value={editData.name || ''}
                    onChange={e => setEditData(d => ({ ...d, name: e.target.value }))}
                    placeholder="角色名"
                    className="px-2 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
                  />
                  <select
                    value={editData.gender || ''}
                    onChange={e => setEditData(d => ({ ...d, gender: e.target.value }))}
                    className="px-2 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
                  >
                    <option value="">性别</option>
                    <option value="male">男</option>
                    <option value="female">女</option>
                    <option value="other">其他</option>
                  </select>
                  <input
                    value={editData.age || ''}
                    onChange={e => setEditData(d => ({ ...d, age: e.target.value }))}
                    placeholder="年龄"
                    className="px-2 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
                  />
                </div>
                <select
                  value={editData.role || ''}
                  onChange={e => setEditData(d => ({ ...d, role: e.target.value }))}
                  className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
                >
                  <option value="protagonist">主角</option>
                  <option value="supporting">配角</option>
                  <option value="minor">次要</option>
                </select>
                <textarea
                  value={editData.personality || ''}
                  onChange={e => setEditData(d => ({ ...d, personality: e.target.value }))}
                  placeholder="性格特点"
                  rows={2}
                  className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm resize-none focus:outline-none focus:ring-1 focus:ring-gray-400"
                />
                <textarea
                  value={editData.appearance_brief || ''}
                  onChange={e => setEditData(d => ({ ...d, appearance_brief: e.target.value }))}
                  placeholder="外貌简述"
                  rows={2}
                  className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm resize-none focus:outline-none focus:ring-1 focus:ring-gray-400"
                />
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
              <div className="flex gap-4">
                {/* 左侧：图片区域 */}
                <div className="flex-shrink-0 w-24">
                  {isGenerating(char) ? (
                    <div className="w-24 h-24 rounded-lg bg-gray-100 flex flex-col items-center justify-center">
                      <svg className="animate-spin h-6 w-6 text-indigo-500 mb-1" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      <span className="text-xs text-gray-400">生成中</span>
                    </div>
                  ) : char.image_url ? (
                    <div className="relative group">
                      <img
                        src={char.image_url}
                        alt={char.name}
                        className="w-24 h-24 rounded-lg object-cover cursor-pointer border border-gray-200 hover:border-indigo-300 transition-colors"
                        onClick={(e) => { e.stopPropagation(); setPreviewUrl(char.image_url) }}
                      />
                      <button
                        onClick={(e) => handleGenerateImage(char.id, e)}
                        className="absolute -bottom-1 -right-1 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-400 hover:text-indigo-600 hover:border-indigo-300 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                        title="重新生成"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={(e) => handleGenerateImage(char.id, e)}
                      className="w-24 h-24 rounded-lg border-2 border-dashed border-gray-200 hover:border-indigo-300 flex flex-col items-center justify-center text-gray-400 hover:text-indigo-500 transition-colors"
                      title="生成角色图片"
                    >
                      <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                      </svg>
                      <span className="text-xs">生成图片</span>
                    </button>
                  )}
                </div>

                {/* 右侧：角色信息 */}
                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => startEdit(char)}>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-900">{char.name}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      char.role === 'protagonist'
                        ? 'bg-amber-100 text-amber-700'
                        : char.role === 'supporting'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-600'
                    }`}>
                      {roleLabels[char.role || ''] || char.role}
                    </span>
                  </div>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p>{char.gender === 'male' ? '男' : char.gender === 'female' ? '女' : char.gender} | {char.age}</p>
                    {char.personality && <p className="text-gray-500 line-clamp-1">{char.personality}</p>}
                    {char.appearance_brief && <p className="text-gray-400 text-xs line-clamp-2">{char.appearance_brief}</p>}
                  </div>
                  <p className="text-xs text-gray-300 mt-2">点击编辑</p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
