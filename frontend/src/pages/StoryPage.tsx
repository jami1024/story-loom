import { useState, useEffect, useCallback } from 'react'
import type { StoryProject, EmotionPresets } from '../types/story'
import { getProjectDetail, getEmotionPresets, getParseStatus } from '../services/api'
import StepNav from '../components/story/StepNav'
import StoryInputPanel, { type SubmittedParseTask } from '../components/story/StoryInputPanel'
import ParseOverviewDashboard from '../components/story/ParseOverviewDashboard'
import CharacterListPanel from '../components/story/CharacterListPanel'
import SceneListPanel from '../components/story/SceneListPanel'
import ShotListPanel from '../components/story/ShotListPanel'
import PromptPreviewPanel from '../components/story/PromptPreviewPanel'
import StoryHistoryPanel from '../components/story/StoryHistoryPanel'
import './StoryPage.css'

const POLL_INTERVAL_MS = 2000

const STEP_CONTENT: Record<number, { title: string; description: string }> = {
  1: {
    title: '输入故事与基础设定',
    description: '先定义故事文本、风格和模型通道，系统会自动完成初次解析。',
  },
  2: {
    title: '角色资产整理',
    description: '核对角色设定并补全形象信息，确保后续镜头表现稳定。',
  },
  3: {
    title: '场景锚点校准',
    description: '统一地点、光影和氛围描述，为分镜与视频生成建立视觉基线。',
  },
  4: {
    title: '分镜与情绪编排',
    description: '微调动作、景别和角色情绪，提升镜头叙事与节奏控制。',
  },
  5: {
    title: 'Prompt 预览与生成',
    description: '检查每个分镜 Prompt 后提交生成任务，追踪结果并回看视频。',
  },
}

