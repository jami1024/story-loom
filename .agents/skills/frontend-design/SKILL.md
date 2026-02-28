---
name: frontend-design
description: 创建独特、生产级的前端界面，避免通用 AI 美学。用于设计网站、落地页、仪表板、React 组件等 UI 界面。触发词：UI 设计、前端设计、界面美化、落地页、landing page
---

# Frontend Design 前端设计最佳实践

**版本**: v2.0.0
**更新日期**: 2026-01-06

创建独特、生产级的前端界面，具有高设计质量。避免通用的 AI 美学风格。

---

## 🎯 何时使用

当用户要求构建以下内容时使用此 skill：
- Web 组件、页面、应用程序
- 网站、落地页、仪表板
- React 组件、HTML/CSS 布局
- 任何需要美化的 Web UI

## 🎨 设计思维

在编码之前，理解上下文并确定**大胆的美学方向**：

### 1. 核心问题
- **目的**: 这个界面解决什么问题？谁在使用它？
- **基调**: 选择一个极端风格
- **约束**: 技术要求（框架、性能、可访问性）
- **差异化**: 什么让它令人难忘？

### 2. 美学方向选择

| 风格 | 描述 | 适用场景 |
|------|------|----------|
| 极简主义 | 大量留白、精确排版 | 高端品牌、艺术画廊 |
| 最大化主义 | 丰富层次、密集信息 | 创意机构、娱乐平台 |
| 复古未来 | 80s 氛围、霓虹色彩 | 游戏、音乐、科技 |
| 有机自然 | 柔和曲线、自然色调 | 健康、环保、生活方式 |
| 奢华精致 | 金色调、衬线字体 | 奢侈品、高端服务 |
| 俏皮玩趣 | 圆角、明亮色彩、动画 | 儿童产品、创意工具 |
| 编辑杂志 | 网格布局、大字体 | 媒体、出版、博客 |
| 野蛮主义 | 原始、不对称、粗犷 | 实验性项目、艺术 |
| 装饰艺术 | 几何图案、对称 | 活动、展览、复古品牌 |
| 柔和粉彩 | 渐变、柔和边缘 | 美妆、时尚、生活 |
| 工业实用 | 功能优先、单色 | 工具、开发者产品 |
| 玻璃拟态 | 毛玻璃效果、透明层次 | 现代 SaaS、金融仪表板 |
| 新拟态 | 柔和 3D、浮雕效果 | 健康应用、冥想平台 |
| 粘土拟态 | 3D 软糖质感、圆润 | 教育应用、儿童产品 |
| Bento Grid | 模块化卡片、Apple 风格 | 仪表板、产品展示 |
| 新野蛮主义 | 粗边框、45° 阴影 | Gen Z 品牌、创意机构 |
| 赛博朋克 | 霓虹、终端、HUD | 游戏、加密、开发者工具 |

**关键**: 选择清晰的概念方向并精确执行。大胆的最大化主义和精致的极简主义都有效 - 关键是**意图性**，而非强度。

---

## 🔍 设计数据库搜索

此 skill 包含可搜索的设计数据库，支持通过 Python 脚本动态查询。

### 前置要求

```bash
# 检查 Python 是否已安装
python3 --version

# macOS 安装
brew install python3

# Ubuntu/Debian 安装
sudo apt update && sudo apt install python3
```

### 搜索命令

```bash
python3 .claude/skills/frontend-design/scripts/search.py "<关键词>" --domain <领域> [-n <结果数量>]
```

### 可用领域

| 领域 | 用途 | 示例关键词 |
|------|------|-----------|
| `style` | UI 风格、效果 | glassmorphism, minimalism, dark mode, brutalism |
| `typography` | 字体配对、Google Fonts | elegant, playful, professional, modern |
| `color` | 按行业的配色方案 | saas, ecommerce, healthcare, beauty, fintech |
| `product` | 产品类型推荐 | SaaS, e-commerce, portfolio, healthcare |
| `landing` | 落地页结构、CTA 策略 | hero, testimonial, pricing, social-proof |
| `chart` | 图表类型推荐 | trend, comparison, timeline, funnel, pie |
| `ux` | 最佳实践、反模式 | animation, accessibility, z-index, loading |
| `prompt` | AI 提示词、CSS 关键词 | (风格名称) |

