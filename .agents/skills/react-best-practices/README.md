# React 最佳实践 Skill

基于现代 React 生态和 shadcn/ui 组件库的企业级前端开发最佳实践。

## 项目简介

本 Skill 总结了 React 18+ 现代化开发的架构模式和最佳实践，使用业界主流技术栈。

## 🤝 Skill 协同使用

本 skill 专注于 **React 工程实践**（架构、状态管理、测试）。对于 **UI 设计和视觉实现**，强烈建议配合使用：

### 📐 frontend-design skill

**适用场景**：
- ✅ 设计新页面或组件的 UI
- ✅ 选择独特的字体和配色方案
- ✅ 实现页面动效和交互
- ✅ 定制 shadcn/ui 组件样式
- ✅ 避免通用 AI 美学（Inter 字体、紫色渐变等）

**协同工作流**：
```
1. 使用 react-best-practices → 创建项目架构
   ├── 运行 init-project.sh
   ├── 搭建 Feature-Based 结构
   └── 配置状态管理、路由

2. 使用 frontend-design → 设计和实现 UI
   ├── 确定审美方向（极简/编辑/复古/等）
   ├── 选择字体和配色方案
   ├── 设计布局和组件
   └── 实现动效和交互

3. 继续使用 react-best-practices → 功能开发
   ├── API 集成
   ├── 状态管理
   └── 测试和优化
```

**使用示例**：
```
# 初始化项目
"创建一个 React 项目，使用 TypeScript 和 shadcn/ui"

# 设计 UI（切换到 frontend-design skill）
"使用 frontend-design skill 为用户列表页面设计 UI。
品牌定位：现代 SaaS 产品，目标受众：专业人士，
想传达：专业、创新的感觉，
审美方向偏好：精致极简或编辑杂志风格"

# 继续开发功能
"添加用户详情页功能，包括数据获取和状态管理"

# 为新页面设计 UI
"使用 frontend-design skill 为用户详情页设计 UI，
保持与列表页一致的审美风格"
```

---

## 主要特性

### 技术栈

- ✅ **React 18+** - 最新的 React 特性（Concurrent、Suspense、Transitions）
- ✅ **TypeScript** - 类型安全，提高代码质量
- ✅ **shadcn/ui** - 基于 Radix UI 的高质量组件库
- ✅ **Tailwind CSS** - 实用优先的 CSS 框架
- ✅ **Vite** - 快速的构建工具
- ✅ **React Router v6** - 声明式路由
- ✅ **TanStack Query** - 强大的数据获取和状态管理
- ✅ **Zustand / Jotai** - 轻量级状态管理
- ✅ **React Hook Form** - 高性能表单库
- ✅ **Zod** - TypeScript 优先的数据验证

### 架构模式

- ✅ **Feature-Based 架构** - 按功能模块组织代码
- ✅ **原子设计模式** - 组件分层设计
- ✅ **Hooks 优先** - 函数式组件和自定义 Hooks
- ✅ **服务层抽象** - API 调用和业务逻辑分离
- ✅ **类型安全** - 全链路 TypeScript 类型定义

### 开发规范

- ✅ **组件规范** - 统一的组件结构和命名
- ✅ **代码规范** - ESLint + Prettier
- ✅ **提交规范** - Conventional Commits
- ✅ **测试覆盖** - Vitest + React Testing Library
- ✅ **性能优化** - Code Splitting、懒加载、Memoization

### UI 功能

- ✅ shadcn/ui 组件集成
- ✅ Dark Mode 支持
- ✅ 响应式设计
- ✅ 国际化 (i18n)
- ✅ 无障碍访问 (a11y)
- ✅ 错误边界
- ✅ Loading 状态管理
- ✅ Toast 通知

## 使用方法

### 自动触发

当你在 React 项目中执行以下操作时，Claude 会自动使用这个 skill：

```bash
# 创建新的 React 项目
"帮我创建一个 React 项目"
"使用 shadcn/ui 创建一个新项目"

# 添加新功能
"添加用户管理页面"
"创建一个表单组件"
"实现深色模式"

# 组件开发
"创建一个 Card 组件"
"优化这个组件的性能"
"添加 loading 状态"

# 架构设计
"设计一个后台管理系统"
"如何组织项目目录结构"
```

### 手动调用

你也可以通过 Skill 工具手动调用：

```
使用 react-best-practices skill 帮我创建一个标准的 React 项目结构
```

