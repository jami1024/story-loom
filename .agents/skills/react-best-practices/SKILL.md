---
name: react-best-practices
description: 当用户需要创建 React 项目、构建前端应用、组织 React 代码结构时使用。触发词：React、前端项目、React 架构、shadcn/ui、前端开发
---

# React + shadcn/ui 最佳实践指南

**版本**: v1.0.0
**更新日期**: 2025-12-24

本文档是 React + shadcn/ui 开发的核心实践指南。

---

## 🤝 与 frontend-design skill 协同

本 skill 专注于 **React 工程实践**（架构、状态管理、性能、测试）。

对于 **UI 设计和视觉实现**（字体、配色、布局、动效），建议配合使用 **frontend-design skill**。

### 何时使用 frontend-design

- ✅ 创建新页面或组件，需要设计独特的 UI
- ✅ 需要选择字体、配色、审美方向
- ✅ 实现页面动效和交互动画
- ✅ 定制 shadcn/ui 组件的视觉样式
- ✅ 避免通用 AI 美学（Inter 字体、紫色渐变等）

### 协同提示词示例

```
# 初始化项目（react-best-practices）
"创建一个 React + TypeScript + shadcn/ui 项目"

# 设计 UI（frontend-design）
"使用 frontend-design skill 为用户列表页设计 UI，
品牌：现代 SaaS，受众：专业人士，
感觉：专业、创新，审美：精致极简"

# 继续开发（react-best-practices）
"添加用户详情页，包括数据获取和状态管理"
```

---

## 目录

