import { Link, Outlet, useLocation } from 'react-router-dom';
import HomeIcon from './icons/HomeIcon';
import BookIcon from './icons/BookIcon';
import SettingsIcon from './icons/SettingsIcon';
import './Layout.css';

export default function Layout() {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path ? 'active' : '';
  };

  return (
    <div className="layout">
      <aside className="sidebar" aria-label="主导航">
        <div className="sidebar-header">
          <div className="logo">
            <div className="logo-mark">S</div>
            <span className="logo-text">StoryLoom</span>
          </div>
          <div className="logo-meta">
            <span className="logo-kicker">创作工作台</span>
            <p className="tagline">AI 视频创作平台</p>
          </div>
        </div>

        <nav className="nav-menu" aria-label="应用菜单">
          <Link to="/" className={`nav-item ${isActive('/')}`}>
            <span className="nav-icon"><HomeIcon /></span>
            <span className="nav-text">首页</span>
          </Link>
          <Link to="/story" className={`nav-item ${isActive('/story')}`}>
            <span className="nav-icon"><BookIcon /></span>
            <span className="nav-text">故事创作</span>
          </Link>
          <Link to="/settings" className={`nav-item ${isActive('/settings')}`}>
            <span className="nav-icon"><SettingsIcon /></span>
            <span className="nav-text">设置</span>
          </Link>
        </nav>

      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
