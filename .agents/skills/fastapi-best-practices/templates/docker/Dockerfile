# FastAPI 项目 Dockerfile - 完整的国内镜像源配置
# 支持灵活的端口配置和多环境部署

# ===== 构建阶段 =====
FROM python:3.11-slim as builder

# 配置 Debian/Ubuntu APT 源为国内镜像（清华源）
# 如果基础镜像是 CentOS，请使用下面的 yum 源配置
RUN sed -i 's/deb.debian.org/mirrors.tuna.tsinghua.edu.cn/g' /etc/apt/sources.list.d/debian.sources && \
    sed -i 's|security.debian.org/debian-security|mirrors.tuna.tsinghua.edu.cn/debian-security|g' /etc/apt/sources.list.d/debian.sources

# 更新包列表并安装必要的构建工具
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        gcc \
        g++ \
        build-essential && \
    rm -rf /var/lib/apt/lists/*

# 配置 pip 使用国内镜像源
# 可选源：
# - 清华源（推荐）: https://pypi.tuna.tsinghua.edu.cn/simple
# - 阿里云源: https://mirrors.aliyun.com/pypi/simple/
# - 豆瓣源: https://pypi.douban.com/simple/
# - 中科大源: https://pypi.mirrors.ustc.edu.cn/simple/
ARG PIP_INDEX_URL=https://pypi.tuna.tsinghua.edu.cn/simple
ARG PIP_TRUSTED_HOST=pypi.tuna.tsinghua.edu.cn

ENV PIP_INDEX_URL=${PIP_INDEX_URL}
ENV PIP_TRUSTED_HOST=${PIP_TRUSTED_HOST}

# 设置工作目录
WORKDIR /app

# 复制依赖文件
COPY requirements.txt .

# 升级 pip 并安装依赖（使用国内源）
RUN pip install --upgrade pip && \
    pip install --user --no-cache-dir -r requirements.txt

# ===== 运行阶段 =====
FROM python:3.11-slim

# 配置 Debian/Ubuntu APT 源为国内镜像
RUN sed -i 's/deb.debian.org/mirrors.tuna.tsinghua.edu.cn/g' /etc/apt/sources.list.d/debian.sources && \
    sed -i 's|security.debian.org/debian-security|mirrors.tuna.tsinghua.edu.cn/debian-security|g' /etc/apt/sources.list.d/debian.sources

# 安装运行时依赖
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        curl && \
    rm -rf /var/lib/apt/lists/*

# 设置工作目录
WORKDIR /app

# 从构建阶段复制已安装的依赖
COPY --from=builder /root/.local /root/.local

# 复制应用代码
COPY . .

# 确保 Python 可以找到用户安装的包
ENV PATH=/root/.local/bin:$PATH

# 暴露端口（通过环境变量配置，支持测试和生产环境不同端口）
# 默认 8000，可通过 docker run -e PORT=8080 或 docker-compose.yml 修改
ARG PORT=8000
ENV PORT=${PORT}
EXPOSE ${PORT}

# 创建非 root 用户（安全最佳实践）
RUN useradd -m -u 1000 appuser && \
    chown -R appuser:appuser /app
USER appuser

# 健康检查（确保服务正常运行）
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:${PORT}/health || exit 1

# 启动命令
# 端口、workers 数量等都可通过环境变量配置
CMD uvicorn app.main:app \
    --host 0.0.0.0 \
    --port ${PORT} \
    --workers ${WORKERS:-1}