### 技术栈搜索

```bash
python3 .claude/skills/frontend-design/scripts/search.py "<关键词>" --stack <技术栈>
```

可用技术栈：`html-tailwind` (默认)、`react`、`nextjs`、`vue`、`nuxtjs`、`nuxt-ui`、`svelte`、`swiftui`、`react-native`、`flutter`

### 使用示例

```bash
# 1. 搜索产品类型推荐
python3 .claude/skills/frontend-design/scripts/search.py "beauty spa wellness" --domain product

# 2. 搜索 UI 风格
python3 .claude/skills/frontend-design/scripts/search.py "elegant minimal" --domain style

# 3. 搜索字体配对
python3 .claude/skills/frontend-design/scripts/search.py "luxury premium" --domain typography

# 4. 搜索行业配色
python3 .claude/skills/frontend-design/scripts/search.py "fintech banking" --domain color

# 5. 搜索 UX 指南
python3 .claude/skills/frontend-design/scripts/search.py "animation" --domain ux

# 6. 搜索技术栈指南
python3 .claude/skills/frontend-design/scripts/search.py "layout responsive" --stack html-tailwind
```

### 推荐搜索顺序

1. **Product** - 获取产品类型的风格推荐
2. **Style** - 获取详细风格指南
3. **Typography** - 获取字体配对
4. **Color** - 获取行业配色方案
5. **Landing** - 获取落地页结构（如适用）
6. **UX** - 获取最佳实践
7. **Stack** - 获取技术栈特定指南

---

## 🎨 美学指南

### 1. 字体配对库

#### 高端奢华

| 场景 | 标题字体 | 正文字体 | Google Fonts 导入 |
|------|---------|---------|------------------|
| 奢侈品牌 | Playfair Display | Inter | `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Playfair+Display:wght@400;500;600;700&display=swap');` |
| 时尚杂志 | Cormorant Garamond | Libre Baskerville | `@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Libre+Baskerville:wght@400;700&display=swap');` |
| 珠宝品牌 | Cormorant | Montserrat | `@import url('https://fonts.googleapis.com/css2?family=Cormorant:wght@400;500;600;700&family=Montserrat:wght@300;400;500;600;700&display=swap');` |

#### 现代科技

| 场景 | 标题字体 | 正文字体 | Google Fonts 导入 |
|------|---------|---------|------------------|
| SaaS 产品 | Plus Jakarta Sans | Plus Jakarta Sans | `@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap');` |
| 科技创业 | Space Grotesk | DM Sans | `@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Space+Grotesk:wght@400;500;600;700&display=swap');` |
| 开发者工具 | JetBrains Mono | IBM Plex Sans | `@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap');` |

#### 创意艺术

| 场景 | 标题字体 | 正文字体 | Google Fonts 导入 |
|------|---------|---------|------------------|
| 冲击力标题 | Bebas Neue | Source Sans 3 | `@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Source+Sans+3:wght@300;400;500;600;700&display=swap');` |
| 时尚前卫 | Syne | Manrope | `@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700&family=Syne:wght@400;500;600;700&display=swap');` |
| 几何现代 | Outfit | Work Sans | `@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=Work+Sans:wght@300;400;500;600;700&display=swap');` |

#### 友好亲和

| 场景 | 标题字体 | 正文字体 | Google Fonts 导入 |
|------|---------|---------|------------------|
| 儿童产品 | Fredoka | Nunito | `@import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&family=Nunito:wght@300;400;500;600;700&display=swap');` |
| 健康养生 | Lora | Raleway | `@import url('https://fonts.googleapis.com/css2?family=Lora:wght@400;500;600;700&family=Raleway:wght@300;400;500;600;700&display=swap');` |
| 柔和圆润 | Varela Round | Nunito Sans | `@import url('https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@300;400;500;600;700&family=Varela+Round&display=swap');` |

#### ❌ 避免的字体
- Inter、Roboto、Arial、系统字体（太通用）
- 过度使用的 Space Grotesk（除非真正适合）
- 任何"安全"但无特色的选择

### 2. 行业配色方案

#### SaaS / 科技