## 项目结构

```
.claude/skills/react-best-practices/
├── SKILL.md                          # 核心最佳实践指南（主文件）
├── README.md                         # 本文件
├── init-project.sh                   # 项目初始化脚本
├── development-workflow.md           # 开发工作流和规范
├── architecture-design.md            # 架构设计指南
└── templates/                        # 文档模板
    ├── requirement-template.md       # 需求文档模板
    ├── design-template.md            # 设计文档模板
    ├── component-template.md         # 组件设计模板
    └── architecture-review-checklist.md  # 架构评审清单
```

## 核心原则

### 1. 组件化优先

所有 UI 都是组件，遵循：
- 单一职责原则
- 可复用性设计
- Props 接口清晰
- 状态最小化

### 2. 类型安全

使用 TypeScript 确保类型安全：
- Props 类型定义
- API 响应类型
- 状态类型定义
- 工具函数类型

### 3. 关注点分离

明确的职责划分：
```
Components (展示)
    ↓
Hooks (逻辑)
    ↓
Services (数据)
    ↓
API (接口)
```

### 4. 性能优化

- 使用 React.memo 优化组件
- 使用 useMemo/useCallback 优化计算
- 代码分割和懒加载
- 虚拟滚动处理大列表

### 5. 用户体验

- Loading 状态明确
- 错误处理友好
- 表单验证即时
- 操作反馈及时

## 代码示例

### 1. 创建新页面 (User List)

按照以下顺序实现：

```
1. API 层（数据接口）    - src/services/user.service.ts
   ↓
2. Types（类型定义）     - src/types/user.ts
   ↓
3. Hooks（业务逻辑）     - src/hooks/use-users.ts
   ↓
4. Components（UI 组件） - src/components/user-list.tsx
   ↓
5. Page（页面）          - src/pages/users/index.tsx
   ↓
6. Route（路由）         - src/router.tsx
   ↓
7. Test（测试）          - *.test.tsx
```

### 2. 项目初始化

使用提供的脚本快速初始化项目：

```bash
cd .claude/skills/react-best-practices
bash init-project.sh my-app
```

将创建完整的项目结构，包括：
- Vite 配置
- TypeScript 配置
- shadcn/ui 配置
- ESLint + Prettier
- 目录结构
- 基础组件

### 3. 开发工作流

遵循 development-workflow.md 中定义的流程：

1. **需求分析** - 使用 requirement-template.md
2. **UI 设计** - 设计组件结构和交互
3. **实现计划** - 拆分为小任务
4. **分阶段实现** - 从底层到顶层
5. **测试验证** - 单元测试 + E2E 测试
6. **代码审查** - 使用 architecture-review-checklist.md

## 技术栈选型

### UI 组件库

| 库 | 优势 | 使用场景 |
|------|------|---------|
| shadcn/ui | 可定制、无依赖、Radix UI | 企业级应用 ✅ |
| Ant Design | 组件全、开箱即用 | 后台管理系统 |
| Material-UI | Material Design | Google 风格应用 |

**推荐**: shadcn/ui（本 Skill 使用）

### 状态管理

| 库 | 优势 | 使用场景 |
|-----|------|---------|
| TanStack Query | 服务端状态管理 | 数据获取 ✅ |
| Zustand | 轻量、简单 | 客户端状态 ✅ |
| Jotai | 原子化状态 | 细粒度状态 |
| Redux Toolkit | 强大、生态好 | 大型应用 |

**推荐**: TanStack Query + Zustand

### 表单处理

| 库 | 优势 | 使用场景 |
|------|------|---------|
| React Hook Form | 高性能、无重渲染 | 通用场景 ✅ |
| Formik | 功能全、易用 | 复杂表单 |
| TanStack Form | 类型安全 | TS 项目 |

**推荐**: React Hook Form + Zod

### 路由

| 库 | 优势 | 使用场景 |
|------|------|---------|
| React Router v6 | 官方、功能全 | 通用场景 ✅ |
| TanStack Router | 类型安全 | TS 优先项目 |
| Wouter | 轻量 | 简单应用 |

**推荐**: React Router v6

### 构建工具

| 工具 | 优势 | 使用场景 |
|------|------|---------|
| Vite | 快速、现代 | 新项目 ✅ |
| Create React App | 零配置、稳定 | 快速原型 |
| Next.js | SSR、全栈 | SEO 需求 |

