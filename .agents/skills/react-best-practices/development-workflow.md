# React 开发工作流程

**版本**: v1.0.0
**更新日期**: 2025-12-25

本文档定义了 React 项目的标准开发工作流程，整合了工程实践和 UI 设计。

---

## 🔄 核心工作流

```
1. 需求分析 → 理解功能需求和用户场景

2. 架构设计 → 使用 react-best-practices
   - Feature-Based 目录结构
   - 状态管理方案（TanStack Query / Zustand）
   - 路由设计
   - API 集成方式

3. UI 设计 → 🎨 使用 frontend-design skill
   ⚠️ 关键：在实现 UI 前，先进行设计思考

   - 确定审美方向（极简、编辑、复古等）
   - 选择字体组合和配色方案
   - 设计布局和视觉层级
   - 规划页面动效和交互

4. 技术实现 → 使用 react-best-practices
   - 组件开发（Types → Components → Pages）
   - 状态管理集成
   - API 调用和数据获取
   - 路由配置

5. 测试验证
   - 单元测试（组件、Hooks、工具函数）
   - 集成测试
   - 性能测试
   - 可访问性测试

6. 代码审查
   - 工程实践审查
   - UI 设计审查
```

---

## 📋 详细流程

### 第一步：需求分析

**目标**：理解要实现的功能和用户场景

**输出**：
- 功能需求文档（可选，复杂功能需要）
- 用户故事
- 功能边界

**判断是否需要文档**：
- ✅ 新功能、多页面、影响架构 → 需要文档
- ❌ 简单修改、单组件、样式调整 → 不需要文档

---

### 第二步：架构设计

**目标**：设计技术方案和代码结构

**使用 skill**：react-best-practices

**设计内容**：

#### 1. 目录结构设计
```
features/users/
  ├── pages/               # 页面组件
  │   ├── user-list-page.tsx
  │   └── user-detail-page.tsx
  ├── components/          # 功能专属组件
  │   ├── user-card.tsx
  │   ├── user-filters.tsx
  │   └── user-form.tsx
  ├── hooks/               # 自定义 Hooks
  │   ├── use-users.ts
  │   └── use-user-form.ts
  ├── api/                 # API 调用
  │   └── user-api.ts
  └── types/               # 类型定义
      └── user.ts
```

#### 2. 状态管理方案

- **服务端数据** → TanStack Query
  - 用户列表、用户详情
  - 自动缓存、自动重新验证

- **客户端数据** → Zustand / useState
  - 筛选条件、UI 状态
  - 轻量、简单的状态

#### 3. 路由设计
```tsx
/users          → UserListPage
/users/:id      → UserDetailPage
/users/new      → CreateUserPage
/users/:id/edit → EditUserPage
```

---

### 第三步：UI 设计

**目标**：设计独特、有创意的用户界面

**使用 skill**：frontend-design

⚠️ **关键**：在编写 UI 代码前，先进行设计思考，避免通用化的界面。

#### 提示词模板

```
使用 frontend-design skill 为 [页面名称] 设计 UI。

背景信息：
- 品牌定位：[现代 SaaS / 创意工作室 / 企业应用 / 等]
- 目标受众：[专业人士 / 年轻人 / 艺术家 / 等]
- 想传达的感觉：[专业、创新 / 优雅、精致 / 活力、有趣 / 等]

设计偏好：
- 审美方向：[精致极简 / 编辑杂志 / 复古未来 / 有机自然 / 工业风 / 极繁主义]
- 避免：通用 AI 美学（Inter 字体、紫色渐变、千篇一律的布局）

具体需求：
- [描述页面的主要内容和功能]
```

#### 设计产出

frontend-design skill 会帮你：
1. **确定审美方向** - 基于品牌和受众推荐合适的风格
2. **选择字体组合** - 独特的显示字体 + 可读的正文字体
3. **设计配色方案** - 避免陈词滥调，有特色的配色
4. **设计布局** - 创意的、非常规的布局方案
5. **实现动效** - 有影响力的关键动效（页面加载、转场）
6. **生成代码** - 完整的组件代码（React + Tailwind CSS）

#### 设计示例

**场景**：用户列表页面

**提示词**：
```
使用 frontend-design skill 为用户列表页面设计 UI。
品牌：现代 SaaS 产品，受众：专业人士，
感觉：专业、创新，审美：精致极简或编辑杂志风格
```

**设计产出**：
- 审美方向：编辑杂志风格
- 字体：Syne（标题）+ Sentient（正文）
- 配色：#f5f5f0（背景）+ #1a1a1a（文字）+ #d4002a（强调）
- 布局：超大标题、非对称双栏、充足留白
- 动效：页面加载的编排动画（标题 → 筛选 → 列表依次出现）
- 代码：完整的 UserListPage 组件

---

### 第四步：技术实现

**目标**：基于设计实现功能

**使用 skill**：react-best-practices

#### 实现顺序

```
1. 类型定义（types/user.ts）
   ↓
2. API 客户端（api/user-api.ts）
   ↓
3. 自定义 Hooks（hooks/use-users.ts）
   ↓
4. UI 组件（components/）
   - 使用 frontend-design 生成的代码
   - 或基于设计方案实现
   ↓
5. 页面组装（pages/）
   - 整合组件、Hooks、状态管理
   ↓
6. 路由配置（router.tsx）
```

#### 代码示例

**1. 类型定义**
```tsx
// features/users/types/user.ts
export interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'user'
  createdAt: string
}

export interface CreateUserDto {
  name: string
  email: string
  password: string
}
```

