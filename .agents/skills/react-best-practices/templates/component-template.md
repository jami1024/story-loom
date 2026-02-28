# 组件设计文档：[组件名称]

**组件路径**: `src/features/[feature]/components/[component-name].tsx`
**创建日期**: YYYY-MM-DD
**更新日期**: YYYY-MM-DD
**负责人**: [姓名]
**状态**: [草稿 | 开发中 | 已完成 | 已废弃]

---

## 1. 组件概述

### 1.1 用途

简要描述组件的用途和使用场景。

**示例**：
```
UserCard 组件用于展示用户信息卡片，包括用户头像、姓名、邮箱和操作按钮。
主要用于用户列表和用户详情页面。
```

### 1.2 设计目标

- [ ] 可复用性
- [ ] 可定制性
- [ ] 性能优化
- [ ] 无障碍访问
- [ ] 响应式设计

---

## 2. API 设计

### 2.1 Props 定义

```tsx
interface UserCardProps {
  // 必需 Props
  user: User                          // 用户数据对象

  // 可选 Props
  variant?: 'default' | 'compact'     // 卡片样式变体
  showActions?: boolean               // 是否显示操作按钮
  className?: string                  // 自定义样式类名

  // 回调函数
  onEdit?: (user: User) => void       // 编辑回调
  onDelete?: (userId: string) => void // 删除回调
  onClick?: (user: User) => void      // 点击卡片回调
}
```

### 2.2 Props 说明

| Props | 类型 | 必需 | 默认值 | 说明 |
|-------|------|------|--------|------|
| user | User | 是 | - | 用户数据对象 |
| variant | 'default' \| 'compact' | 否 | 'default' | 卡片样式变体 |
| showActions | boolean | 否 | true | 是否显示操作按钮 |
| className | string | 否 | '' | 自定义样式类名 |
| onEdit | (user: User) => void | 否 | - | 编辑按钮点击回调 |
| onDelete | (userId: string) => void | 否 | - | 删除按钮点击回调 |
| onClick | (user: User) => void | 否 | - | 卡片点击回调 |

### 2.3 类型定义

```tsx
// User 类型
interface User {
  id: string
  name: string
  email: string
  avatar?: string
  role: 'admin' | 'user'
  createdAt: string
}
```

---

## 3. 视觉设计

### 3.1 布局结构

```
┌──────────────────────────────────┐
│  [Avatar]  [Name]                │
│            [Email]               │
│            [Role Badge]          │
│                                  │
│  [Edit Button] [Delete Button]  │
└──────────────────────────────────┘
```

### 3.2 变体设计

#### Default 变体
- 完整信息展示
- 包含头像、姓名、邮箱、角色
- 显示操作按钮
- 卡片高度：auto

#### Compact 变体
- 紧凑布局
- 仅显示姓名和邮箱
- 不显示头像
- 卡片高度：64px

### 3.3 状态设计

| 状态 | 说明 | 视觉效果 |
|------|------|----------|
| Default | 默认状态 | 白色背景，灰色边框 |
| Hover | 鼠标悬停 | 阴影加深，边框高亮 |
| Active | 选中状态 | 蓝色边框，浅蓝背景 |
| Disabled | 禁用状态 | 灰色，不可交互 |

---

## 4. 组件实现

### 4.1 基础实现

```tsx
// src/features/users/components/user-card.tsx
import React from 'react'
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { User } from '../types/user'

interface UserCardProps {
  user: User
  variant?: 'default' | 'compact'
  showActions?: boolean
  className?: string
  onEdit?: (user: User) => void
  onDelete?: (userId: string) => void
  onClick?: (user: User) => void
}

export const UserCard = React.memo(function UserCard({
  user,
  variant = 'default',
  showActions = true,
  className,
  onEdit,
  onDelete,
  onClick,
}: UserCardProps) {
  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    onEdit?.(user)
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    onDelete?.(user.id)
  }

  const handleClick = () => {
    onClick?.(user)
  }

  if (variant === 'compact') {
    return (
      <div
        className={cn(
          'flex items-center justify-between p-3 rounded-lg border',
          'hover:bg-accent transition-colors cursor-pointer',
          className
        )}
        onClick={handleClick}
      >
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{user.name}</p>
          <p className="text-sm text-muted-foreground truncate">{user.email}</p>
        </div>
        {showActions && (
          <div className="flex gap-2 ml-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleEdit}
            >
              编辑
            </Button>
          </div>
        )}
      </div>
    )
  }

  return (
    <Card
      className={cn(
        'hover:shadow-lg transition-shadow cursor-pointer',
        className
      )}
      onClick={handleClick}
    >
      <CardHeader className="flex flex-row items-center gap-4">
        <Avatar>
          <AvatarImage src={user.avatar} alt={user.name} />
          <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold truncate">{user.name}</h3>
          <p className="text-sm text-muted-foreground truncate">{user.email}</p>
        </div>
        <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
          {user.role}
        </Badge>
      </CardHeader>

      {showActions && (
        <CardFooter className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleEdit}
            className="flex-1"
          >
            编辑
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            className="flex-1"
          >
            删除
          </Button>
        </CardFooter>
      )}
    </Card>
  )
})
```

### 4.2 样式实现

```tsx
// 使用 Tailwind CSS，样式已内联在组件中
// 使用 shadcn/ui 组件，主题通过 globals.css 配置

// 如需自定义样式，可以添加：
// src/features/users/components/user-card.module.css
```

---

## 5. 使用示例

### 5.1 基础使用

