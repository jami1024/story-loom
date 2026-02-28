#!/bin/bash
# React 代码检查脚本

set -e

echo "🔍 Running linters..."

echo ""
echo "📝 Running ESLint..."
npm run lint

echo ""
echo "🔎 Running TypeScript check..."
npm run type-check

echo ""
echo "✅ All checks passed!"
