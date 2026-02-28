#!/bin/bash
# 依赖更新检查脚本

set -e

echo "📦 Checking for dependency updates..."

# 检查过时的依赖
echo ""
echo "🔍 Outdated packages:"
npm outdated || true

# 检查安全漏洞
echo ""
echo "🔒 Security audit:"
npm audit || true

echo ""
echo "💡 Tips:"
echo "   - Use 'npm update' to update within semver ranges"
echo "   - Use 'npm install <package>@latest' to update to latest"
echo "   - Use 'npm audit fix' to fix security issues"