```tsx
import { UserCard } from '@/features/users/components/user-card'

function UserList() {
  const users = useUsers()

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {users.map(user => (
        <UserCard
          key={user.id}
          user={user}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      ))}
    </div>
  )
}
```

### 5.2 Compact 变体

```tsx
<div className="space-y-2">
  {users.map(user => (
    <UserCard
      key={user.id}
      user={user}
      variant="compact"
      onClick={handleUserClick}
    />
  ))}
</div>
```

### 5.3 自定义样式

```tsx
<UserCard
  user={user}
  className="border-primary shadow-lg"
  onEdit={handleEdit}
/>
```

---

## 6. 交互行为

### 6.1 用户交互

| 交互 | 触发条件 | 行为 |
|------|----------|------|
| 点击卡片 | 点击卡片任意区域 | 触发 onClick 回调 |
| 点击编辑按钮 | 点击编辑按钮 | 触发 onEdit 回调 |
| 点击删除按钮 | 点击删除按钮 | 触发 onDelete 回调 |
| 鼠标悬停 | 鼠标移入卡片 | 显示悬停效果 |

### 6.2 事件处理

```tsx
// 编辑处理
const handleEdit = (user: User) => {
  console.log('编辑用户:', user)
  // 打开编辑对话框
  openEditDialog(user)
}

// 删除处理
const handleDelete = (userId: string) => {
  console.log('删除用户:', userId)
  // 显示确认对话框
  if (confirm('确定删除该用户吗？')) {
    deleteUser(userId)
  }
}

// 点击处理
const handleUserClick = (user: User) => {
  console.log('查看用户详情:', user)
  navigate(`/users/${user.id}`)
}
```

---

## 7. 性能优化

### 7.1 优化措施

- ✅ 使用 `React.memo` 避免不必要的重渲染
- ✅ 事件处理使用 `stopPropagation` 阻止事件冒泡
- ✅ 长文本使用 `truncate` 避免布局抖动
- ✅ 图片懒加载（shadcn Avatar 已支持）

### 7.2 性能指标

| 指标 | 目标值 |
|------|--------|
| 首次渲染时间 | < 16ms |
| 重渲染时间 | < 8ms |
| 内存占用 | < 1MB/100 个实例 |

---

## 8. 无障碍访问

### 8.1 ARIA 属性

```tsx
<Card
  role="article"
  aria-labelledby={`user-name-${user.id}`}
  aria-describedby={`user-email-${user.id}`}
>
  <h3 id={`user-name-${user.id}`}>{user.name}</h3>
  <p id={`user-email-${user.id}`}>{user.email}</p>
</Card>
```

### 8.2 键盘导航

- ✅ 支持 Tab 键导航
- ✅ 支持 Enter/Space 键激活
- ✅ 焦点可见性
- ✅ 逻辑顺序正确

---

## 9. 响应式设计

### 9.1 断点设计

| 断点 | 宽度 | 布局 |
|------|------|------|
| Mobile | < 768px | 单列 |
| Tablet | 768px - 1024px | 双列 |
| Desktop | >= 1024px | 三列 |

### 9.2 响应式类名

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <UserCard user={user} />
</div>
```

---

## 10. 测试

### 10.1 单元测试

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

  it('renders compact variant correctly', () => {
    render(<UserCard user={mockUser} variant="compact" />)

    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  it('hides actions when showActions is false', () => {
    render(<UserCard user={mockUser} showActions={false} />)

    expect(screen.queryByText('编辑')).not.toBeInTheDocument()
    expect(screen.queryByText('删除')).not.toBeInTheDocument()
  })
})
```

### 10.2 测试覆盖率

- [ ] Props 渲染测试
- [ ] 事件处理测试
- [ ] 变体渲染测试
- [ ] 条件渲染测试
- [ ] 无障碍测试

---

## 11. 依赖关系

### 11.1 内部依赖

- `@/components/ui/card` - shadcn/ui Card 组件
- `@/components/ui/button` - shadcn/ui Button 组件
- `@/components/ui/avatar` - shadcn/ui Avatar 组件
- `@/components/ui/badge` - shadcn/ui Badge 组件
- `@/lib/utils` - cn 工具函数

### 11.2 外部依赖

- `react` - ^18.0.0
- `class-variance-authority` - ^0.7.0
- `clsx` - ^2.0.0
- `tailwind-merge` - ^2.0.0

---

## 12. 版本历史

| 版本 | 日期 | 变更内容 | 变更人 |
|------|------|----------|--------|
| v1.0.0 | 2024-12-24 | 初始版本 | [姓名] |
| v1.1.0 | YYYY-MM-DD | 添加 compact 变体 | [姓名] |

---

## 13. 待办事项

- [ ] 添加加载状态
- [ ] 支持自定义操作按钮
- [ ] 添加动画效果
- [ ] 支持拖拽排序
- [ ] 国际化支持

---

## 14. 相关文档

- [User 类型定义](../types/user.ts)
- [User API 文档](../api/user-api.ts)
- [shadcn/ui Card 文档](https://ui.shadcn.com/docs/components/card)

---

## 附录：组件设计检查清单

### 必须检查项

- [ ] Props 类型定义完整
- [ ] 组件命名清晰（PascalCase）
- [ ] 使用 React.memo 优化
- [ ] 事件处理正确（stopPropagation）
- [ ] 响应式设计
- [ ] 无障碍访问
- [ ] 有单元测试
- [ ] 使用 shadcn/ui 组件
- [ ] 使用 Tailwind CSS
- [ ] 支持自定义 className

### 可选检查项

- [ ] 多种变体支持
- [ ] 国际化支持
- [ ] 动画效果
- [ ] 深色模式支持
- [ ] Storybook 文档
