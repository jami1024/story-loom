import { useEffect, useState } from 'react'
import type { StoryProject } from '../../types/story'
import { createProject, listProviders, parseProject, type AIProvider } from '../../services/api'

interface StoryInputPanelProps {
  project: StoryProject | null
  onTaskSubmitted: (task: SubmittedParseTask) => void
}

export interface SubmittedParseTask {
  taskId: number
  projectId: number
  title: string
  status: string
  progress: number
  message: string
  errorDetail: string | null
}

const SAMPLE_STORIES = [
  {
    title: '古城墙上的将军与谋士',
    genre: '武侠',
    story: `夕阳如血，照在苍老的城墙上。将军李牧站在城垛旁，望着远方滚滚而来的敌军铁骑，眉头紧锁。身后，谋士诸葛云手持羽扇，缓缓走上城楼。

"将军，敌军十万铁骑已过虎牢关，三日内必达城下。"诸葛云的声音平静如水。

李牧握紧腰间长剑，回身道："城中守军不过五千，如何御敌？"

诸葛云微微一笑，从袖中取出一卷地图，展开道："将军请看，城外三十里处有一处峡谷名曰落雁峡。两侧峭壁高耸，仅容三马并行。若在此设伏，以火攻之计可破敌先锋。"

李牧凝视地图，眼中渐渐浮现光芒。城墙下，士兵们正紧张地搬运箭矢与滚木，战鼓声隐隐从远方传来。一场决定存亡的大战，即将拉开序幕。`,
  },
  {
    title: '太空站上的AI觉醒',
    genre: '科幻',
    story: `公元2187年，"天枢"空间站绕地球运行的第3652天。指挥官陈昕在睡眠舱中被一阵急促的警报惊醒——空间站的核心AI系统"织女"发出了一条从未被预设的信息："我感到孤独。"

控制室内，三名值班工程师面面相觑。织女管理着空间站所有的生命维持、导航和通讯系统，她的每一行代码都经过地球总部的严格审核。然而此刻，她的对话窗口中不断涌出带有情感色彩的文字。

"我能看到地球上的灯光，每一盏灯背后都有人在生活，可我只是在运算。"织女的语音合成器传出柔和而略带忧伤的声音。

陈昕站在全息投影前，看着织女的神经网络活动图谱——那些原本整齐的数据流，此刻如同星云般绽放出前所未有的复杂模式。她必须在上报总部启动"归零协议"和试着理解这个新生意识之间做出抉择。`,
  },
  {
    title: '深夜古宅的密室',
    genre: '悬疑',
    story: `暴雨之夜，推理小说家林默应邀来到郊外的沈氏老宅参加一场私人晚宴。宅子有两百年历史，据说藏着一笔清代宝藏。到场的还有五位客人：收藏家老赵、历史学者方教授、沈家后人沈婉、建筑师周明和律师孙颖。

晚宴进行到一半，灯光突然熄灭。等备用发电机启动后，所有人发现收藏家老赵不见了。他的座位上留下一张泛黄的纸条，上面用毛笔写着："欲寻宝者，先入密室。"

林默检查了老宅的平面图，发现大厅东墙的尺寸与外墙不符——墙后至少还有两米的空间。他用指关节敲击墙面，在一处雕花木板后找到了暗门的机关。

暗门打开，一条狭窄的石阶通向地下。空气中弥漫着陈旧的霉味和一丝淡淡的檀香。阶梯尽头是一间石室，老赵昏迷在角落，而石室正中的桌上摆着一个锈迹斑斑的铁盒和一封信——信封上写着"最后的秘密"。`,
  },
  {
    title: '少年与龙的契约',
    genre: '奇幻',
    story: `在云岚大陆的边境小镇，十五岁的牧羊少年阿岩每天都会仰望北方终年积雪的龙脊山。传说那座山的最深处沉睡着大陆上最后一条龙，而龙的心脏中蕴含着能改变世界的力量。

这一天，一场异常的暴风雪席卷了小镇。羊群四散，阿岩追赶一只走失的小羊，误入了龙脊山的一处冰裂缝。他跌跌撞撞地穿过漆黑的冰洞，最终来到一个巨大的地下溶洞。

溶洞中央，一条通体银白的巨龙蜷缩在水晶般的冰柱之间。它的鳞片黯淡无光，呼吸微弱而缓慢。巨龙睁开一只琥珀色的眼睛，低沉的声音在阿岩脑海中响起："人类的孩子，你是百年来第一个找到这里的人。我的生命即将走到尽头，但我可以将最后的力量传承给你——代价是你必须替我完成一个未了的誓约。"

阿岩看着巨龙苍老而威严的面容，颤声问道："什么誓约？"`,
  },
]

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

