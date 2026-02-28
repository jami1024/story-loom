# React 项目 Dockerfile（开发环境）
# 用于开发环境的 Docker 配置，支持热重载

FROM node:20-alpine

# 配置 Alpine APK 源为国内镜像（清华源）
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.tuna.tsinghua.edu.cn/g' /etc/apk/repositories

# 安装必要的工具
RUN apk add --no-cache curl

# 配置 npm 源为国内镜像（淘宝源）
# 可选源：
# - https://registry.npmmirror.com（淘宝，推荐）
# - https://mirrors.cloud.tencent.com/npm/（腾讯云）
# - https://repo.huaweicloud.com/repository/npm/（华为云）
ARG NPM_REGISTRY=https://registry.npmmirror.com
RUN npm config set registry ${NPM_REGISTRY}

# 设置时区为上海
ENV TZ=Asia/Shanghai

# 创建非 root 用户（安全最佳实践）
RUN adduser -D -u 1000 appuser

# 设置工作目录
WORKDIR /app

# 切换到非 root 用户
USER appuser

# 复制 package.json 和 lock 文件（利用 Docker 缓存层）
COPY --chown=appuser:appuser package*.json ./

# 安装依赖
RUN npm install

# 复制源代码
COPY --chown=appuser:appuser . .

# 暴露端口（通过环境变量配置，支持测试和生产环境不同端口）
# 默认 5173（Vite），可通过 docker run -e PORT=3000 或 docker-compose.yml 修改
ARG PORT=5173
ENV PORT=${PORT}
EXPOSE ${PORT}

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:${PORT}/ || exit 1

# 启动开发服务器
# Vite 使用 --host 0.0.0.0 允许从容器外访问
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
