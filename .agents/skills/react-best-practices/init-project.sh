#!/bin/bash

# React + shadcn/ui 项目初始化脚本
# 使用方法: bash init-project.sh <project-name>

set -e

PROJECT_NAME=$1

if [ -z "$PROJECT_NAME" ]; then
  echo "错误: 请提供项目名称"
  echo "使用方法: bash init-project.sh <project-name>"
  exit 1
fi

echo "🚀 开始创建 React 项目: $PROJECT_NAME"
echo ""

# 1. 创建 Vite 项目
echo "📦 创建 Vite + React + TypeScript 项目..."
npm create vite@latest "$PROJECT_NAME" -- --template react-ts
cd "$PROJECT_NAME"

# 2. 安装依赖
echo ""
echo "📦 安装核心依赖..."
npm install

# 3. 安装 Tailwind CSS
echo ""
echo "🎨 安装 Tailwind CSS..."
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# 4. 安装 shadcn/ui
echo ""
echo "🎨 配置 shadcn/ui..."
npm install -D @types/node
npx shadcn-ui@latest init -y

# 5. 安装其他核心依赖
echo ""
echo "📦 安装其他依赖..."
npm install react-router-dom @tanstack/react-query zustand
npm install react-hook-form @hookform/resolvers zod
npm install axios clsx tailwind-merge
npm install lucide-react

# 6. 安装开发依赖
echo ""
echo "🛠️ 安装开发依赖..."
npm install -D @testing-library/react @testing-library/jest-dom @testing-library/user-event
npm install -D vitest jsdom
npm install -D eslint-plugin-react-hooks @typescript-eslint/eslint-plugin @typescript-eslint/parser
npm install -D prettier eslint-config-prettier eslint-plugin-prettier

# 7. 创建目录结构
echo ""
echo "📁 创建项目目录结构..."

mkdir -p src/{api,components/{ui,layout,common},features,hooks,lib,stores,types,utils}

# 8. 创建配置文件

# vite.config.ts
echo ""
echo "⚙️ 配置 vite.config.ts..."
cat > vite.config.ts << 'EOF'
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
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
})
EOF

# tsconfig.json
echo ""
echo "⚙️ 配置 tsconfig.json..."
cat > tsconfig.json << 'EOF'
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
EOF

# .eslintrc.cjs
echo ""
echo "⚙️ 配置 ESLint..."
cat > .eslintrc.cjs << 'EOF'
module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
    'prettier',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parser: '@typescript-eslint/parser',
  plugins: ['react-refresh', 'prettier'],
  rules: {
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
    'prettier/prettier': 'error',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
  },
}
EOF

# .prettierrc
echo ""
echo "⚙️ 配置 Prettier..."
cat > .prettierrc << 'EOF'
{
  "semi": false,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 80,
  "arrowParens": "always"
}
EOF

# 9. 创建基础文件

# src/lib/utils.ts
echo ""
echo "📄 创建工具函数..."
cat > src/lib/utils.ts << 'EOF'
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
EOF

# src/api/client.ts
cat > src/api/client.ts << 'EOF'
import axios from 'axios'

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  timeout: 10000,
})

// 请求拦截器
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
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
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)
EOF

