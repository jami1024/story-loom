import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
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
      setGenError(err instanceof Error ? err.message : '图片生成失败')
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
      setGenError(err instanceof Error ? err.message : '批量生成失败')
    } finally {
      setBatchGenerating(false)
    }
  }

  const roleLabels: Record<string, string> = {
    protagonist: '主角',
    supporting: '配角',
    minor: '次要',
  }

  const roleBadgeClass = (role?: string | null) => {
    switch (role) {
      case 'protagonist': return 'char-role-badge char-role-protagonist'
      case 'supporting': return 'char-role-badge char-role-supporting'
      default: return 'char-role-badge char-role-minor'
    }
  }

  if (!characters.length) {
    return <div className="char-empty">暂无角色数据</div>
  }

  const isGenerating = (char: StoryCharacter) =>
    generatingIds.has(char.id) || char.image_status === 'generating'

  return (
    <div>
      <div className="char-panel-header">
        <h2>角色列表 ({characters.length})</h2>
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
          ) : '批量生成所有角色图片'}
        </button>
      </div>

      {genError && (
        <div className="gen-error-banner">
          <span>{genError}</span>
          <button onClick={() => setGenError(null)} className="gen-error-close">&times;</button>
        </div>
      )}

      {/* 图片预览弹窗 — Portal 到 body 避免被父容器裁切 */}
      {previewUrl && createPortal(
        <div className="char-preview-overlay" onClick={() => setPreviewUrl(null)}>
          <div className="char-preview-container" onClick={e => e.stopPropagation()}>
            <img src={previewUrl} alt="角色图片预览" className="char-preview-img" />
            <button className="char-preview-close" onClick={() => setPreviewUrl(null)}>
              &times;
            </button>
          </div>
        </div>,
        document.body,
      )}

      <div className="char-grid">
        {characters.map(char => (
          <div key={char.id} className="char-card">
            {editingId === char.id ? (
              <div className="char-edit-form">
                <div className="char-edit-row">
                  <input
                    value={editData.name || ''}
                    onChange={e => setEditData(d => ({ ...d, name: e.target.value }))}
                    placeholder="角色名"
                    className="char-edit-input"
                  />
                  <select
                    value={editData.gender || ''}
                    onChange={e => setEditData(d => ({ ...d, gender: e.target.value }))}
                    className="char-edit-select"
                  >
                    <option value="">性别</option>
                    <option value="male">男</option>
                    <option value="female">女</option>
                    <option value="animal">动物</option>
                    <option value="other">其他</option>
                  </select>
                  <input
                    value={editData.age || ''}
                    onChange={e => setEditData(d => ({ ...d, age: e.target.value }))}
                    placeholder="年龄"
                    className="char-edit-input"
                  />
                </div>
                <select
                  value={editData.role || ''}
                  onChange={e => setEditData(d => ({ ...d, role: e.target.value }))}
                  className="char-edit-select"
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
                  className="char-edit-textarea"
                />
                <textarea
                  value={editData.appearance_brief || ''}
                  onChange={e => setEditData(d => ({ ...d, appearance_brief: e.target.value }))}
                  placeholder="外貌简述"
                  rows={2}
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
              <div className="char-card-display" onClick={() => startEdit(char)}>
                {/* 左侧：图片区域 */}
                <div className="char-avatar">
                  {isGenerating(char) ? (
                    <div className="char-avatar-loading">
                      <svg className="animate-spin" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      <span>生成中</span>
                    </div>
                  ) : char.image_url ? (
                    <>
                      <img
                        src={char.image_url}
                        alt={char.name}
                        className="char-avatar-img"
                        onClick={(e) => { e.stopPropagation(); setPreviewUrl(char.image_url) }}
                      />
                      <button
                        onClick={(e) => handleGenerateImage(char.id, e)}
                        className="char-avatar-regen"
                        title="重新生成"
                      >
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={(e) => handleGenerateImage(char.id, e)}
                      className="char-avatar-empty"
                      title="生成角色图片"
                    >
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                      </svg>
                      <span>生成图片</span>
                    </button>
                  )}
                </div>

                {/* 右侧：角色信息 */}
                <div className="char-info">
                  <div className="char-info-header">
                    <span className="char-name">{char.name}</span>
                    <span className={roleBadgeClass(char.role)}>
                      {roleLabels[char.role || ''] || char.role}
                    </span>
                  </div>
                  <p className="char-meta">
                    {char.gender === 'male' ? '男' : char.gender === 'female' ? '女' : char.gender === 'animal' ? '动物' : char.gender} | {char.age}
                  </p>
                  {char.personality && <p className="char-personality">{char.personality}</p>}
                  {char.appearance_brief && <p className="char-appearance">{char.appearance_brief}</p>}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
