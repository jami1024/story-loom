# React 组件设计文档模板

> 本模板用于编写 React 组件的设计文档，适用于复杂组件或需要团队协作的组件。

**文档信息**:
- 组件名称：[ComponentName]
- 所属功能：[功能模块]
- 编写人员：[姓名]
- 编写日期：[YYYY-MM-DD]
- 文档版本：v1.0

---

## 1. 组件概述

### 1.1 组件简介

简要描述组件的功能和用途。

**示例**:
> UserProfileCard 组件用于展示用户的基本信息卡片，包括头像、昵称、粉丝数等。支持查看和编辑两种模式，可在用户资料页、侧边栏等多个场景中复用。

### 1.2 使用场景

列出组件的主要使用场景：

1. **场景 1**：[在哪里使用，解决什么问题]
2. **场景 2**：[在哪里使用，解决什么问题]

### 1.3 设计目标

- [ ] 高度可复用
- [ ] 性能优化
- [ ] 易于测试
- [ ] 可访问性友好

---

## 2. 组件 API

### 2.1 Props 定义

```typescript
interface UserProfileCardProps {
  /** 用户 ID */
  userId: string

  /** 显示模式：查看或编辑 */
  mode?: 'view' | 'edit'

  /** 是否显示统计数据（粉丝、关注等） */
  showStats?: boolean

  /** 自定义样式类名 */
  className?: string

  /** 编辑模式下的保存回调 */
  onSave?: (data: UpdateUserDto) => Promise<void>

  /** 点击头像的回调 */
  onAvatarClick?: () => void
}
```

### 2.2 Props 说明

| Prop | 类型 | 默认值 | 必填 | 说明 |
|------|------|--------|------|------|
| userId | string | - | ✅ | 用户 ID |
| mode | 'view' \| 'edit' | 'view' | ❌ | 显示模式 |
| showStats | boolean | true | ❌ | 是否显示统计 |
| className | string | undefined | ❌ | 自定义类名 |
| onSave | function | undefined | ❌ | 保存回调 |
| onAvatarClick | function | undefined | ❌ | 头像点击回调 |

### 2.3 使用示例

**基础用法**:
```typescript
<UserProfileCard userId="123" />
```

**编辑模式**:
```typescript
<UserProfileCard
  userId="123"
  mode="edit"
  onSave={async (data) => {
    await userApi.updateUser({ id: '123', data })
  }}
/>
```

**自定义样式**:
```typescript
<UserProfileCard
  userId="123"
  className="shadow-lg rounded-lg"
  showStats={false}
/>
```

---

## 3. 组件结构

### 3.1 组件层次

```
UserProfileCard
├── Avatar (头像)
├── UserInfo (用户信息)
│   ├── Name (昵称)
│   ├── Bio (简介)
│   └── Stats (统计数据)
│       ├── FollowersCount
│       ├── FollowingCount
│       └── PostsCount
└── ActionButtons (操作按钮)
    ├── EditButton (编辑模式)
    └── SaveButton (查看模式)
```

### 3.2 文件组织

```
src/features/user-profile/components/UserProfileCard/
├── UserProfileCard.tsx          # 主组件
├── UserProfileCard.test.tsx     # 测试文件
├── UserProfileCard.stories.tsx  # Storybook（可选）
├── components/                   # 子组件
│   ├── Avatar.tsx
│   ├── UserInfo.tsx
│   └── ActionButtons.tsx
└── types.ts                     # 类型定义
```

---

## 4. 状态管理

### 4.1 组件状态

```typescript
// 内部状态
const [isEditing, setIsEditing] = useState(false)
const [isLoading, setIsLoading] = useState(false)

// 服务端状态（TanStack Query）
const { data: user, isLoading: isUserLoading } = useQuery({
  queryKey: ['user', userId],
  queryFn: () => userApi.getUser(userId)
})

// 表单状态（React Hook Form）
const form = useForm<FormData>({
  defaultValues: user
})
```

### 4.2 状态流转

```
初始状态 (view mode)
    ↓
用户点击"编辑"
    ↓
进入编辑模式 (edit mode)
    ↓
用户修改数据
    ↓
用户点击"保存"
    ↓
提交到后端 (loading)
    ↓
保存成功
    ↓
返回查看模式 (view mode)
```

---

## 5. 数据流

### 5.1 数据获取

```typescript
// 使用 TanStack Query 获取用户数据
const { data: user, isLoading, error } = useQuery({
  queryKey: ['user', userId],
  queryFn: () => userApi.getUser(userId),
  staleTime: 5 * 60 * 1000, // 5 分钟
  enabled: !!userId,
})
```

