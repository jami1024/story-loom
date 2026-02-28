import { useState, useEffect } from 'react'
import TaskTracker from '../components/TaskTracker'
import './HistoryPage.css'

interface Task {
  id: string
  prompt: string
  status: string
  videoUrl?: string
  message?: string
  plan?: string
}

interface ApiTask {
  chat_id: string
  prompt: string
  status: string
  video_url?: string
  msg?: string
  plan?: string
}

const API_BASE_URL = import.meta.env.VITE_API_URL !== undefined
  ? import.meta.env.VITE_API_URL
  : 'http://localhost:8001'

export default function HistoryPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [statusFilter, setStatusFilter] = useState<string>('all')

  useEffect(() => {
    loadHistory()
  }, [])

  const loadHistory = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/api/video/history?limit=50`)
      if (response.ok) {
        const data = await response.json()
        const historyTasks = data.tasks.map((task: ApiTask) => ({
          id: task.chat_id,
          prompt: task.prompt,
          status: task.status,
          videoUrl: task.video_url,
          message: task.msg,
          plan: task.plan
        }))
        setTasks(historyTasks)
        setTotal(data.total)
      }
    } catch (error) {
      console.error('加载历史记录失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleTaskUpdate = (taskId: string, status: string, videoUrl?: string, message?: string, plan?: string) => {
    setTasks(prev =>
      prev.map(task =>
        task.id === taskId
          ? { ...task, status, videoUrl, message, plan }
          : task
      )
    )
  }

  const filteredTasks = statusFilter === 'all'
    ? tasks
    : tasks.filter(task => task.status === statusFilter)

  return (
    <div className="history-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">历史记录</h1>
          <p className="page-description">查看您的所有视频生成历史</p>
        </div>
        <div className="stats">
          <div className="stat-item">
            <span className="stat-value">{total}</span>
            <span className="stat-label">总任务数</span>
          </div>
        </div>
      </div>

      <div className="filter-bar">
        <button
          className={`filter-btn ${statusFilter === 'all' ? 'active' : ''}`}
          onClick={() => setStatusFilter('all')}
        >
          全部
        </button>
        <button
          className={`filter-btn ${statusFilter === 'finished' ? 'active' : ''}`}
          onClick={() => setStatusFilter('finished')}
        >
          ✅ 已完成
        </button>
        <button
          className={`filter-btn ${statusFilter === 'processing' ? 'active' : ''}`}
          onClick={() => setStatusFilter('processing')}
        >
          ⏳ 处理中
        </button>
        <button
          className={`filter-btn ${statusFilter === 'failed' ? 'active' : ''}`}
          onClick={() => setStatusFilter('failed')}
        >
          ❌ 失败
        </button>
      </div>

      {loading ? (
        <div className="loading-state">加载中...</div>
      ) : (
        <TaskTracker tasks={filteredTasks} onTaskUpdate={handleTaskUpdate} />
      )}
    </div>
  )
}