export default function StoryPage() {
  const [step, setStep] = useState(1)
  const [project, setProject] = useState<StoryProject | null>(null)
  const [presets, setPresets] = useState<EmotionPresets | null>(null)
  const [forceInputView, setForceInputView] = useState(false)
  const [parseTasks, setParseTasks] = useState<SubmittedParseTask[]>([])
  const [trayOpen, setTrayOpen] = useState(true)
  const [activeTab, setActiveTab] = useState<'workspace' | 'history'>('workspace')

  const isParsedProject = !!project?.status && !['draft', 'failed'].includes(project.status)

  useEffect(() => {
    getEmotionPresets().then(setPresets).catch(console.error)
  }, [])

  const refreshProject = useCallback(async (id?: number) => {
    const pid = id ?? project?.id
    if (!pid) return
    try {
      const detail = await getProjectDetail(pid)
      setProject(detail)
    } catch (e) {
      console.error('刷新项目失败:', e)
    }
  }, [project?.id])

  const handleParsed = useCallback(async (projectId: number) => {
    await refreshProject(projectId)
    setForceInputView(false)
  }, [refreshProject])

  const handleTaskSubmitted = useCallback((task: SubmittedParseTask) => {
    setParseTasks(prev => {
      const deduped = prev.filter(item => !(item.taskId === task.taskId && item.projectId === task.projectId))
      return [task, ...deduped]
    })
  }, [])

  const handleOpenTaskWorkspace = useCallback((projectId: number) => {
    setStep(1)
    void handleParsed(projectId)
  }, [handleParsed])

  const handleOpenProjectFromHistory = useCallback(async (projectId: number) => {
    setActiveTab('workspace')
    await refreshProject(projectId)
    setStep(1)
    setForceInputView(false)
  }, [refreshProject])

  useEffect(() => {
    const activeTasks = parseTasks.filter(task => task.status === 'pending' || task.status === 'processing')
    if (activeTasks.length === 0) return

    const timer = setInterval(() => {
      void (async () => {
        const updates = await Promise.all(
          activeTasks.map(async task => {
            try {
              const status = await getParseStatus(task.projectId, task.taskId)
              return {
                taskId: task.taskId,
                projectId: task.projectId,
                status: status.status,
                progress: status.progress,
                message: status.message || '',
                errorDetail: status.error_detail,
              }
            } catch {
              return null
            }
          }),
        )

        const validUpdates = updates.filter((item): item is NonNullable<typeof item> => item !== null)
        if (validUpdates.length === 0) return

        const hasCurrentProjectCompletion = project?.id
          ? validUpdates.some(update => update.projectId === project.id && update.status === 'completed')
          : false
        if (hasCurrentProjectCompletion && project?.id) {
          void refreshProject(project.id)
        }

        const updateMap = new Map(validUpdates.map(item => [`${item.projectId}-${item.taskId}`, item]))
        setParseTasks(prev => prev.map(task => {
          const next = updateMap.get(`${task.projectId}-${task.taskId}`)
          if (!next) return task
          return {
            ...task,
            status: next.status,
            progress: next.progress,
            message: next.message,
            errorDetail: next.errorDetail,
          }
        }))
      })()
    }, POLL_INTERVAL_MS)

    return () => clearInterval(timer)
  }, [parseTasks, project?.id, refreshProject])

  const stepsCompleted = {
    1: !!project && project.status !== 'draft',
    2: !!project?.characters?.length,
    3: !!project?.scenes?.length,
    4: !!project?.shots?.length,
    5: project?.status === 'ready' || project?.status === 'completed',
  }

  const currentStage = step === 1 && isParsedProject && !forceInputView
    ? { title: '解析总览', description: '项目已完成解析，以下是整体概览。点击各模块可跳转到对应步骤。' }
    : (STEP_CONTENT[step] || STEP_CONTENT[1])
  const completedCount = Object.values(stepsCompleted).filter(Boolean).length
  const progress = Math.round((completedCount / 5) * 100)
  const statusKey = project?.status || 'draft'
  const projectStatusLabel = {
    draft: '草稿',
    parsed: '已解析',
    ready: '可生成',
    completed: '已完成',
  }[statusKey] || '进行中'

  const activeTaskCount = parseTasks.filter(t => t.status === 'pending' || t.status === 'processing').length

  return (
    <div className="page-surface story-page">
      <header className="story-topbar">
        <div className="story-topbar-left">
          <div className="story-tab-switcher">
            <button
              type="button"
              className={`story-tab-btn ${activeTab === 'workspace' ? 'story-tab-btn--active' : ''}`}
              onClick={() => setActiveTab('workspace')}
            >
              工作台
            </button>
            <button
              type="button"
              className={`story-tab-btn ${activeTab === 'history' ? 'story-tab-btn--active' : ''}`}
              onClick={() => setActiveTab('history')}
            >
              创作历史
            </button>
          </div>
          {activeTab === 'workspace' && project && (
            <span className={`story-topbar-status story-topbar-status--${statusKey}`}>
              {projectStatusLabel}
            </span>
          )}
        </div>
        {activeTab === 'workspace' && (
          <div className="story-topbar-right">
            <div className="story-topbar-stats">
              <span>{project?.characters?.length || 0} 角色</span>
              <span className="story-topbar-dot">&middot;</span>
              <span>{project?.scenes?.length || 0} 场景</span>
              <span className="story-topbar-dot">&middot;</span>
              <span>{project?.shots?.length || 0} 分镜</span>
            </div>
            <div className="story-topbar-progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}>
              <span className="story-topbar-progress-fill" style={{ width: `${progress}%` }} />
            </div>
            <span className="story-topbar-progress-label">{progress}%</span>
          </div>
        )}
      </header>

      {activeTab === 'workspace' && (
        <>
          {isParsedProject && (
            <StepNav
              currentStep={step}
              onStepChange={setStep}
              completed={stepsCompleted}
              projectStatus={project?.status}
            />
          )}

          <main className="story-workbench">
            <div className="story-workbench-header">
              <span className="story-workbench-step-tag">Step {step}</span>
              <div className="story-workbench-header-row">
                <div>
                  <h2>{currentStage.title}</h2>
                  <p>{currentStage.description}</p>
                </div>
                {step === 1 && isParsedProject && !forceInputView && (
                  <button
                    type="button"
                    className="btn btn-ghost story-workbench-reparse-btn"
                    onClick={() => { setProject(null); setForceInputView(true) }}
                  >
                    新建解析
                  </button>
                )}
              </div>
            </div>

            <div className="story-workbench-stage">
              {step === 1 && isParsedProject && !forceInputView && (
                <ParseOverviewDashboard
                  project={project}
                  onNavigate={(s) => setStep(s)}
                  onRequestReparse={() => setForceInputView(true)}
                />
              )}
              {step === 1 && (!isParsedProject || forceInputView) && (
                <StoryInputPanel
                  project={project}
                  onTaskSubmitted={handleTaskSubmitted}
                />
              )}
              {step === 2 && project && (
                <CharacterListPanel
                  characters={project.characters || []}
                  projectId={project.id}
                  onRefresh={() => refreshProject()}
                />
              )}
              {step === 3 && project && (
                <SceneListPanel
                  scenes={project.scenes || []}
                  projectId={project.id}
                  onRefresh={() => refreshProject()}
                />
              )}
              {step === 4 && project && (
                <ShotListPanel
                  shots={project.shots || []}
                  presets={presets}
                  onRefresh={() => refreshProject()}
                />
              )}
              {step === 5 && project && (
                <PromptPreviewPanel
                  project={project}
                  onRefresh={() => refreshProject()}
                />
              )}

              {!project && step > 1 && (
                <div className="story-empty-state">
                  <span className="story-empty-state-icon">🎬</span>
                  <strong className="story-empty-state-title">尚未创建项目</strong>
                  <span className="story-empty-state-hint">请先在步骤 1 中创建项目并完成故事解析。</span>
                </div>
              )}
            </div>
          </main>
        </>
      )}

      {activeTab === 'history' && (
        <main className="story-workbench">
          <StoryHistoryPanel
            parseTasks={parseTasks}
            onOpenProject={handleOpenProjectFromHistory}
          />
        </main>
      )}

      {activeTab === 'workspace' && parseTasks.length > 0 && (
        <aside className={`story-task-tray ${trayOpen ? '' : 'story-task-tray--collapsed'}`}>
          <div className="story-task-tray-header" onClick={() => setTrayOpen(v => !v)}>
            <h3>解析队列</h3>
            <span className="story-task-tray-badge">
              {activeTaskCount} 进行中
            </span>
            <svg className={`story-task-tray-chevron ${trayOpen ? 'story-task-tray-chevron--open' : ''}`} width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="4 6 8 10 12 6" />
            </svg>
          </div>
          <div className="story-task-tray-body">
            {parseTasks.map(task => {
              const progressPercent = Math.round(task.progress * 100)
              const statusLabel = {
                pending: '排队中',
                processing: '解析中',
                completed: '已完成',
                failed: '失败',
              }[task.status] || '处理中'

              return (
                <article className="story-submit-queue-item" key={`${task.projectId}-${task.taskId}`}>
                  <div className="story-submit-queue-row">
                    <strong>{task.title}</strong>
                    <span className={`story-submit-status story-submit-status-${task.status}`}>{statusLabel}</span>
                  </div>

                  <div className="story-submit-queue-meta">
                    <span>项目 #{task.projectId}</span>
                    <span>任务 #{task.taskId}</span>
                  </div>

                  <div className="story-submit-progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progressPercent}>
                    <span style={{ width: `${progressPercent}%` }} />
                  </div>

                  <p className="story-submit-message">{task.message || '等待状态更新...'}</p>

                  {task.status === 'failed' && task.errorDetail && (
                    <p className="story-submit-error">{task.errorDetail}</p>
                  )}

                  {task.status === 'completed' && (
                    <button
                      type="button"
                      className="btn btn-secondary story-submit-open-btn"
                      onClick={() => handleOpenTaskWorkspace(task.projectId)}
                    >
                      打开工作台
                    </button>
                  )}
                </article>
              )
            })}
          </div>
        </aside>
      )}
    </div>
  )
}
