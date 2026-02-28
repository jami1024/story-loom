#!/bin/bash
# FastAPI 代码检查脚本

set -e

echo "🔍 Running linters..."

echo ""
echo "📝 Running Ruff..."
ruff check .

echo ""
echo "🔎 Running MyPy..."
mypy app/

echo ""
echo "✅ All checks passed!"
