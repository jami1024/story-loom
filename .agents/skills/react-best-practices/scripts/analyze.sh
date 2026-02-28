#!/bin/bash
# React Bundle 分析脚本

set -e

echo "📊 Analyzing bundle size..."

# 构建并分析
npm run build -- --mode analyze

echo ""
echo "✅ Analysis complete!"
echo "   Check the generated stats file or Rollup visualizer output."
