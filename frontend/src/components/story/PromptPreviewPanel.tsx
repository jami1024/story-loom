import { useState } from 'react'
import type { StoryProject } from '../../types/story'
import { generatePrompts, generateVideo, updateShot } from '../../services/api'

interface PromptPreviewPanelProps {
  project: StoryProject
  onRefresh: () => void
}

export default function PromptPreviewPanel({ project, onRefresh }: PromptPreviewPanelProps) {
  const [generating, setGenerating] = useState(false)
  const [generatingShot, setGeneratingShot] = useState<number | null>(null)
  const [editingPrompt, setEditingPrompt] = useState<{ shotId: number; prompt: string } | null>(null)
  const [genError, setGenError] = useState<string | null>(null)

  const shots = project.shots || []
  const hasPrompts = shots.some(s => s.video_prompt)
  const promptReadyCount = shots.filter(s => !!s.video_prompt).length
  const videoReadyCount = shots.filter(s => !!s.video_url).length
  const videoGeneratingCount = shots.filter(s => s.status === 'generating').length
  const videoPendingCount = Math.max(promptReadyCount - videoReadyCount - videoGeneratingCount, 0)

  const handleGeneratePrompts = async () => {
    setGenerating(true)
    setGenError(null)
    try {
      await generatePrompts(project.id)
      onRefresh()
    } catch (e) {
      setGenError(e instanceof Error ? e.message : '组装 Prompt 失败')
    } finally {
      setGenerating(false)
    }
  }

  const handleGenerateVideo = async (shotId: number) => {
    setGeneratingShot(shotId)
    setGenError(null)
    try {
      await generateVideo(shotId)
      onRefresh()
    } catch (e) {
      setGenError(e instanceof Error ? e.message : '视频生成失败')
    } finally {
      setGeneratingShot(null)
    }
  }

  const handleSavePrompt = async (shotId: number, prompt: string) => {
    try {
      await updateShot(shotId, { video_prompt: prompt })
      setEditingPrompt(null)
      onRefresh()
    } catch (e) {
      setGenError(e instanceof Error ? e.message : '保存 Prompt 失败')
    }
  }

  return (
    <div className="prompt-workspace">
      {/* 顶部工具栏 */}
      <div className="prompt-toolbar">
        <div>
          <h2 className="prompt-toolbar-title">Prompt 预览与视频生成</h2>
          <p className="prompt-toolbar-note">
            先批量组装 Prompt，再按镜头提交生成任务，可随时回看状态并重试。
          </p>
        </div>
        <button
          onClick={handleGeneratePrompts}
          disabled={generating}
          className={`btn btn-primary ${generating ? 'btn-loading' : ''}`}
        >
          {generating ? (
            <span className="btn-loading-content">
              <span className="spinner" aria-hidden="true" />
              组装中...
            </span>
          ) : hasPrompts ? '重新组装 Prompt' : '组装全部 Prompt'}
        </button>
      </div>

      {/* 统计面板 */}
      <div className="prompt-metrics">
        <article className="prompt-metric-card">
          <span>已组装</span>
          <strong>{promptReadyCount}<small>/{shots.length}</small></strong>
        </article>
        <article className="prompt-metric-card prompt-metric-done">
          <span>视频完成</span>
          <strong>{videoReadyCount}</strong>
        </article>
        <article className="prompt-metric-card prompt-metric-running">
          <span>生成中</span>
          <strong>{videoGeneratingCount}</strong>
        </article>
        <article className="prompt-metric-card prompt-metric-pending">
          <span>待提交</span>
          <strong>{videoPendingCount}</strong>
        </article>
      </div>

      {/* 错误提示 */}
      {genError && (
        <div className="gen-error-banner">
          <span>{genError}</span>
          <button onClick={() => setGenError(null)} className="gen-error-close">&times;</button>
        </div>
      )}

      {/* 空状态 */}
      {!hasPrompts && (
        <div className="prompt-empty-state">
          <div className="prompt-empty-icon">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="36" height="36">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-8.625 0V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125c0 .621.504 1.125 1.125 1.125M2.25 5.625c0-.621.504-1.125 1.125-1.125h17.25c.621 0 1.125.504 1.125 1.125v12.75c0 .621-.504 1.125-1.125 1.125M12 10.5l4.5 3-4.5 3v-6z" />
            </svg>
          </div>
          <h3>尚未生成镜头 Prompt</h3>
          <p>点击上方按钮后，系统会基于分镜自动生成视频描述，可逐条编辑后再提交视频任务。</p>
        </div>
      )}

      {/* 镜头列表 */}
      {hasPrompts && (
        <div className="prompt-shot-list">
          {shots.map(shot => (
            <div key={shot.id} className={`prompt-shot-card ${shot.video_url ? 'prompt-shot-completed' : ''}`}>
              <div className="prompt-shot-header">
                <div className="prompt-shot-meta">
                  <span className="prompt-shot-number">#{shot.shot_number}</span>
                  <span className="prompt-shot-title">{shot.title}</span>
                  {shot.video_url && (
                    <span className="prompt-status-badge prompt-status-done">已完成</span>
                  )}
                  {!shot.video_url && shot.status === 'generating' && (
                    <span className="prompt-status-badge prompt-status-running">
                      <span className="spinner" style={{ width: 10, height: 10 }} />
                      生成中
                    </span>
                  )}
                  {shot.video_prompt && !shot.video_url && shot.status !== 'generating' && (
                    <span className="prompt-status-badge prompt-status-ready">可提交</span>
                  )}
                </div>
                {shot.video_prompt && (
                  <span className={`prompt-char-count ${shot.video_prompt.length > 95 ? 'prompt-char-over' : ''}`}>
                    {shot.video_prompt.length}/95
                  </span>
                )}
              </div>

              <div className="prompt-shot-body">
                {editingPrompt?.shotId === shot.id ? (
                  <div className="prompt-edit-area">
                    <textarea
                      value={editingPrompt.prompt}
                      onChange={e => setEditingPrompt({ shotId: shot.id, prompt: e.target.value })}
                      rows={3}
                      className="form-control form-control-textarea prompt-edit-input"
                      autoFocus
                    />
                    <div className="prompt-edit-actions">
                      <button onClick={() => handleSavePrompt(shot.id, editingPrompt.prompt)} className="btn btn-primary btn-sm">保存</button>
                      <button onClick={() => setEditingPrompt(null)} className="btn btn-ghost btn-sm">取消</button>
                    </div>
                  </div>
                ) : (
                  <p
                    className="prompt-shot-text"
                    onClick={() => setEditingPrompt({ shotId: shot.id, prompt: shot.video_prompt || '' })}
                  >
                    {shot.video_prompt || '(未生成 — 点击编辑)'}
                  </p>
                )}
              </div>

              <div className="prompt-shot-footer">
                {shot.video_url ? (
                  <a href={shot.video_url} target="_blank" rel="noopener noreferrer" className="prompt-video-link">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="14" height="14">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    查看视频
                  </a>
                ) : shot.video_prompt && shot.status !== 'generating' ? (
                  <button
                    onClick={() => handleGenerateVideo(shot.id)}
                    disabled={generatingShot === shot.id}
                    className={`btn btn-primary btn-sm ${generatingShot === shot.id ? 'btn-loading' : ''}`}
                  >
                    {generatingShot === shot.id ? (
                      <span className="btn-loading-content">
                        <span className="spinner" style={{ width: 12, height: 12 }} />
                        提交中...
                      </span>
                    ) : '提交生成'}
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
