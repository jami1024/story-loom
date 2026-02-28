import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import GeneratePage from './pages/GeneratePage'
import HistoryPage from './pages/HistoryPage'
import PromptsPage from './pages/PromptsPage'
import SettingsPage from './pages/SettingsPage'
import StoryPage from './pages/StoryPage'
import './App.css'
import { useEffect } from 'react'

function LayoutWrapper() {
  const location = useLocation()

  useEffect(() => {
    const mainContent = document.querySelector('.main-content') as HTMLElement
    if (mainContent) {
      mainContent.style.background = '#fff'
    }
  }, [location])

  return <Layout />
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LayoutWrapper />}>
          <Route index element={<HomePage />} />
          <Route path="generate" element={<GeneratePage />} />
          <Route path="story" element={<StoryPage />} />
          <Route path="history" element={<HistoryPage />} />
          <Route path="prompts" element={<PromptsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </Router>
  )
}

export default App
