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

  const shots = project.shots || []
  const hasPrompts = shots.some(s => s.video_prompt)

  const handleGeneratePrompts = async () => {
    setGenerating(true)
    try {
      await generatePrompts(project.id)
      onRefresh()
    } catch (e) {
      console.error('组装 Prompt 失败:', e)
    } finally {
      setGenerating(false)
    }
  }

  const handleGenerateVideo = async (shotId: number) => {
    setGeneratingShot(shotId)
    try {
      await generateVideo(shotId)
      onRefresh()
    } catch (e) {
      console.error('视频生成失败:', e)
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
      console.error('保存 Prompt 失败:', e)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Prompt 预览与视频生成</h2>
        <button
          onClick={handleGeneratePrompts}
          disabled={generating}
          className="px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800 disabled:opacity-50"
        >
          {generating ? '组装中...' : hasPrompts ? '重新组装 Prompt' : '组装全部 Prompt'}
        </button>
      </div>

      {!hasPrompts && (
        <div className="text-center text-gray-400 py-16">
          点击"组装全部 Prompt"按钮，自动为每个分镜生成视频描述
        </div>
      )}

      {hasPrompts && (
        <div className="space-y-3">
          {shots.map(shot => (
            <div key={shot.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-mono text-gray-400">#{shot.shot_number}</span>
                    <span className="text-sm font-medium text-gray-900">{shot.title}</span>
                    {shot.video_prompt && (
                      <span className={`text-xs px-1.5 py-0.5 rounded ${
                        shot.video_prompt.length <= 95
                          ? 'bg-green-50 text-green-600'
                          : 'bg-red-50 text-red-600'
                      }`}>
                        {shot.video_prompt.length}/95字
                      </span>
                    )}
                  </div>

                  {editingPrompt?.shotId === shot.id ? (
                    <div className="space-y-2">
                      <textarea
                        value={editingPrompt.prompt}
                        onChange={e => setEditingPrompt({ shotId: shot.id, prompt: e.target.value })}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSavePrompt(shot.id, editingPrompt.prompt)}
                          className="px-3 py-1 bg-gray-900 text-white text-xs rounded hover:bg-gray-800"
                        >
                          保存
                        </button>
                        <button
                          onClick={() => setEditingPrompt(null)}
                          className="px-3 py-1 text-gray-500 text-xs hover:text-gray-700"
                        >
                          取消
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p
                      onClick={() => setEditingPrompt({ shotId: shot.id, prompt: shot.video_prompt || '' })}
                      className="text-sm text-gray-600 leading-relaxed cursor-pointer hover:text-gray-900 transition-colors"
                    >
                      {shot.video_prompt || '(未生成)'}
                    </p>
                  )}
                </div>

                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  {shot.video_url ? (
                    <div className="space-y-1">
                      <span className="text-xs text-green-600 font-medium">已完成</span>
                      <a
                        href={shot.video_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-xs text-blue-600 hover:underline"
                      >
                        查看视频
                      </a>
                    </div>
                  ) : shot.status === 'generating' ? (
                    <span className="text-xs text-amber-600 flex items-center gap-1">
                      <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      生成中
                    </span>
                  ) : shot.video_prompt ? (
                    <button
                      onClick={() => handleGenerateVideo(shot.id)}
                      disabled={generatingShot === shot.id}
                      className="px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg hover:bg-gray-800 disabled:opacity-50"
                    >
                      {generatingShot === shot.id ? '提交中...' : '生成视频'}
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