```css
:root {
  /* 专业蓝 */
  --color-primary: #0066FF;
  --color-secondary: #1A1A2E;
  --color-accent: #00D4FF;
  --color-surface: #FAFBFC;
  --color-text: #1F2937;
  --color-muted: #6B7280;
}

/* 或者深色主题 */
:root {
  --color-primary: #6366F1;
  --color-secondary: #0F0F23;
  --color-accent: #22D3EE;
  --color-surface: #1E1E3F;
  --color-text: #F8FAFC;
  --color-muted: #94A3B8;
}
```

#### 电商 / 零售

```css
:root {
  /* 温暖购物 */
  --color-primary: #FF6B35;
  --color-secondary: #1A1A2E;
  --color-accent: #4ADE80;
  --color-surface: #FFFBF5;
  --color-text: #1F2937;
  --color-cta: #FF3D00;
}
```

#### 健康 / 医疗

```css
:root {
  /* 信任安心 */
  --color-primary: #0D9488;
  --color-secondary: #134E4A;
  --color-accent: #2DD4BF;
  --color-surface: #F0FDFA;
  --color-text: #1F2937;
  --color-success: #10B981;
}
```

#### 金融 / 理财

```css
:root {
  /* 稳重信赖 */
  --color-primary: #003366;
  --color-secondary: #0A1628;
  --color-accent: #FFD700;
  --color-surface: #F8FAFC;
  --color-text: #1E293B;
  --color-success: #22C55E;
  --color-danger: #EF4444;
}
```

#### 美容 / SPA

```css
:root {
  /* 优雅柔和 */
  --color-primary: #D4A574;
  --color-secondary: #2D2D2D;
  --color-accent: #E8C5A8;
  --color-surface: #FDF8F4;
  --color-text: #3D3D3D;
  --color-muted: #8B7355;
}
```

#### 教育 / 学习

```css
:root {
  /* 活力成长 */
  --color-primary: #4F46E5;
  --color-secondary: #1E1B4B;
  --color-accent: #F59E0B;
  --color-surface: #F5F3FF;
  --color-text: #1F2937;
  --color-success: #10B981;
}
```

#### ❌ 避免的配色
- 白色背景上的紫色渐变（典型 AI 美学）
- 平均分布的调色板（无主次之分）
- 过于保守、无特色的配色

### 3. 动效与交互

#### ✅ 高影响力动效
```css
/* 页面加载 - 交错显示 */
.fade-in-up {
  opacity: 0;
  transform: translateY(20px);
  animation: fadeInUp 0.6s ease forwards;
}

.fade-in-up:nth-child(1) { animation-delay: 0.1s; }
.fade-in-up:nth-child(2) { animation-delay: 0.2s; }
.fade-in-up:nth-child(3) { animation-delay: 0.3s; }

@keyframes fadeInUp {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 悬停效果 - 出人意料 */
.card {
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.card:hover {
  transform: translateY(-8px) rotate(1deg);
}
```

#### React 动效 (Motion)
```tsx
import { motion } from "framer-motion"

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
}

function AnimatedList({ items }) {
  return (
    <motion.ul variants={containerVariants} initial="hidden" animate="show">
      {items.map((item) => (
        <motion.li key={item.id} variants={itemVariants}>
          {item.name}
        </motion.li>
      ))}
    </motion.ul>
  )
}
```

### 4. 空间构图

#### ✅ 打破常规的布局
```css
/* 不对称网格 */
.asymmetric-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  grid-template-rows: auto auto;
  gap: 2rem;
}

.asymmetric-grid .feature {
  grid-row: span 2;
}

/* 对角线流动 */
.diagonal-section {
  clip-path: polygon(0 0, 100% 5%, 100% 95%, 0 100%);
  padding: 8rem 0;
}

/* 重叠元素 */
.overlap-container {
  position: relative;
}

.overlap-image {
  position: absolute;
  top: -2rem;
  right: -2rem;
  z-index: 10;
}

/* Bento Grid */
.bento-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
}

.bento-grid .large {
  grid-column: span 2;
  grid-row: span 2;
}

.bento-grid .wide {
  grid-column: span 2;
}
```

### 5. 背景与视觉细节

