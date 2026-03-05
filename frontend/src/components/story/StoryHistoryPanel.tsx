import { useState, useEffect, useCallback } from 'react'
import type { StoryProject } from '../../types/story'
import type { SubmittedParseTask } from './StoryInputPanel'
import { getProjects, deleteProject } from '../../services/api'

interface StoryHistoryPanelProps {
  parseTasks: SubmittedParseTask[]
  onOpenProject: (projectId: number) => void
}

type FilterKey = 'all' | 'draft' | 'parsed' | 'ready' | 'completed' | 'failed'

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'draft', label: '草稿' },
  { key: 'parsed', label: '已解析' },
  { key: 'ready', label: '可生成' },
  { key: 'completed', label: '已完成' },
  { key: 'failed', label: '失败' },
]

const STATUS_LABEL: Record<string, string> = {
  draft: '草稿',
  parsed: '已解析',
  ready: '可生成',
  completed: '已完成',
  failed: '失败',
}

export default function StoryHistoryPanel({ parseTasks, onOpenProject }: StoryHistoryPanelProps) {
  const [projects, setProjects] = useState<StoryProject[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterKey>('all')
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const loadProjects = useCallback(async () => {
    try {
      const data = await getProjects(50, 0)
      setProjects(data.projects)
    } catch (e) {
      console.error('加载项目列表失败:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadProjects()
  }, [loadProjects])

  // Auto-refresh when a parse task completes
  useEffect(() => {
    const hasJustCompleted = parseTasks.some(t => t.status === 'completed')
    if (hasJustCompleted) {
      void loadProjects()
    }
  }, [parseTasks, loadProjects])

  const handleDelete = async (id: number) => {
    try {
      await deleteProject(id)
      setProjects(prev => prev.filter(p => p.id !== id))
    } catch (e) {
      console.error('删除项目失败:', e)
    } finally {
      setDeletingId(null)
    }
  }

  const filtered = filter === 'all'
    ? projects
    : projects.filter(p => p.status === filter)

  const getParseTask = (projectId: number) =>
    parseTasks.find(t => t.projectId === projectId && (t.status === 'pending' || t.status === 'processing'))

  return (
    <div className="story-history">
      <div className="story-history__header">
        <h2>创作历史</h2>
        <span className="story-history__count">{projects.length} 个项目</span>
      </div>

      <div className="story-history__filters">
        {FILTERS.map(f => (
          <button
            key={f.key}
            type="button"
            className={`story-history__filter-pill ${filter === f.key ? 'story-history__filter-pill--active' : ''}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="story-history__empty">加载中...</div>
      ) : filtered.length === 0 ? (
        <div className="story-history__empty">
          <p>{filter === 'all' ? '还没有创作项目，去工作台开始你的第一个故事吧' : '没有匹配的项目'}</p>
        </div>
      ) : (
        <div className="story-history__list">
          {filtered.map(project => {
            const activeTask = getParseTask(project.id)
            const statusLabel = STATUS_LABEL[project.status] || project.status

            return (
              <article className="story-history__card" key={project.id}>
                <div className="story-history__card-header">
                  <strong>{project.title}</strong>
                  <span className={`story-submit-status story-submit-status-${project.status}`}>
                    {statusLabel}
                  </span>
                </div>

                <div className="story-history__card-meta">
                  {project.genre && <span className="story-history__tag">{project.genre}</span>}
                  {project.style && <span className="story-history__tag">{project.style}</span>}
                  {project.created_at && (
                    <span className="story-history__date">
                      {new Date(project.created_at).toLocaleDateString('zh-CN')}
                    </span>
                  )}
                </div>

                <div className="story-history__card-stats">
                  <span>{project.character_count ?? project.characters?.length ?? 0} 角色</span>
                  <span className="story-topbar-dot">&middot;</span>
                  <span>{project.scene_count ?? project.scenes?.length ?? 0} 场景</span>
                  <span className="story-topbar-dot">&middot;</span>
                  <span>{project.shot_count ?? project.shots?.length ?? 0} 分镜</span>
                </div>

                {activeTask && (
                  <div className="story-history__card-progress">
                    <div className="story-submit-progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(activeTask.progress * 100)}>
                      <span style={{ width: `${Math.round(activeTask.progress * 100)}%` }} />
                    </div>
                    <p className="story-submit-message">{activeTask.message || '解析中...'}</p>
                  </div>
                )}

                <div className="story-history__card-actions">
                  <button
                    type="button"
                    className="btn btn-secondary story-history__open-btn"
                    onClick={() => onOpenProject(project.id)}
                  >
                    打开工作台
                  </button>

                  {deletingId === project.id ? (
                    <div className="story-history__delete-confirm">
                      <span>确认删除？</span>
                      <button
                        type="button"
                        className="btn story-history__confirm-yes"
                        onClick={() => handleDelete(project.id)}
                      >
                        删除
                      </button>
                      <button
                        type="button"
                        className="btn story-history__confirm-no"
                        onClick={() => setDeletingId(null)}
                      >
                        取消
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="btn story-history__delete-btn"
                      onClick={() => setDeletingId(project.id)}
                    >
                      删除
                    </button>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