**2. API 客户端**
```tsx
// features/users/api/user-api.ts
import { apiClient } from '@/api/client'
import { User, CreateUserDto } from '../types/user'

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
}
```

**3. 自定义 Hooks**
```tsx
// features/users/hooks/use-users.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { userApi } from '../api/user-api'

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: userApi.getAll,
  })
}

export function useCreateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: userApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}
```

**4. 组件实现**
```tsx
// features/users/pages/user-list-page.tsx
import { useUsers } from '../hooks/use-users'
import { UserCard } from '../components/user-card'

// 使用 frontend-design 生成的设计代码
export function UserListPage() {
  const { data: users, isLoading } = useUsers()

  if (isLoading) return <Loading />

  return (
    <div className="min-h-screen bg-[#f5f5f0]">
      {/* frontend-design 生成的布局和样式 */}
      <h1 className="font-display text-[clamp(3rem,8vw,6rem)]">
        用户列表
      </h1>

      <div className="grid gap-4">
        {users?.map(user => (
          <UserCard key={user.id} user={user} />
        ))}
      </div>
    </div>
  )
}
```

---

### 第五步：测试验证

**目标**：确保功能正确、性能良好

#### 测试类型

**1. 组件测试**
```tsx
// features/users/components/user-card.test.tsx
import { render, screen } from '@testing-library/react'
import { UserCard } from './user-card'

describe('UserCard', () => {
  it('renders user information', () => {
    const user = {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      role: 'user',
      createdAt: '2024-01-01',
    }

    render(<UserCard user={user} />)

    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('john@example.com')).toBeInTheDocument()
  })
})
```

**2. Hooks 测试**
```tsx
// features/users/hooks/use-users.test.ts
import { renderHook, waitFor } from '@testing-library/react'
import { useUsers } from './use-users'

describe('useUsers', () => {
  it('fetches users', async () => {
    const { result } = renderHook(() => useUsers())

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toHaveLength(3)
  })
})
```

**3. 性能测试**
- 检查不必要的重渲染
- 检查 bundle 大小
- 测试加载速度

---

### 第六步：代码审查

#### 工程实践审查

- [ ] 代码结构是否符合 Feature-Based 架构？
- [ ] 状态管理是否合理（服务端 vs 客户端）？
- [ ] 类型定义是否完整？
- [ ] 组件是否可复用？
- [ ] 是否有单元测试？
- [ ] 性能是否优化（memo、懒加载）？

#### UI 设计审查

- [ ] 是否有明确的审美方向？
- [ ] 字体是否独特（非 Inter/Roboto）？
- [ ] 配色是否有特色（非紫色渐变）？
- [ ] 布局是否有创意？
- [ ] 动效是否有影响力？
- [ ] 视觉细节是否精致？

---

## 🎯 实际案例

### 案例：用户管理功能

#### 需求
创建一个用户管理功能，包括用户列表、用户详情、创建用户。

#### 流程

**1. 需求分析**
- 功能：列表、详情、创建
- 用户：管理员

**2. 架构设计**（react-best-practices）
```
features/users/
  ├── pages/
  │   ├── user-list-page.tsx
  │   ├── user-detail-page.tsx
  │   └── create-user-page.tsx
  ├── components/
  │   ├── user-card.tsx
  │   ├── user-filters.tsx
  │   └── user-form.tsx
  ├── hooks/
  │   ├── use-users.ts
  │   └── use-user-form.ts
  ├── api/
  │   └── user-api.ts
  └── types/
      └── user.ts
```

**3. UI 设计**（frontend-design）

提示词：
```
使用 frontend-design skill 为用户列表页面设计 UI。
品牌：企业级 SaaS 产品，受众：IT 管理员，
感觉：专业、可靠、高效，审美：精致极简
```

设计产出：
- 审美：精致极简
- 字体：Cabinet Grotesk + Synonym
- 配色：黑白灰 + 蓝色强调
- 布局：网格、对齐、留白
- 动效：简洁的淡入淡出

**4. 技术实现**（react-best-practices）
- 实现 API 客户端
- 创建 Hooks（useUsers、useCreateUser）
- 实现组件（基于 frontend-design 的代码）
- 组装页面
- 配置路由

**5. 测试**
- 组件测试
- Hooks 测试
- 端到端测试

**6. 审查**
- 工程实践审查通过 ✅
- UI 设计审查通过 ✅

---

## 💡 最佳实践

### Do's ✅

1. **先设计后实现** - 不要直接写代码，先用 frontend-design 设计 UI
2. **保持一致** - 同一项目使用统一的审美方向
3. **分离关注点** - 工程用 react-best-practices，设计用 frontend-design
4. **测试驱动** - 为关键组件和 Hooks 编写测试
5. **性能优先** - 注意代码分割、懒加载、memoization

### Don'ts ❌

1. **不要跳过设计** - 直接写代码容易陷入通用化
2. **不要混合职责** - 组件不要既管状态又管样式又管逻辑
3. **不要过度优化** - 先测量性能再优化
4. **不要忽略测试** - 至少测试核心功能
5. **不要硬编码** - 使用环境变量和配置文件

---

## 📚 相关文档

- **React 核心实践**：[SKILL.md](SKILL.md)
- **架构设计指南**：[architecture-design.md](architecture-design.md)
- **UI 设计指导**：使用 frontend-design skill
- **模板文件**：[templates/](templates/)

---

**最后更新**：2025-12-25
**维护者**：Claude Code Skills