#### 渐变网格
```css
.gradient-mesh {
  background:
    radial-gradient(at 40% 20%, hsla(28,100%,74%,1) 0px, transparent 50%),
    radial-gradient(at 80% 0%, hsla(189,100%,56%,1) 0px, transparent 50%),
    radial-gradient(at 0% 50%, hsla(355,100%,93%,1) 0px, transparent 50%),
    radial-gradient(at 80% 50%, hsla(340,100%,76%,1) 0px, transparent 50%),
    radial-gradient(at 0% 100%, hsla(22,100%,77%,1) 0px, transparent 50%);
}
```

#### 噪点纹理
```css
.noise-texture {
  position: relative;
}

.noise-texture::before {
  content: "";
  position: absolute;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
  opacity: 0.05;
  pointer-events: none;
}
```

#### 玻璃拟态
```css
.glass-card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
}

/* 浅色模式下需要调整 */
.glass-card-light {
  background: rgba(255, 255, 255, 0.8); /* 更高不透明度 */
  border: 1px solid rgba(0, 0, 0, 0.1);
}
```

---

## 🚫 专业 UI 常见规则

### 图标与视觉元素

| 规则 | ✅ 正确做法 | ❌ 避免做法 |
|------|------------|-----------|
| 不用 emoji 图标 | 使用 SVG 图标 (Heroicons, Lucide, Simple Icons) | 使用 emoji 如 🎨 🚀 ⚙️ 作为 UI 图标 |
| 稳定的 hover 状态 | 使用颜色/透明度过渡 | 使用 scale 变换导致布局偏移 |
| 正确的品牌 Logo | 从 Simple Icons 获取官方 SVG | 猜测或使用错误的 logo 路径 |
| 一致的图标尺寸 | 使用固定 viewBox (24x24) + w-6 h-6 | 随意混用不同尺寸图标 |

### 交互与光标

| 规则 | ✅ 正确做法 | ❌ 避免做法 |
|------|------------|-----------|
| cursor-pointer | 所有可点击/悬停卡片添加 `cursor-pointer` | 交互元素保持默认光标 |
| hover 反馈 | 提供视觉反馈（颜色、阴影、边框变化） | 无任何交互指示 |
| 平滑过渡 | 使用 `transition-colors duration-200` | 瞬间状态变化或过慢 (>500ms) |

### 明暗模式对比度

| 规则 | ✅ 正确做法 | ❌ 避免做法 |
|------|------------|-----------|
| 浅色模式玻璃卡片 | 使用 `bg-white/80` 或更高不透明度 | 使用 `bg-white/10`（太透明） |
| 浅色模式文字对比 | 使用 `#0F172A` (slate-900) 作为正文 | 使用 `#94A3B8` (slate-400) 作为正文 |
| 次要文字 | 最低使用 `#475569` (slate-600) | 使用 gray-400 或更浅 |
| 边框可见性 | 浅色模式用 `border-gray-200` | 使用 `border-white/10`（不可见） |

### 布局与间距

| 规则 | ✅ 正确做法 | ❌ 避免做法 |
|------|------------|-----------|
| 悬浮导航栏 | 添加 `top-4 left-4 right-4` 间距 | 导航栏紧贴 `top-0 left-0 right-0` |
| 内容内边距 | 考虑固定导航栏高度 | 内容隐藏在固定元素后面 |
| 一致的最大宽度 | 统一使用 `max-w-6xl` 或 `max-w-7xl` | 混用不同容器宽度 |

---

## ✅ 交付前检查清单

### 视觉质量
- [ ] 没有使用 emoji 作为图标（改用 SVG）
- [ ] 所有图标来自一致的图标集 (Heroicons/Lucide)
- [ ] 品牌 logo 正确（从 Simple Icons 验证）
- [ ] hover 状态不会导致布局偏移
- [ ] 直接使用主题颜色 (bg-primary) 而非 var() 包装

### 交互体验
- [ ] 所有可点击元素都有 `cursor-pointer`
- [ ] hover 状态提供清晰的视觉反馈
- [ ] 过渡效果流畅 (150-300ms)
- [ ] 键盘导航时焦点状态可见

### 明暗模式
- [ ] 浅色模式文字有足够对比度（最低 4.5:1）
- [ ] 玻璃/透明元素在浅色模式下可见
- [ ] 边框在两种模式下都可见
- [ ] 交付前测试两种模式

