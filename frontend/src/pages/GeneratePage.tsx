import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import VideoGenerator from '../components/VideoGenerator'
import TaskTracker from '../components/TaskTracker'
import './GeneratePage.css'

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

export default function GeneratePage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  // 加载最近的 3 条任务
  useEffect(() => {
    const loadRecentTasks = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/video/history?limit=3`)
        if (response.ok) {
          const data = await response.json()
          const recentTasks = data.tasks.map((task: ApiTask) => ({
            id: task.chat_id,
            prompt: task.prompt,
            status: task.status,
            videoUrl: task.video_url,
            message: task.msg,
            plan: task.plan
          }))
          setTasks(recentTasks)
        }
      } catch (error) {
        console.error('加载最近任务失败:', error)
      } finally {
        setLoading(false)
      }
    }

    loadRecentTasks()
  }, [])

  const handleTaskCreated = (taskIds: string[], prompt: string) => {
    // 批量创建任务
    const newTasks: Task[] = taskIds.map(taskId => ({
      id: taskId,
      prompt,
      status: 'init',
    }))
    setTasks(prev => [...newTasks, ...prev])
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

  return (
    <div className="generate-page">
      <div className="page-header">
        <h1 className="page-title">视频生成</h1>
        <p className="page-description">输入创意描述，AI 将为您生成 4K 高清视频</p>
      </div>

      <div className="page-content">
        <div className="generator-section">
          <VideoGenerator onTaskCreated={handleTaskCreated} />
        </div>

        <div className="tasks-section">
          {loading ? (
            <>
              <div className="section-header">
                <h2>最近任务</h2>
              </div>
              <div className="skeleton-container">
                <div className="skeleton-card">
                  <div className="skeleton-line title"></div>
                  <div className="skeleton-line text"></div>
                  <div className="skeleton-line short"></div>
                </div>
                <div className="skeleton-card">
                  <div className="skeleton-line title"></div>
                  <div className="skeleton-line text"></div>
                  <div className="skeleton-line short"></div>
                </div>
                <div className="skeleton-card">
                  <div className="skeleton-line title"></div>
                  <div className="skeleton-line text"></div>
                  <div className="skeleton-line short"></div>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="section-header">
                <h2>最近任务</h2>
                <Link to="/history" className="view-all-link">查看全部 →</Link>
              </div>
              <TaskTracker tasks={tasks} onTaskUpdate={handleTaskUpdate} />
            </>
          )}
        </div>
      </div>
    </div>
  )
}
