import { useState } from 'react'
import type { StoryProject } from '../../types/story'
import { createProject, parseProject } from '../../services/api'

interface StoryInputPanelProps {
  project: StoryProject | null
  onProjectCreated: (p: StoryProject) => void
  onParsed: (projectId: number) => void
}

const GENRES = ['武侠', '科幻', '爱情', '悬疑', '喜剧', '恐怖', '奇幻', '历史', '都市']
const STYLES = [
  { value: 'cinematic', label: '电影感' },
  { value: 'anime', label: '动漫风' },
  { value: 'ghibli', label: '吉卜力' },
  { value: 'cyberpunk', label: '赛博朋克' },
  { value: 'watercolor', label: '水彩画' },
  { value: 'ink', label: '水墨画' },
  { value: 'guoman', label: '国漫' },
]

export default function StoryInputPanel({ project, onProjectCreated, onParsed }: StoryInputPanelProps) {
  const [title, setTitle] = useState(project?.title || '')
  const [storyText, setStoryText] = useState(project?.story_text || '')
  const [genre, setGenre] = useState(project?.genre || '')
  const [style, setStyle] = useState(project?.style || 'cinematic')
  const [llmProvider, setLlmProvider] = useState(project?.llm_provider || 'deepseek')
  const [parsing, setParsing] = useState(false)
  const [error, setError] = useState('')
  const [parseResult, setParseResult] = useState<string>('')

  const handleParse = async () => {
    if (!storyText.trim() || storyText.trim().length < 10) {
      setError('故事文本至少需要10个字符')
      return
    }

    setError('')
    setParsing(true)
    setParseResult('')

    try {
      // 如果还没有项目，先创建
      let currentProject = project
      if (!currentProject) {
        currentProject = await createProject({
          title: title || '未命名故事',
          story_text: storyText,
          genre: genre || undefined,
          style,
          llm_provider: llmProvider,
        })
        onProjectCreated(currentProject)
      }

      // 触发解析
      const result = await parseProject(currentProject.id)
      setParseResult(
        `解析完成: ${result.character_count} 个角色, ${result.scene_count} 个场景, ${result.shot_count} 个分镜, ${result.emotion_count} 条情绪`
      )

      // 通知父组件
      onParsed(currentProject.id)
    } catch (e) {
      setError(e instanceof Error ? e.message : '解析失败')
    } finally {
      setParsing(false)
    }
  }

  const isParsed = project?.status && project.status !== 'draft'

  return (
    <div className="space-y-6">
      {/* 标题 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">项目标题</label>
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="给你的故事起个名字..."
          disabled={!!isParsed}
          className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
        />
      </div>

      {/* 故事文本 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          故事文本
          <span className="text-gray-400 font-normal ml-2">{storyText.length} 字</span>
        </label>
        <textarea
          value={storyText}
          onChange={e => setStoryText(e.target.value)}
          placeholder="在这里输入或粘贴你的故事文本（支持最多5万字）..."
          disabled={!!isParsed}
          rows={16}
          className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
        />
      </div>

      {/* 配置选项 */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">故事类型</label>
          <select
            value={genre}
            onChange={e => setGenre(e.target.value)}
            disabled={!!isParsed}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 disabled:bg-gray-50"
          >
            <option value="">选择类型</option>
            {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">视觉风格</label>
          <select
            value={style}
            onChange={e => setStyle(e.target.value)}
            disabled={!!isParsed}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 disabled:bg-gray-50"
          >
            {STYLES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">LLM 模型</label>
          <select
            value={llmProvider}
            onChange={e => setLlmProvider(e.target.value)}
            disabled={!!isParsed}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 disabled:bg-gray-50"
          >
            <option value="deepseek">DeepSeek</option>
            <option value="zhipu">智谱 GLM</option>
          </select>
        </div>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {/* 解析结果 */}
      {parseResult && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
          {parseResult}
        </div>
      )}

      {/* 解析按钮 */}
      {!isParsed && (
        <button
          onClick={handleParse}
          disabled={parsing || !storyText.trim()}
          className={`
            w-full py-3 rounded-lg text-sm font-medium transition-all
            ${parsing
              ? 'bg-gray-200 text-gray-500 cursor-wait'
              : 'bg-gray-900 text-white hover:bg-gray-800 active:bg-gray-700'
            }
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
        >
          {parsing ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              AI 正在解析中，请耐心等待...
            </span>
          ) : (
            '开始解析'
          )}
        </button>
      )}

      {isParsed && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
          故事已解析完成，请使用左侧步骤导航查看和编辑角色、场景、分镜数据。
        </div>
      )}
    </div>
  )
}
