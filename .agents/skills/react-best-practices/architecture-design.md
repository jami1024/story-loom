# React 项目架构设计指南

本文档描述 React 项目的架构设计原则、目录结构、组件分层、状态管理等核心内容。

## 📋 架构概览

### 架构原则

```
Feature-Based Architecture + Clean Code Principles
```

**核心理念**:
1. **按功能组织** - 相关代码放在一起，而非按类型分散
2. **关注点分离** - UI、逻辑、数据各司其职
3. **高内聚低耦合** - 功能模块独立，易于维护
4. **可测试性** - 便于单元测试和集成测试

### 技术栈

| 类别 | 技术选型 | 说明 |
|------|---------|------|
| **框架** | React 18+ | Concurrent、Suspense |
| **语言** | TypeScript | 严格类型检查 |
| **构建工具** | Vite | 快速开发体验 |
| **UI 库** | shadcn/ui + Radix | 可定制组件 |
| **服务端状态** | TanStack Query | 缓存、重试、轮询 |
| **客户端状态** | Zustand | 轻量状态管理 |
| **表单** | React Hook Form + Zod | 性能 + 验证 |
| **路由** | React Router v6 | 声明式路由 |
| **样式** | Tailwind CSS | 实用优先 |
| **测试** | Vitest + Testing Library | 单元 + 组件测试 |
| **E2E** | Playwright | 端到端测试 |

---

## 🗂️ 目录结构

### 标准目录结构

```
src/
├── app/                          # 应用入口和全局配置
│   ├── App.tsx                   # 根组件
│   ├── main.tsx                  # 入口文件
│   ├── router.tsx                # 路由配置
│   └── providers.tsx             # 全局 Provider
│
├── features/                     # 功能模块（核心）
│   ├── auth/                     # 认证功能
│   │   ├── LoginPage.tsx         # 登录页面
│   │   ├── RegisterPage.tsx      # 注册页面
│   │   ├── components/           # 功能组件
│   │   │   ├── LoginForm.tsx
│   │   │   └── SocialLogin.tsx
│   │   ├── hooks/                # 自定义 Hooks
│   │   │   ├── useAuth.ts
│   │   │   └── useLogin.ts
│   │   ├── api/                  # API 请求
│   │   │   └── authApi.ts
│   │   ├── stores/               # 状态管理
│   │   │   └── authStore.ts
│   │   ├── types/                # 类型定义
│   │   │   └── auth.types.ts
│   │   └── utils/                # 工具函数
│   │       └── tokenUtils.ts
│   │
│   ├── user-profile/             # 用户资料功能
│   │   ├── UserProfilePage.tsx
│   │   ├── components/
│   │   ├── hooks/
│   │   └── api/
│   │
│   └── posts/                    # 帖子功能
│       ├── PostListPage.tsx
│       ├── PostDetailPage.tsx
│       ├── components/
│       ├── hooks/
│       └── api/
│
├── components/                   # 通用组件
│   ├── layout/                   # 布局组件
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   └── Sidebar.tsx
│   ├── ui/                       # UI 基础组件（shadcn/ui）
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   └── dialog.tsx
│   └── common/                   # 通用业务组件
│       ├── LoadingSpinner.tsx
│       ├── ErrorBoundary.tsx
│       └── ProtectedRoute.tsx
│
├── lib/                          # 核心库和配置
│   ├── api-client.ts             # API 客户端
│   ├── query-client.ts           # TanStack Query 配置
│   ├── cn.ts                     # className 工具
│   └── utils.ts                  # 通用工具
│
├── hooks/                        # 全局 Hooks
│   ├── useMediaQuery.ts
│   ├── useLocalStorage.ts
│   └── useDebounce.ts
│
├── stores/                       # 全局状态
│   ├── themeStore.ts
│   └── uiStore.ts
│
├── types/                        # 全局类型
│   ├── global.d.ts
│   └── api.types.ts
│
└── assets/                       # 静态资源
    ├── images/
    └── icons/
```

### 目录设计原则

