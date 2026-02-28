/**
 * TypeScript 类型定义 — 故事解析相关
 */

export interface StoryProject {
  id: number
  title: string
  story_text: string
  genre: string | null
  style: string | null
  status: string
  default_ratio: string
  default_duration: number
  llm_provider: string
  image_provider?: string
  image_model?: string | null
  video_provider?: string
  parse_metadata: Record<string, unknown> | null
  character_count?: number
  scene_count?: number
  shot_count?: number
  characters?: StoryCharacter[]
  scenes?: StoryScene[]
  shots?: StoryShot[]
  created_at: string | null
  updated_at: string | null
}

export interface StoryCharacter {
  id: number
  project_id: number
  name: string
  gender: string | null
  age: string | null
  role: string | null
  personality: string | null
  appearance_brief: string | null
  default_emotion: string | null
  image_url: string | null
  image_prompt: string | null
  image_status: string
  sort_order: number
  created_at: string | null
  updated_at: string | null
}

export interface StoryScene {
  id: number
  project_id: number
  name: string
  location: string | null
  time_of_day: string | null
  weather: string | null
  atmosphere: string | null
  architecture_style: string | null
  lighting_design: string | null
  color_palette: string | null
  visual_prompt_zh: string | null
  image_url: string | null
  image_prompt: string | null
  image_status: string  // "none"|"generating"|"completed"|"failed"
  appearance_count: number
  sort_order: number
  created_at: string | null
  updated_at: string | null
}

export interface CharacterEmotion {
  id: number
  shot_id: number
  character_id: number
  character_name: string | null
  emotion_tag: string
  emotion_intensity: number
  expression_start: string | null
  expression_peak: string | null
  expression_end: string | null
  body_language: string | null
  emotion_transition: string | null
}

export interface StoryShot {
  id: number
  project_id: number
  scene_id: number | null
  scene_name: string | null
  shot_number: number
  title: string | null
  action_summary: string | null
  dialogue: string | null
  duration: number
  shot_type: string
  camera_angle: string
  camera_movement: string
  atmosphere_emotion_tags: string[] | null
  character_emotions: CharacterEmotion[]
  video_prompt: string | null
  status: string
  video_task_chat_id: string | null
  video_url: string | null
  sort_order: number
  created_at: string | null
  updated_at: string | null
}

export interface EmotionTag {
  id: string
  zh: string
  en: string
  visual_cue: string
  prompt_keyword: string
}

export interface EmotionIntensity {
  level: number
  zh: string
  en: string
  description: string
  modifier: string
}

export interface EmotionTransition {
  id: string
  zh: string
  description: string
}

export interface EmotionPresets {
  tags: EmotionTag[]
  intensities: EmotionIntensity[]
  transitions: EmotionTransition[]
}
