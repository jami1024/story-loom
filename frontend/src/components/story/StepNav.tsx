interface StepNavProps {
  currentStep: number
  onStepChange: (step: number) => void
  completed: Record<number, boolean>
  projectStatus?: string
}

const STEPS = [
  { num: 1, label: '输入故事', icon: '1' },
  { num: 2, label: '角色', icon: '2' },
  { num: 3, label: '场景', icon: '3' },
  { num: 4, label: '分镜', icon: '4' },
  { num: 5, label: '生成', icon: '5' },
]

export default function StepNav({ currentStep, onStepChange, completed, projectStatus }: StepNavProps) {
  const canNavigate = (stepNum: number) => {
    if (stepNum === 1) return true
    // 解析完成后才能进入后续步骤
    return projectStatus && projectStatus !== 'draft'
  }

  return (
    <nav className="w-48 flex-shrink-0">
      <div className="flex flex-col gap-1">
        {STEPS.map(({ num, label }) => {
          const isActive = currentStep === num
          const isDone = completed[num]
          const enabled = canNavigate(num)

          return (
            <button
              key={num}
              onClick={() => enabled && onStepChange(num)}
              disabled={!enabled}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-lg text-left text-sm font-medium
                transition-all duration-150
                ${isActive
                  ? 'bg-gray-900 text-white'
                  : enabled
                    ? 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    : 'text-gray-300 cursor-not-allowed'
                }
              `}
            >
              <span className={`
                w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                ${isActive
                  ? 'bg-white text-gray-900'
                  : isDone
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-400'
                }
              `}>
                {isDone && !isActive ? '\u2713' : num}
              </span>
              <span>{label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
