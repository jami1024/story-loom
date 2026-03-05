import { useState, useMemo } from 'react'
import type { StoryProject } from '../../types/story'

interface ParseOverviewDashboardProps {
  project: StoryProject
  onNavigate: (step: number) => void
  onRequestReparse: () => void
}

export default function ParseOverviewDashboard({ project, onNavigate, onRequestReparse }: ParseOverviewDashboardProps) {
  const [storyExpanded, setStoryExpanded] = useState(false)

  const characters = useMemo(() => project.characters || [], [project.characters])
  const scenes = useMemo(() => project.scenes || [], [project.scenes])
  const shots = useMemo(() => project.shots || [], [project.shots])

  const emotionCount = useMemo(
    () => shots.reduce((sum, s) => sum + (s.character_emotions?.length || 0), 0),
    [shots],
  )

  const shotsByScene = useMemo(() => {
    const map = new Map<number, typeof shots>()
    for (const shot of shots) {
      if (shot.scene_id == null) continue
      const list = map.get(shot.scene_id) || []
      list.push(shot)
      map.set(shot.scene_id, list)
    }
    return scenes.map(scene => ({
      scene,
      shots: map.get(scene.id) || [],
    }))
  }, [scenes, shots])

  const sceneShotCount = (sceneId: number) =>
    shots.filter(s => s.scene_id === sceneId).length

  const storyPreview = project.story_text || ''
  const truncated = storyPreview.length > 100
  const displayText = storyExpanded || !truncated ? storyPreview : storyPreview.slice(0, 100) + '…'

  const roleLabel = (role: string | null | undefined) => {
    switch (role) {
      case 'protagonist': return '主角'
      case 'supporting': return '配角'
      case 'minor': return '次要'
      default: return role || '角色'
    }
  }

  const roleBadgeClass = (role: string | null | undefined) => {
    switch (role) {
      case 'protagonist': return 'char-role-protagonist'
      case 'supporting': return 'char-role-supporting'
      default: return 'char-role-minor'
    }
  }

  return (
    <div className="parse-overview">
      {/* ── Summary Bar ── */}
      <div className="parse-overview__summary">
        {[
          { label: '角色', value: characters.length, icon: '👤' },
          { label: '场景', value: scenes.length, icon: '🎬' },
          { label: '分镜', value: shots.length, icon: '🎞' },
          { label: '情绪', value: emotionCount, icon: '🎭' },
        ].map(({ label, value, icon }) => (
          <div className="parse-overview__stat-card" key={label}>
            <span className="parse-overview__stat-icon">{icon}</span>
            <strong className="parse-overview__stat-value">{value}</strong>
            <span className="parse-overview__stat-label">{label}</span>
          </div>
        ))}
      </div>

      {/* ── Story Peek ── */}
      {storyPreview && (
        <div className="parse-overview__story-peek">
          <div className="parse-overview__section-header">
            <span className="parse-overview__section-tag">STORY</span>
            <h3>原文预览</h3>
          </div>
          <p className="parse-overview__story-text">{displayText}</p>
          {truncated && (
            <button
              className="parse-overview__expand-btn"
              onClick={() => setStoryExpanded(v => !v)}
            >
              {storyExpanded ? '收起' : '展开全文'}
            </button>
          )}
        </div>
      )}

      {/* ── Character Roster ── */}
      {characters.length > 0 && (
        <div className="parse-overview__characters">
          <div className="parse-overview__section-header">
            <span className="parse-overview__section-tag">CHARACTERS</span>
            <h3>角色一览</h3>
          </div>
          <div className="parse-overview__char-scroll" onClick={() => onNavigate(2)}>
            {characters.map(c => (
              <div className="parse-overview__char-chip" key={c.id}>
                {c.image_url ? (
                  <img className="parse-overview__char-avatar" src={c.image_url} alt={c.name} />
                ) : (
                  <span className="parse-overview__char-avatar parse-overview__char-avatar--placeholder">
                    {c.name.charAt(0)}
                  </span>
                )}
                <span className="parse-overview__char-name">{c.name}</span>
                <span className={`parse-overview__char-role ${roleBadgeClass(c.role)}`}>
                  {roleLabel(c.role)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Scene Cards ── */}
      {scenes.length > 0 && (
        <div className="parse-overview__scenes">
          <div className="parse-overview__section-header">
            <span className="parse-overview__section-tag">SCENES</span>
            <h3>场景列表</h3>
          </div>
          <div className="parse-overview__scene-scroll" onClick={() => onNavigate(3)}>
            {scenes.map(s => (
              <div className="parse-overview__scene-card" key={s.id}>
                <div className="parse-overview__scene-thumb">
                  {s.image_url ? (
                    <img src={s.image_url} alt={s.name} />
                  ) : (
                    <span className="parse-overview__scene-placeholder">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="2" width="20" height="20" rx="4" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <path d="m21 15-5-5L5 21" />
                      </svg>
                    </span>
                  )}
                </div>
                <div className="parse-overview__scene-info">
                  <strong>{s.name}</strong>
                  <span className="parse-overview__scene-location">{s.location || '未知地点'}</span>
                  <span className="parse-overview__scene-meta">
                    {s.time_of_day || '—'} · {sceneShotCount(s.id)} 分镜
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Shot Timeline ── */}
      {shotsByScene.length > 0 && shots.length > 0 && (
        <div className="parse-overview__timeline">
          <div className="parse-overview__section-header">
            <span className="parse-overview__section-tag">TIMELINE</span>
            <h3>分镜时间轴</h3>
          </div>
          <div className="parse-overview__timeline-scroll" onClick={() => onNavigate(4)}>
            {shotsByScene.map(({ scene, shots: sceneShots }) =>
              sceneShots.length > 0 ? (
                <div className="parse-overview__timeline-group" key={scene.id}>
                  <span className="parse-overview__timeline-scene-label">{scene.name}</span>
                  <div className="parse-overview__timeline-shots">
                    {sceneShots.map((shot, idx) => (
                      <div className="parse-overview__timeline-node" key={shot.id}>
                        {idx > 0 && <span className="parse-overview__timeline-connector" />}
                        <span className="parse-overview__timeline-dot" />
                        <span className="parse-overview__timeline-shot-label">
                          #{shot.shot_number}
                        </span>
                        <span className="parse-overview__timeline-shot-type">
                          {shot.shot_type || '—'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null,
            )}
          </div>
        </div>
      )}

      {/* ── Quick Actions ── */}
      <div className="parse-overview__actions">
        <button className="parse-overview__action-btn" onClick={() => onNavigate(2)}>
          <span className="parse-overview__action-icon">👤</span>
          <span>角色管理</span>
        </button>
        <button className="parse-overview__action-btn" onClick={() => onNavigate(3)}>
          <span className="parse-overview__action-icon">🎬</span>
          <span>场景校准</span>
        </button>
        <button className="parse-overview__action-btn" onClick={() => onNavigate(4)}>
          <span className="parse-overview__action-icon">🎞</span>
          <span>分镜编排</span>
        </button>
        <button className="parse-overview__action-btn" onClick={() => onNavigate(5)}>
          <span className="parse-overview__action-icon">🚀</span>
          <span>生成视频</span>
        </button>
        <button className="parse-overview__reparse-btn" onClick={onRequestReparse}>
          重新解析
        </button>
      </div>
    </div>
  )
}