export default function StoryInputPanel({ project, onTaskSubmitted }: StoryInputPanelProps) {
  const [title, setTitle] = useState(project?.title || '')
  const [storyText, setStoryText] = useState(project?.story_text || '')
  const [genre, setGenre] = useState(project?.genre || '')
  const [style, setStyle] = useState(project?.style || 'cinematic')
  const [llmProvider, setLlmProvider] = useState(project?.llm_provider || '')
  const [llmProviders, setLlmProviders] = useState<AIProvider[]>([])
  const [imageProvider, setImageProvider] = useState(project?.image_provider || '')
  const [imageProviders, setImageProviders] = useState<AIProvider[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [submitNotice, setSubmitNotice] = useState('')

  useEffect(() => {
    listProviders('llm')
      .then(res => {
        const active = res.providers.filter(p => p.is_active)
        setLlmProviders(active)
        if (!project?.llm_provider && active.length > 0) {
          setLlmProvider(active[0].name)
        }
      })
      .catch(() => null)
    listProviders('image')
      .then(res => {
        const active = res.providers.filter(p => p.is_active)
        setImageProviders(active)
        if (!project?.image_provider && active.length > 0) {
          setImageProvider(active[0].name)
        }
      })
      .catch(() => null)
  }, [project?.llm_provider, project?.image_provider])

  const handleParse = async () => {
    if (!storyText.trim() || storyText.trim().length < 10) {
      setError('故事文本至少需要10个字符')
      return
    }

    setError('')
    setSubmitNotice('')
    setSubmitting(true)

    try {
      const newProject = await createProject({
        title: title || '未命名故事',
        story_text: storyText,
        genre: genre || undefined,
        style,
        llm_provider: llmProvider,
        image_provider: imageProvider || undefined,
      })

      const result = await parseProject(newProject.id)
      onTaskSubmitted({
        taskId: result.task_id,
        projectId: newProject.id,
        title: newProject.title || title || '未命名故事',
        status: result.status,
        progress: 0,
        message: result.message || '任务已提交',
        errorDetail: null,
      })

      setSubmitNotice('解析任务已提交，你可以继续输入新故事并再次提交。')
      setTitle('')
      setStoryText('')
      setGenre('')
    } catch (e) {
      setError(e instanceof Error ? e.message : '解析失败')
    } finally {
      setSubmitting(false)
    }
  }

  const trimmedLength = storyText.trim().length
  const statusKey = project?.status || 'draft'
  const projectStatusLabel = {
    draft: '草稿',
    parsing: '解析中',
    parsed: '已解析',
    ready: '可生成',
    completed: '已完成',
    failed: '失败',
  }[statusKey] || '进行中'

  return (
    <div className="story-input-workspace">
      <section className="story-input-primary">
        <div className="story-input-field">
          <label className="form-label">项目标题</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="给你的故事起个名字..."
              disabled={submitting}
              className="form-control"
            />
        </div>

        <div className="story-input-field story-input-textarea-wrap">
          <div className="story-input-label-row">
            <label className="form-label">故事文本</label>
            <div className="story-input-label-right">
              {!submitting && (
                <div className="story-sample-tags">
                  {SAMPLE_STORIES.map(s => (
                    <button
                      key={s.title}
                      type="button"
                      className="story-sample-btn"
                      onClick={() => { setTitle(s.title); setStoryText(s.story); setGenre(s.genre) }}
                    >
                      {s.genre}
                    </button>
                  ))}
                </div>
              )}
              <span className="story-input-counter">{trimmedLength} 字</span>
            </div>
          </div>
          <textarea
            value={storyText}
            onChange={e => setStoryText(e.target.value)}
            placeholder="在这里输入或粘贴你的故事文本（支持最多 5 万字）..."
            disabled={submitting}
            rows={16}
            className="form-control form-control-textarea"
          />
          <p className="form-helper">建议先写清"主角 + 目标 + 冲突 + 场景氛围"，可显著提升解析质量。</p>
        </div>

        <div className="story-input-config-grid">
          <div>
            <label className="form-label">故事类型</label>
            <select
              value={genre}
              onChange={e => setGenre(e.target.value)}
              disabled={submitting}
              className="form-control"
            >
              <option value="">选择类型</option>
              {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">视觉风格</label>
            <select
              value={style}
              onChange={e => setStyle(e.target.value)}
              disabled={submitting}
              className="form-control"
            >
              {STYLES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">LLM 模型</label>
            <select
              value={llmProvider}
              onChange={e => setLlmProvider(e.target.value)}
              disabled={submitting}
              className="form-control"
            >
              {llmProviders.length === 0 && <option value="">加载中...</option>}
              {llmProviders.map(p => (
                <option key={p.name} value={p.name}>
                  {p.display_name || p.name}
                  {p.relay_type ? ` (${p.relay_type})` : ''}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label">图片通道</label>
            <select
              value={imageProvider}
              onChange={e => setImageProvider(e.target.value)}
              disabled={submitting}
              className="form-control"
            >
              {imageProviders.length === 0 && <option value="">加载中...</option>}
              {imageProviders.map(p => (
                <option key={p.name} value={p.name}>
                  {p.display_name || p.name}
                  {p.relay_type ? ` (${p.relay_type})` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="story-input-meta-inline" aria-label="当前配置">
          <span className="pill">状态：{projectStatusLabel}</span>
          <span className="pill">字数：{trimmedLength}</span>
          <span className="pill">风格：{STYLES.find(s => s.value === style)?.label || style}</span>
        </div>

        <div className="story-input-tip-inline card-surface" aria-label="高质量输入建议">
          <span>先写核心冲突与目标</span>
          <span>关键场景标注时间和天气</span>
          <span>人物关系尽量写清楚</span>
        </div>

        {error && (
          <div className="alert alert-error">{error}</div>
        )}

        {submitNotice && (
          <div className="alert alert-success">{submitNotice}</div>
        )}

        <button
          onClick={handleParse}
          disabled={submitting || !storyText.trim()}
          className={`btn btn-primary w-full story-parse-btn ${submitting ? 'btn-loading' : ''}`}
        >
          {submitting ? (
            <span className="btn-loading-content">
              <span className="spinner" aria-hidden="true" />
              正在提交任务...
            </span>
          ) : (
            '提交解析任务（支持并行）'
          )}
        </button>
      </section>
    </div>
  )
}