# src/test/setup.ts
mkdir -p src/test
cat > src/test/setup.ts << 'EOF'
import { expect, afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import * as matchers from '@testing-library/jest-dom/matchers'

expect.extend(matchers)

afterEach(() => {
  cleanup()
})
EOF

# .env.example
cat > .env.example << 'EOF'
VITE_API_BASE_URL=http://localhost:3000/api
EOF

cat > .env << 'EOF'
VITE_API_BASE_URL=http://localhost:3000/api
EOF

# 10. 添加 npm scripts
echo ""
echo "⚙️ 更新 package.json scripts..."
node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
pkg.scripts = {
  ...pkg.scripts,
  'dev': 'vite',
  'build': 'tsc && vite build',
  'lint': 'eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0',
  'lint:fix': 'eslint . --ext ts,tsx --fix',
  'format': 'prettier --write \"src/**/*.{ts,tsx,css,md}\"',
  'preview': 'vite preview',
  'test': 'vitest',
  'test:ui': 'vitest --ui',
  'type-check': 'tsc --noEmit'
};
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
"

# 11. 创建 README.md
echo ""
echo "📝 创建 README.md..."
cat > README.md << EOF
# $PROJECT_NAME

React + TypeScript + shadcn/ui 项目

## 技术栈

- React 18
- TypeScript
- Vite
- shadcn/ui
- Tailwind CSS
- TanStack Query
- Zustand
- React Hook Form
- Zod

## 开始使用

\`\`\`bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 运行测试
npm run test

# 代码检查
npm run lint

# 格式化代码
npm run format
\`\`\`

## 项目结构

\`\`\`
src/
├── api/              # API 客户端
├── components/       # 组件
│   ├── ui/          # shadcn/ui 组件
│   ├── layout/      # 布局组件
│   └── common/      # 通用组件
├── features/        # 功能模块
├── hooks/           # 自定义 Hooks
├── lib/             # 工具库
├── stores/          # 状态管理
├── types/           # 类型定义
└── utils/           # 工具函数
\`\`\`

## 添加 shadcn/ui 组件

\`\`\`bash
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add form
\`\`\`

## 许可证

MIT
EOF

# 12. 初始化 Git
echo ""
echo "📦 初始化 Git..."
cat > .gitignore << 'EOF'
# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
lerna-debug.log*

node_modules
dist
dist-ssr
*.local

# Editor directories and files
.vscode/*
!.vscode/extensions.json
.idea
.DS_Store
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?

# Environment
.env
.env.local
.env.production
EOF

git init
git add .
git commit -m "chore: 初始化项目"

# 完成
echo ""
echo "✅ React 项目初始化完成!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 下一步："
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. 🏗️  架构已搭建"
echo "   ✅ Feature-Based 目录结构"
echo "   ✅ 状态管理（TanStack Query + Zustand）"
echo "   ✅ 路由配置（React Router）"
echo "   ✅ shadcn/ui 组件库"
echo ""
echo "2. 🎨 设计 UI - 使用 frontend-design skill"
echo ""
echo "   当你需要创建页面或组件的 UI 时，建议使用 frontend-design skill"
echo "   来设计独特、有创意的界面，避免通用 AI 美学。"
echo ""
echo "   提示词示例："
echo "   \"使用 frontend-design skill 为 [页面名称] 设计 UI，"
echo "    品牌定位：[描述]，目标受众：[描述]，"
echo "    想传达的感觉：[专业/创新/优雅/活力]，"
echo "    审美方向偏好：[选择一个]\""
echo ""
echo "   可选的审美方向："
echo "   • 精致极简（Refined Minimal）- 简约、优雅、大量留白"
echo "   • 编辑杂志（Editorial）- 大标题、非对称布局、黑白对比"
echo "   • 复古未来（Retro-Futuristic）- 霓虹色、网格、赛博朋克"
echo "   • 有机自然（Organic）- 大地色系、柔和曲线"
echo "   • 工业风（Industrial）- 硬朗、金属质感、功能性"
echo "   • 极繁主义（Maximalist）- 丰富层次、多重纹理、大胆配色"
echo ""
echo "3. 💻 开始开发"
echo "   cd $PROJECT_NAME"
echo "   npm run dev"
echo ""
echo "4. 🎨 添加 shadcn/ui 组件"
echo "   npx shadcn-ui@latest add button"
echo "   npx shadcn-ui@latest add card"
echo "   npx shadcn-ui@latest add form"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📚 参考文档："
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "   React 工程实践："
echo "   → .claude/skills/react-best-practices/README.md"
echo "   → .claude/skills/react-best-practices/SKILL.md"
echo ""
echo "   UI 设计指导："
echo "   → 使用 frontend-design skill"
echo ""
echo "Happy coding! 🎉"
