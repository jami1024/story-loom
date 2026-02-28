import { useState, useEffect, useCallback } from 'react'
import type { StoryProject, EmotionPresets } from '../types/story'
import { getProjectDetail, getEmotionPresets } from '../services/api'
import StepNav from '../components/story/StepNav'
import StoryInputPanel from '../components/story/StoryInputPanel'
import CharacterListPanel from '../components/story/CharacterListPanel'
import SceneListPanel from '../components/story/SceneListPanel'
import ShotListPanel from '../components/story/ShotListPanel'
import PromptPreviewPanel from '../components/story/PromptPreviewPanel'
import './StoryPage.css'

export default function StoryPage() {
  const [step, setStep] = useState(1)
  const [project, setProject] = useState<StoryProject | null>(null)
  const [presets, setPresets] = useState<EmotionPresets | null>(null)

  // 加载情绪预设
  useEffect(() => {
    getEmotionPresets().then(setPresets).catch(console.error)
  }, [])

  // 刷新项目数据
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

  // 解析完成回调
  const handleParsed = useCallback(async (projectId: number) => {
    await refreshProject(projectId)
    setStep(2)
  }, [refreshProject])

  // 项目创建回调
  const handleProjectCreated = useCallback((p: StoryProject) => {
    setProject(p)
  }, [])

  const stepsCompleted = {
    1: !!project && project.status !== 'draft',
    2: !!project?.characters?.length,
    3: !!project?.scenes?.length,
    4: !!project?.shots?.length,
    5: project?.status === 'ready' || project?.status === 'completed',
  }

  return (
    <div className="story-page">
      <div className="story-page-header">
        <h1 className="text-2xl font-bold text-gray-900">故事创作</h1>
        <p className="text-sm text-gray-500 mt-1">输入故事文本，AI 自动拆解角色、场景、分镜，生成视频</p>
      </div>

      <div className="story-page-body">
        <StepNav
          currentStep={step}
          onStepChange={setStep}
          completed={stepsCompleted}
          projectStatus={project?.status}
        />

        <div className="story-main-content">
          {step === 1 && (
            <StoryInputPanel
              project={project}
              onProjectCreated={handleProjectCreated}
              onParsed={handleParsed}
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
            <div className="flex items-center justify-center h-64 text-gray-400">
              请先在步骤1中创建项目并解析故事
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
