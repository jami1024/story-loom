interface StepNavProps {
  currentStep: number
  onStepChange: (step: number) => void
  completed: Record<number, boolean>
  projectStatus?: string
}

const STEPS = [
  { num: 1, label: '输入故事', hint: '文本与参数', parsedLabel: '总览', parsedHint: '解析结果' },
  { num: 2, label: '角色', hint: '人设与立绘' },
  { num: 3, label: '场景', hint: '地点与视觉锚点' },
  { num: 4, label: '分镜', hint: '镜头与情绪' },
  { num: 5, label: '生成', hint: 'Prompt 与视频' },
]

const SPROCKET_COUNT = 24

export default function StepNav({ currentStep, onStepChange, completed, projectStatus }: StepNavProps) {
  const isParsed = !!projectStatus && !['draft', 'failed'].includes(projectStatus)
  const showOnlyInputStep = !projectStatus || projectStatus === 'draft'
  const visibleSteps = showOnlyInputStep ? STEPS.filter(step => step.num === 1) : STEPS

  const canNavigate = (stepNum: number) => {
    if (stepNum === 1) return true
    return projectStatus && projectStatus !== 'draft'
  }

  return (
    <nav className="filmstrip" aria-label="创作步骤">
      <div className="filmstrip-track">
        <div className="filmstrip-sprockets" aria-hidden="true">
          {Array.from({ length: SPROCKET_COUNT }, (_, i) => (
            <span className="filmstrip-hole" key={i} />
          ))}
        </div>

        <div className="filmstrip-frames">
          {visibleSteps.map((stepDef, idx) => {
            const { num } = stepDef
            const displayLabel = num === 1 && isParsed && 'parsedLabel' in stepDef ? stepDef.parsedLabel : stepDef.label
            const displayHint = num === 1 && isParsed && 'parsedHint' in stepDef ? stepDef.parsedHint : stepDef.hint
            const isActive = currentStep === num
            const isDone = completed[num]
            const enabled = canNavigate(num)

            const frameClass = [
              'filmstrip-frame',
              isActive ? 'filmstrip-frame--active' : '',
              isDone && !isActive ? 'filmstrip-frame--done' : '',
              !enabled ? 'filmstrip-frame--locked' : '',
            ].filter(Boolean).join(' ')

            return (
              <div className="filmstrip-frame-group" key={num}>
                {idx > 0 && <span className="filmstrip-connector" aria-hidden="true" />}
                <button
                  className={frameClass}
                  onClick={() => enabled && onStepChange(num)}
                  disabled={!enabled}
                  aria-current={isActive ? 'step' : undefined}
                >
                  <span className="filmstrip-frame-num">
                    {isDone && !isActive ? '\u2713' : num}
                  </span>
                  <span className="filmstrip-frame-label">{displayLabel}</span>
                  <span className="filmstrip-frame-hint">{displayHint}</span>
                </button>
              </div>
            )
          })}
        </div>

        <div className="filmstrip-sprockets" aria-hidden="true">
          {Array.from({ length: SPROCKET_COUNT }, (_, i) => (
            <span className="filmstrip-hole" key={i} />
          ))}
        </div>
      </div>

      {showOnlyInputStep && (
        <p className="filmstrip-helper">完成解析后自动解锁：角色 / 场景 / 分镜 / 生成</p>
      )}
    </nav>
  )
}
