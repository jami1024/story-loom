import './SettingsPage.css'

export default function SettingsPage() {
  return (
    <div className="settings-page">
      <div className="page-header">
        <h1 className="page-title">设置</h1>
        <p className="page-description">配置您的偏好设置</p>
      </div>

      <div className="coming-soon">
        <div className="icon">⚙️</div>
        <h2>即将推出</h2>
        <p>视频参数设置、通知设置等功能正在开发中...</p>
      </div>
    </div>
  )
}