**推荐**: Vite

## 目录结构

```
src/
├── api/                  # API 请求封装
│   ├── client.ts        # API 客户端配置
│   └── endpoints.ts     # API 端点定义
├── components/          # 通用组件
│   ├── ui/             # shadcn/ui 组件
│   ├── layout/         # 布局组件
│   └── common/         # 通用业务组件
├── features/           # 功能模块
│   └── users/
│       ├── api/        # 用户相关 API
│       ├── components/ # 用户相关组件
│       ├── hooks/      # 用户相关 Hooks
│       ├── types/      # 用户类型定义
│       └── pages/      # 用户页面
├── hooks/              # 全局 Hooks
├── lib/                # 工具库
├── services/           # 业务服务层
├── stores/             # 全局状态
├── types/              # 全局类型
├── utils/              # 工具函数
├── App.tsx
└── main.tsx
```

## 架构模式

### Feature-Based 架构

```
feature/
├── api/              # API 调用
├── components/       # 组件
├── hooks/            # 业务逻辑
├── types/            # 类型定义
├── utils/            # 工具函数
└── pages/            # 页面
```

**优点**：
- 按功能组织，易于查找
- 高内聚，低耦合
- 易于维护和重构
- 适合大型项目

### 组件分层

```
Pages（页面）
    ↓
Features（功能组件）
    ↓
Common（通用组件）
    ↓
UI（基础组件）
```

### 数据流

```
User Action
    ↓
Component
    ↓
Hook (useQuery/useMutation)
    ↓
Service Layer
    ↓
API Client
    ↓
Backend
```

## shadcn/ui 集成

### 安装组件

```bash
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add form
npx shadcn-ui@latest add table
```

### 使用示例

```tsx
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

export function UserCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>User Profile</CardTitle>
      </CardHeader>
      <CardContent>
        <Button>Edit Profile</Button>
      </CardContent>
    </Card>
  )
}
```

### 主题定制

```css
/* app/globals.css */
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --primary: 221.2 83.2% 53.3%;
    /* ... */
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    /* ... */
  }
}
```

## 常见问题

### Q1: 什么时候使用 Context vs Zustand?

**Context**:
- 主题、国际化等全局配置
- 不频繁更新的数据
- 组件树较小的局部状态

**Zustand**:
- 频繁更新的状态
- 跨组件共享的业务状态
- 需要持久化的状态

### Q2: 如何优化大列表性能?

1. 使用虚拟滚动（react-window / @tanstack/react-virtual）
2. 分页加载
3. 使用 React.memo 优化列表项
4. 避免在 map 中创建新函数

### Q3: 如何处理表单验证?

推荐使用 React Hook Form + Zod：

```tsx
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

function LoginForm() {
  const form = useForm({
    resolver: zodResolver(schema),
  })
  // ...
}
```

### Q4: 如何处理 API 错误?

使用 TanStack Query 的错误处理：

```tsx
const { data, error, isError } = useQuery({
  queryKey: ['users'],
  queryFn: fetchUsers,
  retry: 3,
  onError: (error) => {
    toast.error(error.message)
  },
})

if (isError) {
  return <ErrorFallback error={error} />
}
```

## 参考项目

### 示例项目

- [shadcn-ui examples](https://github.com/shadcn-ui/ui/tree/main/apps/www/app/examples)
- [Taxonomy](https://github.com/shadcn-ui/taxonomy) - Next.js + shadcn/ui
- [TanStack Query examples](https://tanstack.com/query/latest/docs/react/examples/react/basic)

## 更新记录

### v1.0.0 (2025-12-24)

- ✅ 创建 React + shadcn/ui 最佳实践 Skill
- ✅ 整理现代 React 技术栈
- ✅ Feature-Based 架构设计
- ✅ 完整的开发工作流
- ✅ shadcn/ui 集成指南
- ✅ 提供文档模板和评审清单

## 贡献

本 Skill 基于以下项目的分析和总结：
- [shadcn/ui](https://ui.shadcn.com/)
- [TanStack Query](https://tanstack.com/query)
- [React 官方文档](https://react.dev/)
- [Vite 官方文档](https://vitejs.dev/)

## 许可证

MIT

---

**提示**: 使用此 Skill 时，Claude 会自动参考 SKILL.md 中的最佳实践，并结合 development-workflow.md 和 architecture-design.md 提供完整的开发指导。
