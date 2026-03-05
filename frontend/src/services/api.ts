/**
 * 统一 API 服务层
 */
import type {
  StoryProject,
  StoryCharacter,
  StoryScene,
  EmotionPresets,
} from '../types/story'

export type ProviderType = 'llm' | 'image' | 'video'

export interface AIProvider {
  id: number
  name: string
  display_name: string | null
  provider_type: ProviderType
  base_url: string
  api_key: string
  default_model: string
  is_active: boolean
  sort_order: number
  relay_type: string | null
  created_at: string
  updated_at: string
}

export interface ProviderCreatePayload {
  name: string
  display_name?: string
  provider_type: ProviderType
  base_url: string
  api_key: string
  default_model: string
  is_active?: boolean
  sort_order?: number
  relay_type?: string
}

export interface ProviderUpdatePayload {
  name?: string
  display_name?: string
  provider_type?: ProviderType
  base_url?: string
  api_key?: string
  default_model?: string
  is_active?: boolean
  sort_order?: number
  relay_type?: string
}

const API_BASE = import.meta.env.VITE_API_URL !== undefined
  ? import.meta.env.VITE_API_URL
  : 'http://localhost:8001'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || `HTTP ${res.status}`)
  }
  return res.json()
}

// ========== 项目 ==========

export async function createProject(data: {
  title: string
  story_text: string
  genre?: string
  style?: string
  default_ratio?: string
  default_duration?: number
  llm_provider?: string
  image_provider?: string
}) {
  return request<StoryProject>('/api/story/projects', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function getProjects(limit = 20, offset = 0) {
  return request<{ total: number; projects: StoryProject[] }>(
    `/api/story/projects?limit=${limit}&offset=${offset}`
  )
}

export async function getProjectDetail(id: number) {
  return request<StoryProject>(`/api/story/projects/${id}`)
}

export async function deleteProject(id: number) {
  return request<{ message: string }>(`/api/story/projects/${id}`, {
    method: 'DELETE',
  })
}

export async function updateProject(id: number, data: {
  title?: string
  genre?: string
  style?: string
  llm_provider?: string
  image_provider?: string
  image_model?: string
  video_provider?: string
}) {
  return request<StoryProject>(`/api/story/projects/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

// ========== 解析 ==========

export interface ParseTaskSubmitResponse {
  task_id: number
  project_id: number
  status: string
  message: string | null
}

export interface ParseTaskStatusResponse {
  task_id: number
  project_id: number
  status: string
  progress: number
  message: string | null
  error_detail: string | null
  result_metadata: Record<string, unknown> | null
  created_at: string | null
  started_at: string | null
  completed_at: string | null
  updated_at: string | null
}

export async function parseProject(id: number) {
  return request<ParseTaskSubmitResponse>(`/api/story/projects/${id}/parse`, { method: 'POST' })
}

export async function getParseStatus(id: number, taskId?: number) {
  const query = taskId ? `?task_id=${taskId}` : ''
  return request<ParseTaskStatusResponse>(
    `/api/story/projects/${id}/parse/status${query}`
  )
}

// ========== 编辑 ==========

export async function updateCharacter(id: number, data: Record<string, unknown>) {
  return request(`/api/story/characters/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function updateScene(id: number, data: Record<string, unknown>) {
  return request(`/api/story/scenes/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function updateShot(id: number, data: Record<string, unknown>) {
  return request(`/api/story/shots/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function updateEmotion(
  shotId: number,
  charId: number,
  data: Record<string, unknown>
) {
  return request(`/api/story/shots/${shotId}/emotions/${charId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

// ========== Prompt + 视频 ==========

export async function generatePrompts(projectId: number) {
  return request<{
    total: number
    prompts: Array<{
      shot_id: number
      shot_number: number
      title: string
      video_prompt: string
      char_count: number
    }>
  }>(`/api/story/projects/${projectId}/generate-prompts`, { method: 'POST' })
}

export async function generateVideo(shotId: number) {
  return request<{
    shot_id: number
    chat_id: string
    status: string
    message: string
  }>(`/api/story/shots/${shotId}/generate-video`, { method: 'POST' })
}

// ========== 角色图片 ==========

export async function generateCharacterImage(charId: number, customPrompt?: string) {
  return request<StoryCharacter>(`/api/story/characters/${charId}/generate-image`, {
    method: 'POST',
    body: JSON.stringify(customPrompt ? { custom_prompt: customPrompt } : {}),
  })
}

export async function generateAllCharacterImages(projectId: number) {
  return request<{ total: number; characters: StoryCharacter[] }>(
    `/api/story/projects/${projectId}/generate-images`,
    { method: 'POST' }
  )
}

// ========== 预设 ==========

export async function getEmotionPresets() {
  return request<EmotionPresets>('/api/story/emotions/presets')
}

// ========== 场景图片 & 校准 ==========

export async function generateSceneImage(sceneId: number, customPrompt?: string) {
  return request<StoryScene>(`/api/story/scenes/${sceneId}/generate-image`, {
    method: 'POST',
    body: JSON.stringify(customPrompt ? { custom_prompt: customPrompt } : {}),
  })
}

export async function generateAllSceneImages(projectId: number) {
  return request<{ total: number; scenes: StoryScene[] }>(
    `/api/story/projects/${projectId}/generate-scene-images`,
    { method: 'POST' }
  )
}

export async function calibrateScenes(projectId: number) {
  return request<{ total: number; scenes: StoryScene[] }>(
    `/api/story/projects/${projectId}/calibrate-scenes`,
    { method: 'POST' }
  )
}

export async function calibrateScene(sceneId: number) {
  return request<StoryScene>(`/api/story/scenes/${sceneId}/calibrate`, {
    method: 'POST',
  })
}

export async function listProviders(type?: ProviderType) {
  const query = type ? `?type=${type}` : ''
  return request<{ total: number; providers: AIProvider[] }>(`/api/providers${query}`)
}

export async function createProvider(payload: ProviderCreatePayload) {
  return request<AIProvider>('/api/providers', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function updateProvider(providerId: number, payload: ProviderUpdatePayload) {
  return request<AIProvider>(`/api/providers/${providerId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export async function deleteProvider(providerId: number) {
  return request<{ message: string }>(`/api/providers/${providerId}`, {
    method: 'DELETE',
  })
}

export async function reloadProviderClients() {
  return request<{ message: string; llm_providers: number; image_providers: number }>('/api/providers/reload', {
    method: 'POST',
  })
}
