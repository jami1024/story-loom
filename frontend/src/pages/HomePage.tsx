import { Link } from 'react-router-dom'
import BookIcon from '../components/icons/BookIcon'
import TargetIcon from '../components/icons/TargetIcon'
import HistoryIcon from '../components/icons/HistoryIcon'
import ZapIcon from '../components/icons/ZapIcon'
import FilmIcon from '../components/icons/FilmIcon'
import SaveIcon from '../components/icons/SaveIcon'
import './HomePage.css'

const coreFeatures = [
  {
    icon: <BookIcon />,
    title: '故事拆解引擎',
    description: '一句故事，自动拆成角色、场景、分镜与镜头语言，减少前期脚本时间。',
    tone: 'feature-copper',
  },
  {
    icon: <TargetIcon />,
    title: '参考图一致性',
    description: '角色立绘和场景参考图自动联动，保证多个镜头风格稳定。',
    tone: 'feature-cyan',
  },
  {
    icon: <FilmIcon />,
    title: '4K 逐镜生成',
    description: '基于 5 层语义 Prompt 组装，按镜头批量生成 4K 成片。',
    tone: 'feature-red',
  },
  {
    icon: <HistoryIcon />,
    title: '历史可追溯',
    description: '每次生成自动留痕，支持在线预览、复盘与下载。',
    tone: 'feature-green',
  },
]

const pipeline = [
  '输入故事：支持武侠、科幻、爱情等创作类型',
  'AI 拆解：角色、场景、分镜一键生成',
  '镜头润色：补充情绪、角度和运镜细节',
  '批量出片：4K 视频任务排队并实时追踪',
]

export default function HomePage() {
  return (
    <div className="page-surface home-page">
      <div className="home-stack">
        <section className="hero-feature-shell" aria-labelledby="hero-title">
          <div className="landing-grid">
            <div className="landing-copy">
              <p className="hero-kicker section-eyebrow">StoryLoom | AI FILM STUDIO</p>
              <h1 id="hero-title" className="hero-title">
                把你的故事
                <span className="hero-title-highlight">变成可交付的 4K 视频</span>
              </h1>
              <p className="hero-subtitle">
                首页即工作入口：从灵感文本到镜头级成片，全流程 AI 自动执行。你只要专注创意，StoryLoom 负责生产效率与画质。
              </p>

              <div className="hero-cta-group">
                <Link to="/story" className="btn btn-primary">
                  立即开始创作
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M5 12h14" />
                    <path d="m12 5 7 7-7 7" />
                  </svg>
                </Link>
                <Link to="/history" className="btn btn-ghost">查看真实产出</Link>
              </div>

              <div className="hero-signals" aria-label="核心能力">
                <span className="pill"><ZapIcon /> 自动分镜脚本</span>
                <span className="pill"><FilmIcon /> 镜头级生成</span>
                <span className="pill"><SaveIcon /> 4K 成片下载</span>
              </div>
            </div>

            <aside className="hero-panel" aria-label="落地页关键指标">
              <h2>创作流程看板</h2>
              <ul>
                {pipeline.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ul>
              <div className="hero-metrics">
                <div>
                  <strong>4K</strong>
                  <span>默认输出分辨率</span>
                </div>
                <div>
                  <strong>5 Steps</strong>
                  <span>故事到视频标准流程</span>
                </div>
                <div>
                  <strong>No Login</strong>
                  <span>即开即用，快速验证创意</span>
                </div>
              </div>
            </aside>
          </div>

          <div className="feature-section" aria-labelledby="feature-title">
            <div className="section-head">
              <p className="section-eyebrow">What you can launch</p>
            </div>
            <div className="feature-grid">
              {coreFeatures.map((item) => (
                <article className={`feature-card card-surface ${item.tone}`} key={item.title}>
                  <div className="feature-icon">{item.icon}</div>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="final-cta" aria-labelledby="final-cta-title">
          <div>
            <p className="final-cta-kicker">Ready to publish your first shot list?</p>
            <h2 id="final-cta-title">从想法到成片，不再卡在执行</h2>
          </div>
          <Link to="/story" className="btn btn-primary final-cta-link">现在开始</Link>
        </section>
      </div>
    </div>
  )
}