**1. Feature-Based 组织**:
```
✅ 推荐：按功能组织
src/features/user-profile/
├── UserProfilePage.tsx
├── components/
├── hooks/
└── api/

❌ 不推荐：按类型组织
src/
├── pages/UserProfilePage.tsx
├── components/UserCard.tsx
├── hooks/useUserProfile.ts
└── api/userApi.ts
```

**2. 就近原则**:
```
相关代码应该放在一起：
- 组件和它的样式
- 组件和它的测试
- 功能和它的 API
```

**3. 公共提取原则**:
```
只有在至少 3 个地方使用时，才提取为公共组件
否则保持在 feature 内部
```

---

## 🏗️ 组件分层设计

### 四层架构

```
┌─────────────────────────────────────┐
│  Pages 层（路由页面）                 │  路由、布局、数据获取
├─────────────────────────────────────┤
│  Features 层（功能组件）              │  业务逻辑、状态管理
├─────────────────────────────────────┤
│  Common 层（通用组件）                │  跨功能复用组件
├─────────────────────────────────────┤
│  UI 层（基础组件）                    │  shadcn/ui 基础组件
└─────────────────────────────────────┘
```

### 1. Pages 层 - 路由页面

**职责**:
- 作为路由入口
- 布局组织
- 数据预取
- SEO 优化

**示例**:
```typescript
// src/features/user-profile/UserProfilePage.tsx
import { useParams } from 'react-router-dom'
import { useUserProfile } from './hooks/useUserProfile'
import { UserHeader } from './components/UserHeader'
import { UserPosts } from './components/UserPosts'

export function UserProfilePage() {
  const { userId } = useParams()
  const { data: user, isLoading } = useUserProfile(userId!)

  if (isLoading) return <LoadingSpinner />
  if (!user) return <NotFound />

  return (
    <div className="container mx-auto py-8">
      <UserHeader user={user} />
      <UserPosts userId={userId!} />
    </div>
  )
}
```

### 2. Features 层 - 功能组件

**职责**:
- 实现具体业务逻辑
- 处理用户交互
- 状态管理
- 调用 API

**示例**:
```typescript
// src/features/user-profile/components/UserHeader.tsx
import { Button } from '@/components/ui/button'
import { useUpdateUser } from '../hooks/useUpdateUser'
import type { User } from '../types/user.types'

interface UserHeaderProps {
  user: User
}

export function UserHeader({ user }: UserHeaderProps) {
  const [isEditing, setIsEditing] = useState(false)
  const updateUser = useUpdateUser()

  const handleSave = (data: UpdateUserDto) => {
    updateUser.mutate({ id: user.id, data })
    setIsEditing(false)
  }

  return (
    <header className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold">{user.name}</h1>
        <p className="text-gray-600">{user.bio}</p>
      </div>
      {!isEditing ? (
        <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
      ) : (
        <EditForm user={user} onSave={handleSave} />
      )}
    </header>
  )
}
```

### 3. Common 层 - 通用组件

**职责**:
- 跨功能复用
- 封装通用逻辑
- 提供一致的 UI

**示例**:
```typescript
// src/components/common/ProtectedRoute.tsx
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/features/auth/hooks/useAuth'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) return <LoadingSpinner />
  if (!isAuthenticated) return <Navigate to="/login" replace />

  return <>{children}</>
}
```

### 4. UI 层 - 基础组件

**职责**:
- 提供基础 UI 组件
- 无业务逻辑
- 高度可定制

**示例**（shadcn/ui）:
```typescript
// src/components/ui/button.tsx
import { cn } from '@/lib/cn'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    return (
      <button
        className={cn(
          'inline-flex items-center justify-center rounded-md font-medium',
          'focus-visible:outline-none focus-visible:ring-2',
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
```

---

## 🔄 状态管理架构

### 状态分类

```
状态类型：
1. 服务端状态 - TanStack Query
2. 客户端状态 - Zustand
3. URL 状态 - React Router
4. 表单状态 - React Hook Form
5. 组件状态 - useState/useReducer
```

### 1. 服务端状态（TanStack Query）

**用于**：从服务器获取的数据