### 5.2 数据更新

```typescript
// 使用 Mutation 更新数据
const updateUserMutation = useMutation({
  mutationFn: userApi.updateUser,
  onSuccess: (_, { id }) => {
    // 更新缓存
    queryClient.invalidateQueries({ queryKey: ['user', id] })
    // 显示成功提示
    toast({ title: '保存成功' })
    // 退出编辑模式
    setIsEditing(false)
  },
  onError: (error) => {
    toast({ title: '保存失败', description: error.message })
  },
})
```

---

## 6. 视觉设计

### 6.1 布局

**查看模式**:
```
┌─────────────────────────────┐
│ ┌──────┐ Name               │
│ │Avatar│ Bio                │
│ └──────┘                    │
│                              │
│ Followers  Following  Posts │
│   100        50        20   │
│                              │
│         [Edit Button]       │
└─────────────────────────────┘
```

**编辑模式**:
```
┌─────────────────────────────┐
│ ┌──────┐ [Upload Avatar]    │
│ │Avatar│                    │
│ └──────┘                    │
│                              │
│ Name: [_______________]     │
│ Bio:  [_______________]     │
│       [_______________]     │
│                              │
│  [Cancel]    [Save]        │
└─────────────────────────────┘
```

### 6.2 样式规范

**颜色**:
- 背景色：白色 (#FFFFFF) / 暗色 (#1A1A1A)
- 主文本：灰色 900 (#1A1A1A)
- 次文本：灰色 600 (#6B7280)
- 边框：灰色 200 (#E5E7EB)

**间距**:
- 外边距：p-6 (24px)
- 内间距：space-y-4 (16px)
- 元素间距：gap-2 (8px)

**字体**:
- 标题：text-2xl font-bold (24px, 700)
- 正文：text-base (16px)
- 辅助：text-sm text-gray-600 (14px)

### 6.3 响应式设计

| 屏幕尺寸 | 布局变化 |
|---------|---------|
| 桌面（> 1024px） | 固定宽度 400px，左对齐 |
| 平板（768-1024px） | 宽度 100%，最大 500px |
| 移动（< 768px） | 宽度 100%，头像缩小 |

---

## 7. 交互行为

### 7.1 用户操作

| 操作 | 触发条件 | 行为 | 反馈 |
|------|---------|------|------|
| 点击头像 | 任何模式 | 触发 onAvatarClick 回调 | - |
| 点击编辑 | 查看模式 | 切换到编辑模式 | - |
| 点击保存 | 编辑模式，表单验证通过 | 提交数据，更新缓存 | Toast 提示 |
| 点击取消 | 编辑模式 | 丢弃修改，返回查看模式 | - |
| 输入昵称 | 编辑模式 | 实时验证 | 错误提示 |

### 7.2 加载状态

```typescript
if (isUserLoading) {
  return <UserProfileCardSkeleton />
}

if (error) {
  return <ErrorMessage message="加载失败，请重试" />
}

if (!user) {
  return <EmptyState message="用户不存在" />
}
```

### 7.3 错误处理

**验证错误**:
```typescript
const schema = z.object({
  name: z.string().min(2, '昵称至少2个字符').max(20, '昵称最多20个字符'),
  bio: z.string().max(200, '简介最多200个字符').optional(),
})
```

**网络错误**:
```typescript
if (updateUserMutation.error) {
  toast({
    title: '保存失败',
    description: '网络错误，请检查网络连接后重试',
    variant: 'destructive',
  })
}
```

---

## 8. 性能优化

### 8.1 优化策略

**使用 React.memo**:
```typescript
export const UserProfileCard = memo(({ userId, mode, ...props }: Props) => {
  // ...
}, (prevProps, nextProps) => {
  return prevProps.userId === nextProps.userId &&
         prevProps.mode === nextProps.mode
})
```

**使用 useMemo**:
```typescript
const stats = useMemo(() => {
  if (!user?.stats) return null
  return {
    followers: user.stats.followers,
    following: user.stats.following,
    posts: user.stats.posts,
  }
}, [user?.stats])
```

**使用 useCallback**:
```typescript
const handleSave = useCallback(async (data: FormData) => {
  if (onSave) {
    await onSave(data)
  }
}, [onSave])
```

### 8.2 性能指标

- 首次渲染时间 < 100ms
- 更新渲染时间 < 50ms
- 图片加载使用懒加载
- 避免不必要的重渲染

---

## 9. 可访问性

### 9.1 键盘导航

- Tab 键可以依次聚焦所有交互元素
- Enter 键触发按钮点击
- Esc 键取消编辑模式

### 9.2 ARIA 属性

```typescript
<button
  aria-label="编辑个人资料"
  aria-pressed={isEditing}
  onClick={() => setIsEditing(true)}
>
  编辑
</button>

<input
  aria-label="用户昵称"
  aria-required="true"
  aria-invalid={!!errors.name}
  aria-describedby={errors.name ? "name-error" : undefined}
  {...register('name')}
/>

{errors.name && (
  <p id="name-error" role="alert">
    {errors.name.message}
  </p>
)}
```

### 9.3 屏幕阅读器

- 使用语义化 HTML 标签
- 图片提供 alt 文本
- 表单字段提供 label

---

## 10. 测试

### 10.1 单元测试

```typescript
describe('UserProfileCard', () => {
  it('should render user information', async () => {
    render(<UserProfileCard userId="123" />)
    expect(await screen.findByText('John Doe')).toBeInTheDocument()
  })

  it('should switch to edit mode when clicking edit button', async () => {
    const user = userEvent.setup()
    render(<UserProfileCard userId="123" />)

    await user.click(screen.getByRole('button', { name: '编辑' }))
    expect(screen.getByRole('textbox', { name: '用户昵称' })).toBeInTheDocument()
  })

  it('should call onSave when saving', async () => {
    const onSave = vi.fn()
    const user = userEvent.setup()
    render(<UserProfileCard userId="123" mode="edit" onSave={onSave} />)

    await user.type(screen.getByRole('textbox', { name: '用户昵称' }), 'New Name')
    await user.click(screen.getByRole('button', { name: '保存' }))

    expect(onSave).toHaveBeenCalledWith({ name: 'New Name' })
  })
})
```

### 10.2 快照测试

```typescript
it('should match snapshot in view mode', () => {
  const { container } = render(<UserProfileCard userId="123" />)
  expect(container).toMatchSnapshot()
})
```

### 10.3 E2E 测试

```typescript
test('user profile card edit flow', async ({ page }) => {
  await page.goto('/users/123')

  // 查看模式
  await expect(page.getByText('John Doe')).toBeVisible()

  // 切换到编辑模式
  await page.getByRole('button', { name: '编辑' }).click()

  // 修改昵称
  await page.getByLabel('用户昵称').fill('Jane Doe')

  // 保存
  await page.getByRole('button', { name: '保存' }).click()

  // 验证结果
  await expect(page.getByText('Jane Doe')).toBeVisible()
  await expect(page.getByText('保存成功')).toBeVisible()
})
```

---

## 11. 实现代码示例

### 11.1 主组件

```typescript
// UserProfileCard.tsx
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { userApi } from '../api/userApi'
import type { UserProfileCardProps } from './types'

export function UserProfileCard({
  userId,
  mode = 'view',
  showStats = true,
  className,
  onSave,
  onAvatarClick,
}: UserProfileCardProps) {
  const [isEditing, setIsEditing] = useState(mode === 'edit')
  const queryClient = useQueryClient()

  // 获取用户数据
  const { data: user, isLoading } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => userApi.getUser(userId),
  })

  // 更新用户数据
  const updateUserMutation = useMutation({
    mutationFn: userApi.updateUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', userId] })
      setIsEditing(false)
      toast({ title: '保存成功' })
    },
  })

  if (isLoading) return <UserProfileCardSkeleton />
  if (!user) return <EmptyState message="用户不存在" />

  return (
    <Card className={cn('p-6', className)}>
      <div className="flex items-start gap-4">
        <Avatar
          src={user.avatar}
          alt={user.name}
          onClick={onAvatarClick}
          className="cursor-pointer"
        />

        {isEditing ? (
          <EditForm
            user={user}
            onSave={async (data) => {
              await updateUserMutation.mutateAsync({ id: userId, data })
              if (onSave) await onSave(data)
            }}
            onCancel={() => setIsEditing(false)}
          />
        ) : (
          <ViewMode
            user={user}
            showStats={showStats}
            onEdit={() => setIsEditing(true)}
          />
        )}
      </div>
    </Card>
  )
}
```

---

## 12. 相关文档

- [需求文档](./requirement-template.md) - 功能需求说明
- [架构设计](../architecture-design.md) - 整体架构
- [开发工作流](../development-workflow.md) - 开发流程

---

## 13. 更新记录

| 版本 | 日期 | 修改内容 | 修改人 |
|------|------|---------|--------|
| v1.0 | 2024-12-24 | 初始版本 | [姓名] |

---

**文档状态**: [ ] 草稿  [ ] 评审中  [ ] 已通过  [ ] 已实现
