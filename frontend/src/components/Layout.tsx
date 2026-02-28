import { Link, Outlet, useLocation } from 'react-router-dom';
import HomeIcon from './icons/HomeIcon';
import VideoIcon from './icons/VideoIcon';
import BookIcon from './icons/BookIcon';
import ScrollIcon from './icons/ScrollIcon';
import SparklesIcon from './icons/SparklesIcon';
import SettingsIcon from './icons/SettingsIcon';
import './Layout.css';

export default function Layout() {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path ? 'active' : '';
  };

  return (
    <div className="layout">
      {/* 侧边栏导航 */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <h1 className="logo">🎬 StoryLoom</h1>
          <p className="tagline">AI 视频创作平台</p>
        </div>

        <nav className="nav-menu">
          <Link to="/" className={`nav-item ${isActive('/')}`}>
            <span className="nav-icon">
              <HomeIcon />
            </span>
            <span className="nav-text">首页</span>
          </Link>

          <Link to="/generate" className={`nav-item ${isActive('/generate')}`}>
            <span className="nav-icon">
              <VideoIcon />
            </span>
            <span className="nav-text">视频生成</span>
          </Link>

          <Link to="/story" className={`nav-item ${isActive('/story')}`}>
            <span className="nav-icon">
              <BookIcon />
            </span>
            <span className="nav-text">故事创作</span>
          </Link>

          <Link to="/history" className={`nav-item ${isActive('/history')}`}>
            <span className="nav-icon">
              <ScrollIcon />
            </span>
            <span className="nav-text">历史记录</span>
          </Link>

          <Link to="/prompts" className={`nav-item ${isActive('/prompts')}`}>
            <span className="nav-icon">
              <SparklesIcon />
            </span>
            <span className="nav-text">Prompt 管理</span>
          </Link>

          <Link to="/settings" className={`nav-item ${isActive('/settings')}`}>
            <span className="nav-icon">
              <SettingsIcon />
            </span>
            <span className="nav-text">设置</span>
          </Link>
        </nav>

        <div className="sidebar-footer">
          <div className="quota-info">
            <span className="quota-label">使用状态</span>
            <span className="quota-value">免费使用</span>
          </div>
          <p className="powered-by">Powered by 智谱 AI</p>
        </div>
      </aside>

      {/* 主内容区域 */}
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