```typescript
// src/features/user-profile/hooks/useUserProfile.ts
import { useQuery } from '@tanstack/react-query'
import { userApi } from '../api/userApi'

export function useUserProfile(userId: string) {
  return useQuery({
    queryKey: ['user', userId],
    queryFn: () => userApi.getUser(userId),
    staleTime: 5 * 60 * 1000, // 5 分钟内不重新请求
    gcTime: 10 * 60 * 1000, // 10 分钟后清除缓存
  })
}

// 修改数据
export function useUpdateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: userApi.updateUser,
    onSuccess: (_, { id }) => {
      // 更新缓存
      queryClient.invalidateQueries({ queryKey: ['user', id] })
    },
  })
}
```

### 2. 客户端状态（Zustand）

**用于**：应用全局状态（主题、侧边栏等）

```typescript
// src/stores/themeStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface ThemeState {
  theme: 'light' | 'dark'
  setTheme: (theme: 'light' | 'dark') => void
  toggleTheme: () => void
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'light',
      setTheme: (theme) => set({ theme }),
      toggleTheme: () =>
        set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),
    }),
    {
      name: 'theme-storage',
    }
  )
)

// 使用
function ThemeToggle() {
  const { theme, toggleTheme } = useThemeStore()
  return <Button onClick={toggleTheme}>{theme}</Button>
}
```

### 3. URL 状态（React Router）

**用于**：与 URL 同步的状态（分页、筛选等）

```typescript
// src/features/posts/PostListPage.tsx
import { useSearchParams } from 'react-router-dom'

export function PostListPage() {
  const [searchParams, setSearchParams] = useSearchParams()

  const page = parseInt(searchParams.get('page') || '1', 10)
  const search = searchParams.get('search') || ''

  const handlePageChange = (newPage: number) => {
    setSearchParams({ page: newPage.toString(), search })
  }

  const handleSearchChange = (newSearch: string) => {
    setSearchParams({ page: '1', search: newSearch })
  }

  return (
    <div>
      <SearchInput value={search} onChange={handleSearchChange} />
      <PostList page={page} search={search} />
      <Pagination page={page} onPageChange={handlePageChange} />
    </div>
  )
}
```

### 4. 表单状态（React Hook Form）

**用于**：表单输入和验证

```typescript
// src/features/user-profile/components/EditProfileForm.tsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  bio: z.string().max(200, 'Bio must be less than 200 characters'),
})

type FormData = z.infer<typeof schema>

export function EditProfileForm({ user, onSave }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: user,
  })

  const onSubmit = async (data: FormData) => {
    await onSave(data)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Input {...register('name')} error={errors.name?.message} />
      <Input {...register('email')} error={errors.email?.message} />
      <Textarea {...register('bio')} error={errors.bio?.message} />
      <Button type="submit" disabled={isSubmitting}>
        Save
      </Button>
    </form>
  )
}
```

---

## 🛣️ 路由架构

### 路由配置

```typescript
// src/app/router.tsx
import { createBrowserRouter } from 'react-router-dom'
import { RootLayout } from '@/components/layout/RootLayout'
import { ProtectedRoute } from '@/components/common/ProtectedRoute'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    errorElement: <ErrorPage />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: 'login',
        element: <LoginPage />,
      },
      {
        path: 'register',
        element: <RegisterPage />,
      },
      {
        path: 'users/:userId',
        element: (
          <ProtectedRoute>
            <UserProfilePage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'posts',
        children: [
          {
            index: true,
            element: <PostListPage />,
          },
          {
            path: ':postId',
            element: <PostDetailPage />,
          },
        ],
      },
    ],
  },
])
```

### 代码分割

```typescript
// 路由懒加载
import { lazy, Suspense } from 'react'

const UserProfilePage = lazy(() => import('@/features/user-profile/UserProfilePage'))

// 在路由中使用
{
  path: 'users/:userId',
  element: (
    <Suspense fallback={<LoadingSpinner />}>
      <UserProfilePage />
    </Suspense>
  ),
}
```

---

## 🌐 API 集成模式

### API 客户端

```typescript
// src/lib/api-client.ts
import axios from 'axios'

export const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 请求拦截器
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 响应拦截器
client.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)
```

### API 层设计