### 布局响应式
- [ ] 悬浮元素与边缘有适当间距
- [ ] 内容不会隐藏在固定导航栏后面
- [ ] 在 320px、768px、1024px、1440px 下响应良好
- [ ] 移动端无水平滚动

### 可访问性
- [ ] 所有图片都有 alt 文字
- [ ] 表单输入框都有标签
- [ ] 颜色不是唯一的状态指示器
- [ ] 尊重 `prefers-reduced-motion` 设置

---

## 🚫 绝对避免

### AI 通用美学（AI Slop）

| 类别 | 避免 | 替代方案 |
|------|------|----------|
| 字体 | Inter, Roboto, Arial | Playfair Display, DM Sans, Archivo |
| 配色 | 紫色渐变 + 白色背景 | 大胆的主导色 + 强烈点缀 |
| 布局 | 预测性组件模式 | 不对称、重叠、对角线 |
| 风格 | 缺乏特色的通用设计 | 针对上下文的独特设计 |

---

## 💡 设计原则

1. **意图性** - 每个设计决策都应有明确的理由
2. **一致性** - 在整个界面中保持美学统一
3. **记忆点** - 设计一个让人难忘的特色元素
4. **精确执行** - 无论极简还是繁复，都要精确到位
5. **突破常规** - 敢于打破"安全"的设计选择

---

## 🎯 UI 风格详解

### 玻璃拟态 (Glassmorphism)

```css
/* 核心样式 */
.glass {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
}

/* 需要丰富背景才能显示效果 */
.glass-container {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
```

**适用**: 现代 SaaS、金融仪表板、高端企业
**注意**: 需要足够对比度，浅色模式下增加不透明度

### 新拟态 (Neumorphism)

```css
.neu-card {
  background: #e0e5ec;
  border-radius: 16px;
  box-shadow:
    9px 9px 16px rgba(163,177,198,0.6),
    -9px -9px 16px rgba(255,255,255, 0.5);
}

.neu-button:active {
  box-shadow:
    inset 5px 5px 10px rgba(163,177,198,0.6),
    inset -5px -5px 10px rgba(255,255,255,0.5);
}
```

**适用**: 健康应用、冥想、健身追踪器
**注意**: 对比度较低，不适合需要严格可访问性的场景

### 新野蛮主义 (Neubrutalism)

```css
.neubrutalism-card {
  background: #FFEB3B;
  border: 3px solid #000000;
  box-shadow: 4px 4px 0 #000000;
  border-radius: 0;
}

.neubrutalism-button:hover {
  transform: translate(2px, 2px);
  box-shadow: 2px 2px 0 #000000;
}
```

**适用**: Gen Z 品牌、创业公司、创意机构、Figma/Notion 风格
**注意**: 对传统企业可能过于活泼

### Bento Grid

```css
.bento-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.bento-card {
  background: #ffffff;
  border-radius: 24px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}

.bento-card.large {
  grid-column: span 2;
  grid-row: span 2;
}

.bento-card.wide {
  grid-column: span 2;
}
```

**适用**: 仪表板、产品页面、作品集、Apple 风格营销
**注意**: 不适合密集数据表格或文字繁重内容

---

## 🔗 与 React Skill 协同

```
# 1. 初始化项目（react-best-practices）
"创建一个 React + TypeScript + shadcn/ui 项目"

# 2. 设计 UI（frontend-design）
"使用 frontend-design skill 为用户列表页设计 UI，
品牌：现代 SaaS，受众：专业人士，
感觉：专业、创新，审美：精致极简"

# 3. 继续开发（react-best-practices）
"添加用户详情页，包括数据获取和状态管理"
```

---

## 参考资源

- [Awwwards](https://www.awwwards.com/) - 优秀网站设计灵感
- [Dribbble](https://dribbble.com/) - UI 设计灵感
- [Google Fonts](https://fonts.google.com/) - 字体选择
- [Coolors](https://coolors.co/) - 配色方案生成
- [Motion](https://motion.dev/) - React 动画库
- [Heroicons](https://heroicons.com/) - SVG 图标
- [Lucide](https://lucide.dev/) - SVG 图标
- [Simple Icons](https://simpleicons.org/) - 品牌 Logo SVG
