import { useEffect, useMemo, useState } from 'react'
import {
  createProvider,
  deleteProvider,
  listProviders,
  reloadProviderClients,
  updateProvider,
  type AIProvider,
  type ProviderType,
} from '../services/api'
import './SettingsPage.css'

type ProviderScope = 'all' | ProviderType

interface ProviderFormState {
  name: string
  display_name: string
  provider_type: ProviderType
  base_url: string
  api_key: string
  default_model: string
  sort_order: number
  is_active: boolean
  relay_type: string
}

const SCOPE_ITEMS: Array<{ value: ProviderScope; label: string }> = [
  { value: 'all', label: '全部' },
  { value: 'llm', label: 'LLM' },
  { value: 'image', label: '图片' },
  { value: 'video', label: '视频' },
]

const TYPE_LABELS: Record<ProviderType, string> = {
  llm: 'LLM',
  image: 'Image',
  video: 'Video',
}


const createEmptyForm = (type: ProviderType = 'llm'): ProviderFormState => ({
  name: '',
  display_name: '',
  provider_type: type,
  base_url: '',
  api_key: '',
  default_model: '',
  sort_order: 0,
  is_active: true,
  relay_type: '',
})

export default function SettingsPage() {
  const [providers, setProviders] = useState<AIProvider[]>([])
  const [scope, setScope] = useState<ProviderScope>('all')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [isCreateMode, setIsCreateMode] = useState(false)
  const [form, setForm] = useState<ProviderFormState>(createEmptyForm('llm'))

  const providerCountByType = useMemo(() => {
    const counts: Record<ProviderType, number> = { llm: 0, image: 0, video: 0 }
    providers.forEach((provider) => {
      counts[provider.provider_type] += 1
    })
    return counts
  }, [providers])

  const activeProviderCount = useMemo(
    () => providers.filter((provider) => provider.is_active).length,
    [providers]
  )

  const filteredProviders = useMemo(() => {
    if (scope === 'all') {
      return providers
    }
    return providers.filter((provider) => provider.provider_type === scope)
  }, [providers, scope])


  const loadProviders = async () => {
    setLoading(true)
    setError('')
    try {
      const result = await listProviders()
      setProviders(result.providers)
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载中转模型失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProviders().catch(() => null)
  }, [])

  const closeEditor = () => {
    setEditingId(null)
    setIsCreateMode(false)
    setForm(createEmptyForm(scope === 'all' ? 'llm' : scope))
  }

  const startCreate = () => {
    setMessage('')
    setError('')
    setEditingId(null)
    setIsCreateMode(true)
    setForm(createEmptyForm(scope === 'all' ? 'llm' : scope))
  }

  const startEdit = (provider: AIProvider) => {
    setMessage('')
    setError('')
    setEditingId(provider.id)
    setIsCreateMode(false)
    setForm({
      name: provider.name,
      display_name: provider.display_name || '',
      provider_type: provider.provider_type,
      base_url: provider.base_url,
      api_key: '',
      default_model: provider.default_model,
      sort_order: provider.sort_order,
      is_active: provider.is_active,
      relay_type: provider.relay_type || '',
    })
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setMessage('')
    setError('')

    const name = form.name.trim()
    const baseUrl = form.base_url.trim()
    const defaultModel = form.default_model.trim()
    const displayName = form.display_name.trim()
    const apiKey = form.api_key.trim()
    const relayType = form.relay_type.trim()

    if (!name || !baseUrl || !defaultModel) {
      setError('请填写名称、Base URL 和默认模型')
      return
    }

    if (isCreateMode && !apiKey) {
      setError('创建中转模型时必须填写 API Key')
      return
    }

    setSaving(true)
    try {
      let actionMessage = ''
      if (isCreateMode) {
        await createProvider({
          name,
          display_name: displayName || undefined,
          provider_type: form.provider_type,
          base_url: baseUrl,
          api_key: apiKey,
          default_model: defaultModel,
          is_active: form.is_active,
          sort_order: form.sort_order,
          relay_type: relayType || undefined,
        })
        actionMessage = '中转模型已创建'
      } else if (editingId !== null) {
        await updateProvider(editingId, {
          name,
          display_name: displayName || undefined,
          provider_type: form.provider_type,
          base_url: baseUrl,
          default_model: defaultModel,
          is_active: form.is_active,
          sort_order: form.sort_order,
          relay_type: relayType || undefined,
          ...(apiKey ? { api_key: apiKey } : {}),
        })
        actionMessage = '中转模型已更新'
      }

      await reloadProviderClients()
      await loadProviders()
      closeEditor()
      setMessage(`${actionMessage}，并已重载客户端`)
    } catch (e) {
      setError(e instanceof Error ? e.message : '保存失败')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleActive = async (provider: AIProvider) => {
    setError('')
    setMessage('')
    try {
      await updateProvider(provider.id, { is_active: !provider.is_active })
      await reloadProviderClients()
      setProviders((prev) => prev.map((item) => (
        item.id === provider.id ? { ...item, is_active: !item.is_active } : item
      )))
      setMessage(`已${provider.is_active ? '停用' : '启用'} ${provider.display_name || provider.name}，并已重载客户端`)
    } catch (e) {
      setError(e instanceof Error ? e.message : '切换状态失败')
    }
  }

  const handleDelete = async (provider: AIProvider) => {
    const ok = window.confirm(`确定删除中转模型 “${provider.display_name || provider.name}” 吗？`)
    if (!ok) {
      return
    }

    setError('')
    setMessage('')
    try {
      await deleteProvider(provider.id)
      await reloadProviderClients()
      setProviders((prev) => prev.filter((item) => item.id !== provider.id))
      setMessage('中转模型已删除，并已重载客户端')
      if (editingId === provider.id) {
        closeEditor()
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '删除失败')
    }
  }

  const handleReloadClients = async () => {
    setSaving(true)
    setError('')
    setMessage('')
    try {
      const result = await reloadProviderClients()
      setMessage(`客户端已重载：LLM ${result.llm_providers} 个，图片 ${result.image_providers} 个`)
    } catch (e) {
      setError(e instanceof Error ? e.message : '重载失败')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="page-surface settings-page">
      <section className="settings-hero">
        <div className="settings-header">
          <div>
            <h1 className="page-title">设置</h1>
            <p className="page-description">AI 模型中转站管理：统一维护各通道的 Base URL、密钥、模型与启停状态。</p>
          </div>
          <button
            type="button"
            className="btn btn-ghost settings-reload-btn"
            onClick={handleReloadClients}
            disabled={saving}
          >
            重新加载客户端
          </button>
        </div>

        <div className="settings-kpi-grid" aria-label="模型通道概览">
          <article className="settings-kpi-card">
            <span>总模型</span>
            <strong>{providers.length}</strong>
          </article>
          <article className="settings-kpi-card">
            <span>启用中</span>
            <strong>{activeProviderCount}</strong>
          </article>
          <article className="settings-kpi-card">
            <span>LLM</span>
            <strong>{providerCountByType.llm}</strong>
          </article>
          <article className="settings-kpi-card">
            <span>Image / Video</span>
            <strong>{providerCountByType.image + providerCountByType.video}</strong>
          </article>
        </div>
      </section>

      {error && <div className="settings-alert settings-alert-error">{error}</div>}
      {message && <div className="settings-alert settings-alert-success">{message}</div>}

      <section className="settings-workspace">
        <div className="settings-main-panel">
          <div className="settings-toolbar">
            <div className="settings-scope-switch" role="tablist" aria-label="模型类型筛选">
              {SCOPE_ITEMS.map((item) => {
                const count = item.value === 'all'
                  ? providers.length
                  : providerCountByType[item.value]
                return (
                  <button
                    key={item.value}
                    type="button"
                    role="tab"
                    aria-selected={scope === item.value}
                    className={`pill scope-btn ${scope === item.value ? 'scope-btn-active' : ''}`}
                    onClick={() => setScope(item.value)}
                  >
                    {item.label}
                    <span>{count}</span>
                  </button>
                )
              })}
            </div>
            <button
              type="button"
              className="btn btn-primary settings-add-btn"
              onClick={startCreate}
              disabled={saving}
            >
              新增中转模型
            </button>
          </div>

          <div className="provider-list" aria-busy={loading}>
            {loading ? (
              <div className="provider-empty">正在加载中转模型配置...</div>
            ) : filteredProviders.length === 0 ? (
              <div className="provider-empty">当前筛选条件下暂无模型配置，可点击“新增中转模型”。</div>
            ) : (
              filteredProviders.map((provider) => (
                <article
                  key={provider.id}
                  className={`provider-row card-surface ${editingId === provider.id && !isCreateMode ? 'provider-row-selected' : ''}`}
                >
                  <div className="provider-row-head">
                    <div>
                      <h3>{provider.display_name || provider.name}</h3>
                      <p>{provider.name}</p>
                    </div>
                    <div className="provider-card-tags">
                      <span className="provider-type-tag">{TYPE_LABELS[provider.provider_type]}</span>
                      {provider.relay_type && (
                        <span className="provider-relay-tag">{provider.relay_type}</span>
                      )}
                      <span className={`provider-status-tag ${provider.is_active ? 'provider-active' : 'provider-inactive'}`}>
                        {provider.is_active ? '启用中' : '已停用'}
                      </span>
                    </div>
                  </div>

                  <div className="provider-row-meta">
                    <span><em>Base URL</em>{provider.base_url}</span>
                    <span><em>模型</em>{provider.default_model}</span>
                    <span><em>Key</em>{provider.api_key}</span>
                    <span><em>排序</em>{provider.sort_order}</span>
                  </div>

                  <div className="provider-actions">
                    <button type="button" className="btn provider-edit-btn" onClick={() => startEdit(provider)}>
                      编辑
                    </button>
                    <button type="button" className="btn" onClick={() => handleToggleActive(provider)} disabled={saving}>
                      {provider.is_active ? '停用' : '启用'}
                    </button>
                    <button type="button" className="btn provider-delete-btn" onClick={() => handleDelete(provider)} disabled={saving}>删除</button>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>

        <aside className="settings-editor-panel">
          {(isCreateMode || editingId !== null) ? (
            <form className="provider-editor" onSubmit={handleSubmit}>
              <div className="provider-editor-head">
                <h2>{isCreateMode ? '新增中转模型' : '编辑中转模型'}</h2>
                <button type="button" className="btn btn-ghost" onClick={closeEditor}>取消</button>
              </div>

              <div className="provider-editor-grid">
                <label>
                  名称（唯一）
                  <input
                    value={form.name}
                    onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="例如：relay-llm-cn"
                    required
                  />
                </label>

                <label>
                  显示名称
                  <input
                    value={form.display_name}
                    onChange={(e) => setForm((prev) => ({ ...prev, display_name: e.target.value }))}
                    placeholder="例如：LLM 通道 C"
                  />
                </label>

                <label>
                  类型
                  <select
                    value={form.provider_type}
                    onChange={(e) => setForm((prev) => ({ ...prev, provider_type: e.target.value as ProviderType }))}
                  >
                    <option value="llm">LLM</option>
                    <option value="image">Image</option>
                    <option value="video">Video</option>
                  </select>
                </label>

                <label>
                  默认模型
                  <input
                    value={form.default_model}
                    onChange={(e) => setForm((prev) => ({ ...prev, default_model: e.target.value }))}
                    placeholder="例如：deepseek-chat"
                    required
                  />
                </label>

                <label className="provider-editor-span2">
                  Base URL
                  <input
                    value={form.base_url}
                    onChange={(e) => setForm((prev) => ({ ...prev, base_url: e.target.value }))}
                    placeholder="https://api.example.com/v1"
                    required
                  />
                </label>

                <label>
                  中转站类型
                  <select
                    value={form.relay_type}
                    onChange={(e) => setForm((prev) => ({ ...prev, relay_type: e.target.value }))}
                  >
                    <option value="">直连（无中转站）</option>
                    <option value="yescode">YesCode</option>
                    <option value="aiberm">Aiberm</option>
                  </select>
                </label>

                <label className="provider-editor-span2">
                  API Key {isCreateMode ? '' : '（留空表示不修改）'}
                  <input
                    value={form.api_key}
                    onChange={(e) => setForm((prev) => ({ ...prev, api_key: e.target.value }))}
                    placeholder={isCreateMode ? '请输入 API Key' : '不修改时留空'}
                    type="password"
                  />
                </label>

                <label>
                  排序权重
                  <input
                    type="number"
                    value={form.sort_order}
                    onChange={(e) => setForm((prev) => ({ ...prev, sort_order: Number(e.target.value) || 0 }))}
                  />
                </label>

                <label className="provider-editor-checkbox">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) => setForm((prev) => ({ ...prev, is_active: e.target.checked }))}
                  />
                  启用该中转模型
                </label>
              </div>

              <div className="provider-editor-actions">
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? '保存中...' : isCreateMode ? '创建模型' : '保存变更'}
                </button>
              </div>
            </form>
          ) : (
            <div className="provider-editor-empty card-surface">
              <h2>请选择一个模型进行编辑</h2>
              <p>你可以在左侧直接启停模型，或点击“编辑”修改 Base URL、默认模型、排序权重等配置。</p>
              <p>新增中转模型时，建议先从 LLM 或 Image 类型开始，确认通道可用后再纳入主流程。</p>
              <button type="button" className="btn btn-primary settings-add-btn" onClick={startCreate} disabled={saving}>新增中转模型</button>
            </div>
          )}
        </aside>
      </section>
    </div>
  )
}