```typescript
// src/features/user-profile/api/userApi.ts
import { client } from '@/lib/api-client'
import type { User, UpdateUserDto } from '../types/user.types'

export const userApi = {
  getUser: async (id: string): Promise<User> => {
    return client.get(`/users/${id}`)
  },

  updateUser: async ({ id, data }: { id: string; data: UpdateUserDto }): Promise<User> => {
    return client.patch(`/users/${id}`, data)
  },

  deleteUser: async (id: string): Promise<void> => {
    return client.delete(`/users/${id}`)
  },
}
```

---

## 📝 类型系统设计

### 类型组织

```typescript
// src/features/user-profile/types/user.types.ts

// 基础类型
export interface User {
  id: string
  name: string
  email: string
  avatar: string
  bio: string
  createdAt: string
}

// DTO（Data Transfer Object）
export interface UpdateUserDto {
  name?: string
  bio?: string
  avatar?: string
}

export interface CreateUserDto {
  name: string
  email: string
  password: string
}

// API 响应类型
export interface UserResponse {
  user: User
}

export interface UsersResponse {
  users: User[]
  total: number
  page: number
}
```

### 类型复用

```typescript
// 使用 Pick 和 Omit
export type UserPreview = Pick<User, 'id' | 'name' | 'avatar'>
export type UserWithoutId = Omit<User, 'id'>

// 使用 Partial 和 Required
export type PartialUser = Partial<User>
export type RequiredUser = Required<User>
```

---

## ⚡ 性能优化策略

### 1. 代码分割

```typescript
// 路由懒加载
const UserProfilePage = lazy(() => import('./UserProfilePage'))

// 组件懒加载（大型组件）
const Chart = lazy(() => import('./Chart'))
```

### 2. 组件优化

```typescript
// React.memo - 防止不必要的重渲染
export const UserCard = memo(({ user }: Props) => {
  return <div>{user.name}</div>
}, (prevProps, nextProps) => {
  // 自定义比较函数
  return prevProps.user.id === nextProps.user.id
})

// useMemo - 缓存计算结果
const sortedUsers = useMemo(() => {
  return users.sort((a, b) => a.name.localeCompare(b.name))
}, [users])

// useCallback - 缓存回调函数
const handleClick = useCallback((id: string) => {
  console.log('Clicked:', id)
}, [])
```

### 3. 虚拟滚动

```typescript
// 使用 react-window 处理长列表
import { FixedSizeList } from 'react-window'

function LongList({ items }: Props) {
  return (
    <FixedSizeList
      height={600}
      itemCount={items.length}
      itemSize={50}
      width="100%"
    >
      {({ index, style }) => (
        <div style={style}>
          {items[index].name}
        </div>
      )}
    </FixedSizeList>
  )
}
```

---

## 🧪 测试策略

### 单元测试

```typescript
// src/hooks/useDebounce.test.ts
import { renderHook, waitFor } from '@testing-library/react'
import { useDebounce } from './useDebounce'

describe('useDebounce', () => {
  it('should debounce value', async () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 500),
      { initialProps: { value: 'initial' } }
    )

    expect(result.current).toBe('initial')

    rerender({ value: 'updated' })
    expect(result.current).toBe('initial') // 还未更新

    await waitFor(() => {
      expect(result.current).toBe('updated') // 500ms 后更新
    }, { timeout: 600 })
  })
})
```

### 组件测试

```typescript
// src/features/user-profile/UserProfilePage.test.tsx
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { UserProfilePage } from './UserProfilePage'

describe('UserProfilePage', () => {
  it('should display user profile', async () => {
    const queryClient = new QueryClient()

    render(
      <QueryClientProvider client={queryClient}>
        <UserProfilePage />
      </QueryClientProvider>
    )

    expect(screen.getByText('Loading...')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
    })
  })
})
```

---

## 📚 相关文档

- [开发工作流](./development-workflow.md) - 六阶段开发流程
- [需求文档模板](./templates/requirement-template.md) - 标准需求文档
- [组件设计模板](./templates/component-template.md) - 组件设计文档
- [ADR 模板](./templates/adr-template.md) - 技术决策记录

---

**最后更新**: 2025-12-24
