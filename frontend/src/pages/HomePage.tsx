import { Link } from 'react-router-dom';
import VideoIcon from '../components/icons/VideoIcon';
import TargetIcon from '../components/icons/TargetIcon';
import HistoryIcon from '../components/icons/HistoryIcon';
import SettingsIcon from '../components/icons/SettingsIcon';
import ZapIcon from '../components/icons/ZapIcon';
import FilmIcon from '../components/icons/FilmIcon';
import SaveIcon from '../components/icons/SaveIcon';
import './HomePage.css';

export default function HomePage() {
  return (
    <div className="home-page">
      <section className="hero-section">
        <div className="hero-inner">
          <div className="hero-copy">
            <span className="hero-eyebrow">AI 视频创作助手</span>
            <h1 className="hero-title">用 AI 创作任意视频</h1>
            <p className="hero-subtitle">
              输入创意描述，AI 为您生成 4K 高清视频。专业级 CogVideo-X 3 模型，从创意到作品，一步到位。
            </p>

            <div className="hero-actions">
              <Link to="/generate" className="btn-cta">
                开始创作 →
              </Link>
              <Link to="/history" className="btn-secondary">
                查看案例
              </Link>
            </div>

            <ul className="hero-highlights">
              <li>
                <ZapIcon /> 灵感到成片不到 5 分钟
              </li>
              <li>
                <FilmIcon /> 自动生成镜头脚本与字幕
              </li>
              <li>
                <SaveIcon /> 永久保存，随时下载 4K 成片
              </li>
            </ul>
          </div>
        </div>
      </section>

      <div className="features-section">
        <h2 className="section-title">核心功能</h2>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">
              <VideoIcon />
            </div>
            <h3 className="feature-title">文生视频</h3>
            <p className="feature-description">
              输入创意描述，AI 自动生成高质量视频内容
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <TargetIcon />
            </div>
            <h3 className="feature-title">智能优化</h3>
            <p className="feature-description">
              自动优化 Prompt，提升视频生成质量
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <HistoryIcon />
            </div>
            <h3 className="feature-title">历史管理</h3>
            <p className="feature-description">
              永久保存生成记录，随时查看和下载
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <SettingsIcon />
            </div>
            <h3 className="feature-title">自定义参数</h3>
            <p className="feature-description">
              灵活调整视频时长、比例等参数
            </p>
          </div>
        </div>
      </div>

      {/* 页脚 */}
      <footer className="home-footer">
        <div className="footer-content">
          <div className="footer-tech-badges">
            <div className="tech-badge">智谱 AI</div>
            <div className="tech-badge">COGVIDEO-X 3</div>
            <div className="tech-badge">4K 超高清</div>
            <div className="tech-badge">AI 驱动</div>
          </div>
          <p className="footer-copyright">© 2024 StoryLoom. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
