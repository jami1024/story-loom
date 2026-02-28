import { useEffect } from 'react'
import './TaskTracker.css'

interface Task {
  id: string
  prompt: string
  status: string
  videoUrl?: string
  message?: string
  plan?: string  // 进度信息
}

interface TaskTrackerProps {
  tasks: Task[]
  onTaskUpdate: (taskId: string, status: string, videoUrl?: string, message?: string, plan?: string) => void
}

// 使用相对路径(空字符串)让 Nginx 代理处理,或在开发环境使用 localhost:8001
const API_BASE_URL = import.meta.env.VITE_API_URL !== undefined
  ? import.meta.env.VITE_API_URL
  : 'http://localhost:8001'

export default function TaskTracker({ tasks, onTaskUpdate }: TaskTrackerProps) {
  useEffect(() => {
    // 定期轮询所有进行中的任务
    const interval = setInterval(() => {
      tasks.forEach(async (task) => {
        if (task.status === 'init' || task.status === 'processing') {
          try {
            const response = await fetch(`${API_BASE_URL}/api/video/status/${task.id}`)
            if (response.ok) {
              const data = await response.json()
              onTaskUpdate(task.id, data.status, data.video_url, data.msg, data.plan)
            }
          } catch (error) {
            console.error(`查询任务 ${task.id} 状态失败:`, error)
          }
        }
      })
    }, 2000) // 每 2 秒查询一次（提高实时性）

    return () => clearInterval(interval)
  }, [tasks, onTaskUpdate])

  const getStatusText = (status: string) => {
    const statusMap: { [key: string]: string } = {
      init: '⏳ 初始化',
      processing: '🎬 生成中',
      finished: '✅ 已完成',
      failed: '❌ 失败',
    }
    return statusMap[status] || status
  }

  const getStatusClass = (status: string) => {
    return `task-status ${status}`
  }

  if (tasks.length === 0) {
    return (
      <div className="task-tracker-empty">
        <div className="empty-illustration">
          <div className="empty-circle">
            <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="60" cy="60" r="50" stroke="#e5e7eb" strokeWidth="2" strokeDasharray="8 8"/>
              <path d="M45 40L75 60L45 80V40Z" fill="#6366f1" opacity="0.2"/>
              <path d="M45 40L75 60L45 80V40Z" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
        <h3 className="empty-title">开始你的创作之旅</h3>
        <p className="empty-description">填写上方表单，让 AI 为你生成令人惊艳的 4K 视频</p>
        <div className="empty-features">
          <div className="feature-item">
            <span className="feature-icon">✨</span>
            <span className="feature-text">AI 智能生成</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">🎬</span>
            <span className="feature-text">4K 高清画质</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">⚡</span>
            <span className="feature-text">快速出片</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="task-tracker">
      <h2>任务列表</h2>

      <div className="tasks-list">
        {tasks.map((task) => (
          <div key={task.id} className="task-card">
            {/* 封面图区域 */}
            <div className="task-card-image">
              {task.status === 'finished' && task.videoUrl ? (
                <video src={task.videoUrl} controls={false} />
              ) : (
                <div className="placeholder">🎬</div>
              )}
              {task.status === 'processing' && (
                <div className="loading-indicator">
                  <div className="spinner"></div>
                </div>
              )}
            </div>

            {/* 内容区域 */}
            <div className="task-card-content">
              <div className="task-id">ID: {task.id.slice(0, 12)}...</div>

              <div className="task-header">
                <div className="task-prompt">{task.prompt}</div>
                <span className={getStatusClass(task.status)}>
                  {getStatusText(task.status)}
                </span>
              </div>

              {task.message && (
                <div className="task-message">{task.message}</div>
              )}

              {task.status === 'finished' && task.videoUrl && (
                <div className="task-actions">
                  <a href={task.videoUrl} target="_blank" rel="noopener noreferrer" className="task-action-btn">
                    查看视频
                  </a>
                  <a href={task.videoUrl} download className="task-action-btn">
                    下载
                  </a>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
