#!/bin/bash
# FastAPI 数据库迁移脚本

set -e

ACTION=${1:-upgrade}
MESSAGE=${2:-"auto migration"}

case "$ACTION" in
    upgrade)
        echo "⬆️  Upgrading database to latest version..."
        alembic upgrade head
        ;;
    downgrade)
        echo "⬇️  Downgrading database..."
        alembic downgrade -1
        ;;
    revision)
        echo "📝 Creating new migration: $MESSAGE"
        alembic revision --autogenerate -m "$MESSAGE"
        ;;
    history)
        echo "📜 Migration history:"
        alembic history
        ;;
    current)
        echo "📍 Current revision:"
        alembic current
        ;;
    *)
        echo "Usage: $0 {upgrade|downgrade|revision|history|current} [message]"
        echo ""
        echo "Commands:"
        echo "  upgrade   - Upgrade to latest version"
        echo "  downgrade - Downgrade one version"
        echo "  revision  - Create new migration (requires message)"
        echo "  history   - Show migration history"
        echo "  current   - Show current revision"
        exit 1
        ;;
esac

echo ""
echo "✅ Done!"