1. [项目初始化](#项目初始化)
2. [目录结构](#目录结构)
3. [组件开发](#组件开发)
4. [状态管理](#状态管理)
5. [数据获取](#数据获取)
6. [表单处理](#表单处理)
7. [路由管理](#路由管理)
8. [样式规范](#样式规范)
9. [性能优化](#性能优化)
10. [测试策略](#测试策略)

---

## 项目初始化

### 使用 Vite 创建项目

```bash
# 创建项目
npm create vite@latest my-app -- --template react-ts
cd my-app
npm install

# 安装 Tailwind CSS
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# 安装 shadcn/ui
npx shadcn-ui@latest init

# 安装核心依赖
npm install react-router-dom @tanstack/react-query zustand
npm install react-hook-form @hookform/resolvers zod
npm install axios
npm install -D @types/node
```

### 配置文件

**tsconfig.json**:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

**vite.config.ts**:
```ts
import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
```

---

## 目录结构

### Feature-Based 架构

```
src/
├── api/                      # API 客户端
│   ├── client.ts            # Axios 配置
│   └── types.ts             # API 通用类型
├── components/              # 全局组件
│   ├── ui/                 # shadcn/ui 组件
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   └── ...
│   ├── layout/             # 布局组件
│   │   ├── header.tsx
│   │   ├── sidebar.tsx
│   │   └── footer.tsx
│   └── common/             # 通用组件
│       ├── loading.tsx
│       ├── error-fallback.tsx
│       └── empty-state.tsx
├── features/               # 功能模块
│   ├── auth/
│   │   ├── api/           # 认证 API
│   │   ├── components/    # 认证组件
│   │   ├── hooks/         # 认证 Hooks
│   │   ├── stores/        # 认证状态
│   │   ├── types/         # 认证类型
│   │   └── pages/         # 认证页面
│   └── users/
│       ├── api/
│       │   └── user-api.ts
│       ├── components/
│       │   ├── user-list.tsx
│       │   ├── user-form.tsx
│       │   └── user-card.tsx
│       ├── hooks/
│       │   ├── use-users.ts
│       │   └── use-user-form.ts
│       ├── types/
│       │   └── user.ts
│       └── pages/
│           ├── user-list-page.tsx
│           └── user-detail-page.tsx
├── hooks/                  # 全局 Hooks
│   ├── use-toast.ts
│   ├── use-theme.ts
│   └── use-media-query.ts
├── lib/                    # 工具库
│   └── utils.ts
├── stores/                 # 全局状态
│   ├── auth-store.ts
│   └── theme-store.ts
├── types/                  # 全局类型
│   └── common.ts
├── utils/                  # 工具函数
│   ├── format.ts
│   └── validation.ts
├── App.tsx
├── main.tsx
└── router.tsx
```

---

## 组件开发

### 组件模板

```tsx
// src/features/users/components/user-card.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { User } from "../types/user"

interface UserCardProps {
  user: User
  onEdit?: (user: User) => void
  onDelete?: (id: string) => void
}

export function UserCard({ user, onEdit, onDelete }: UserCardProps) {
  const handleEdit = () => {
    onEdit?.(user)
  }

  const handleDelete = () => {
    onDelete?.(user.id)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{user.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{user.email}</p>
        <div className="mt-4 flex gap-2">
          <Button onClick={handleEdit} variant="outline" size="sm">
            编辑
          </Button>
          <Button onClick={handleDelete} variant="destructive" size="sm">
            删除
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
```

### 组件规范

#### 1. 命名规范

```tsx
// ✅ 好的命名
export function UserList() {}
export function UserDetailPage() {}
export function useUserQuery() {}

// ❌ 不好的命名
export function List() {}
export function page() {}
export function useData() {}
```

#### 2. Props 类型定义

```tsx
// ✅ 使用 interface 定义 Props
interface UserListProps {
  users: User[]
  loading?: boolean
  onUserClick?: (user: User) => void
}

// ✅ 可选的 Props 使用 ?
// ✅ 回调函数命名以 on 开头
```

#### 3. 组件拆分原则

```tsx
// ❌ 不好：一个组件做太多事情
function UserPage() {
  // 100+ 行代码
}

// ✅ 好：拆分为多个小组件
function UserPage() {
  return (
    <div>
      <UserHeader />
      <UserFilters />
      <UserList />
      <UserPagination />
    </div>
  )
}
```

---

## 状态管理

### TanStack Query（服务端状态）

用于管理服务端数据（API 调用、缓存）。

**配置**:
```tsx
// src/main.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 分钟
      retry: 3,
    },
  },
})

root.render(
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>
)
```

**使用示例**:
```tsx
// src/features/users/hooks/use-users.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { userApi } from '../api/user-api'
import { User } from '../types/user'

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: userApi.getAll,
  })
}

export function useUser(id: string) {
  return useQuery({
    queryKey: ['users', id],
    queryFn: () => userApi.getById(id),
    enabled: !!id,
  })
}

export function useCreateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: userApi.create,
    onSuccess: () => {
      // 重新获取列表数据
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}

export function useUpdateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<User> }) =>
      userApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.invalidateQueries({ queryKey: ['users', id] })
    },
  })
}

export function useDeleteUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: userApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}
```

### Zustand（客户端状态）

用于管理客户端状态（主题、用户信息等）。

```tsx
// src/stores/auth-store.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AuthState {
  user: User | null
  token: string | null
  login: (user: User, token: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      login: (user, token) => set({ user, token }),
      logout: () => set({ user: null, token: null }),
    }),
    {
      name: 'auth-storage',
    }
  )
)

// 使用
function UserProfile() {
  const { user, logout } = useAuthStore()

  if (!user) return <div>请登录</div>

  return (
    <div>
      <p>{user.name}</p>
      <button onClick={logout}>退出</button>
    </div>
  )
}
```

---

## 数据获取

### API 客户端配置

```tsx
// src/api/client.ts
import axios from 'axios'
import { useAuthStore } from '@/stores/auth-store'

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  timeout: 10000,
})

// 请求拦截器
apiClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// 响应拦截器
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)
```

### API 服务层

```tsx
// src/features/users/api/user-api.ts
import { apiClient } from '@/api/client'
import { User, CreateUserDto, UpdateUserDto } from '../types/user'

export const userApi = {
  getAll: async (): Promise<User[]> => {
    return apiClient.get('/users')
  },

  getById: async (id: string): Promise<User> => {
    return apiClient.get(`/users/${id}`)
  },

  create: async (data: CreateUserDto): Promise<User> => {
    return apiClient.post('/users', data)
  },

  update: async (id: string, data: UpdateUserDto): Promise<User> => {
    return apiClient.put(`/users/${id}`, data)
  },

  delete: async (id: string): Promise<void> => {
    return apiClient.delete(`/users/${id}`)
  },
}
```

### 类型定义

```tsx
// src/features/users/types/user.ts
export interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'user'
  createdAt: string
  updatedAt: string
}

export interface CreateUserDto {
  name: string
  email: string
  password: string
  role?: 'admin' | 'user'
}

export interface UpdateUserDto {
  name?: string
  email?: string
  role?: 'admin' | 'user'
}
```

---

## 表单处理

### React Hook Form + Zod

```tsx
// src/features/users/components/user-form.tsx
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"

const formSchema = z.object({
  name: z.string().min(2, "名称至少 2 个字符").max(50),
  email: z.string().email("邮箱格式不正确"),
  password: z.string().min(8, "密码至少 8 个字符"),
})

type FormValues = z.infer<typeof formSchema>

interface UserFormProps {
  onSubmit: (values: FormValues) => void
  defaultValues?: Partial<FormValues>
  loading?: boolean
}

export function UserForm({ onSubmit, defaultValues, loading }: UserFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      ...defaultValues,
    },
  })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>姓名</FormLabel>
              <FormControl>
                <Input placeholder="请输入姓名" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>邮箱</FormLabel>
              <FormControl>
                <Input type="email" placeholder="请输入邮箱" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>密码</FormLabel>
              <FormControl>
                <Input type="password" placeholder="请输入密码" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={loading}>
          {loading ? "提交中..." : "提交"}
        </Button>
      </form>
    </Form>
  )
}
```

### 表单使用示例

```tsx
// src/features/users/pages/create-user-page.tsx
import { UserForm } from "../components/user-form"
import { useCreateUser } from "../hooks/use-users"
import { useNavigate } from "react-router-dom"
import { useToast } from "@/hooks/use-toast"

export function CreateUserPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { mutate: createUser, isPending } = useCreateUser()

  const handleSubmit = (values: FormValues) => {
    createUser(values, {
      onSuccess: () => {
        toast({
          title: "成功",
          description: "用户创建成功",
        })
        navigate("/users")
      },
      onError: (error) => {
        toast({
          variant: "destructive",
          title: "错误",
          description: error.message,
        })
      },
    })
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">创建用户</h1>
      <UserForm onSubmit={handleSubmit} loading={isPending} />
    </div>
  )
}
```

---

## 路由管理

### React Router v6

```tsx
// src/router.tsx
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { Layout } from './components/layout/layout'
import { UserListPage } from './features/users/pages/user-list-page'
import { UserDetailPage } from './features/users/pages/user-detail-page'
import { CreateUserPage } from './features/users/pages/create-user-page'
import { LoginPage } from './features/auth/pages/login-page'
import { ProtectedRoute } from './components/common/protected-route'

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/users" replace />,
      },
      {
        path: 'users',
        children: [
          { index: true, element: <UserListPage /> },
          { path: 'new', element: <CreateUserPage /> },
          { path: ':id', element: <UserDetailPage /> },
        ],
      },
    ],
  },
])
```

### 路由守卫

```tsx
// src/components/common/protected-route.tsx
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth-store'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { token } = useAuthStore()
  const location = useLocation()

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}
```

---

## 样式规范

### Tailwind CSS 使用规范

```tsx
// ✅ 好的做法
<div className="flex items-center justify-between p-4 bg-white rounded-lg shadow">
  <h2 className="text-xl font-bold text-gray-900">标题</h2>
  <Button variant="outline" size="sm">操作</Button>
</div>

// ❌ 避免过长的 className
<div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 border border-gray-200">
  {/* 过长，难以阅读 */}
</div>

// ✅ 提取为组件或使用 cn 工具
const cardClass = cn(
  "flex items-center justify-between p-4",
  "bg-white rounded-lg shadow-md",
  "hover:shadow-lg transition-shadow duration-200",
  "border border-gray-200"
)

<div className={cardClass}>
  {/* ... */}
</div>
```

### cn 工具函数

```tsx
// src/lib/utils.ts
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// 使用
<Button
  className={cn(
    "bg-primary",
    isActive && "bg-primary-dark",
    disabled && "opacity-50 cursor-not-allowed"
  )}
/>
```

---

## 性能优化

### 1. React.memo

```tsx
// ✅ 使用 memo 优化列表项
export const UserCard = React.memo(({ user, onEdit, onDelete }: UserCardProps) => {
  return (
    <Card>
      {/* ... */}
    </Card>
  )
})
```

### 2. useMemo / useCallback

```tsx
function UserList({ users }: UserListProps) {
  // ✅ 缓存计算结果
  const sortedUsers = useMemo(() => {
    return [...users].sort((a, b) => a.name.localeCompare(b.name))
  }, [users])

  // ✅ 缓存回调函数
  const handleUserClick = useCallback((user: User) => {
    console.log(user)
  }, [])

  return (
    <div>
      {sortedUsers.map(user => (
        <UserCard key={user.id} user={user} onClick={handleUserClick} />
      ))}
    </div>
  )
}
```

### 3. 代码分割

```tsx
// ✅ 使用 React.lazy 懒加载
const UserDetailPage = React.lazy(() => import('./pages/user-detail-page'))

// 在路由中使用
{
  path: ':id',
  element: (
    <Suspense fallback={<Loading />}>
      <UserDetailPage />
    </Suspense>
  ),
}
```

### 4. 虚拟滚动

```tsx
import { useVirtualizer } from '@tanstack/react-virtual'

function UserList({ users }: { users: User[] }) {
  const parentRef = useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    count: users.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80,
  })

  return (
    <div ref={parentRef} className="h-[600px] overflow-auto">
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => (
          <div
            key={virtualRow.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualRow.size}px`,
              transform: `translateY(${virtualRow.start}px)`,
            }}
          >
            <UserCard user={users[virtualRow.index]} />
          </div>
        ))}
      </div>
    </div>
  )
}
```

---

## 测试策略

### 单元测试（Vitest + React Testing Library）

```tsx
// src/features/users/components/user-card.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { UserCard } from './user-card'

describe('UserCard', () => {
  const mockUser = {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'user' as const,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  }

  it('renders user information', () => {
    render(<UserCard user={mockUser} />)

    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('john@example.com')).toBeInTheDocument()
  })

  it('calls onEdit when edit button is clicked', () => {
    const onEdit = vi.fn()
    render(<UserCard user={mockUser} onEdit={onEdit} />)

    fireEvent.click(screen.getByText('编辑'))
    expect(onEdit).toHaveBeenCalledWith(mockUser)
  })

  it('calls onDelete when delete button is clicked', () => {
    const onDelete = vi.fn()
    render(<UserCard user={mockUser} onDelete={onDelete} />)

    fireEvent.click(screen.getByText('删除'))
    expect(onDelete).toHaveBeenCalledWith('1')
  })
})
```

---

## 最佳实践总结

### ✅ Do's

1. **组件化优先** - 拆分小而专注的组件
2. **类型安全** - 所有 Props 和返回值都定义类型
3. **Hooks 抽象** - 将业务逻辑抽取到自定义 Hooks
4. **错误处理** - 使用 Error Boundary 和 Try-Catch
5. **Loading 状态** - 明确显示加载状态
6. **性能优化** - 合理使用 memo、useMemo、useCallback
7. **代码分割** - 使用 React.lazy 懒加载
8. **测试覆盖** - 关键组件和逻辑有测试

### ❌ Don'ts

1. **避免过度嵌套** - 组件层级不超过 5 层
2. **避免巨型组件** - 单个组件不超过 200 行
3. **避免 Props 钻取** - 超过 3 层使用 Context 或状态管理
4. **避免内联样式** - 使用 Tailwind CSS
5. **避免直接修改状态** - 使用不可变更新
6. **避免在循环中定义函数** - 使用 useCallback
7. **避免过度优化** - 先测量性能再优化
8. **避免忽略 key** - 列表渲染必须有唯一 key

---

## 参考资料

- [React 官方文档](https://react.dev/)
- [shadcn/ui 文档](https://ui.shadcn.com/)
- [TanStack Query 文档](https://tanstack.com/query)
- [React Hook Form 文档](https://react-hook-form.com/)
- [Tailwind CSS 文档](https://tailwindcss.com/)
