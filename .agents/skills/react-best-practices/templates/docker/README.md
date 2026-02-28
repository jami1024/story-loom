# React Docker 快速部署

本目录包含 React 项目的 Docker 配置，支持开发（热重载）和生产（Nginx）两种模式。

## 📁 文件说明

- `Dockerfile` - 开发环境配置（支持热重载，Vite）
- `Dockerfile.nginx` - 生产环境配置（Nginx + 多阶段构建）
- `docker-compose.yml` - 支持 dev 和 prod profiles
- `nginx.conf` - Nginx 配置（gzip + 缓存 + 安全头部）
- `.env.example` - 环境变量配置模板
- `.dockerignore` - 构建优化

## 🚀 快速开始

### 开发环境（支持热重载）

```bash
# 1. 配置环境变量
cp .env.example .env.dev
vim .env.dev  # 修改 VITE_API_URL 等

# 2. 启动开发环境
docker-compose --env-file .env.dev --profile dev up -d

# 3. 查看日志
docker-compose logs -f app-dev

# 4. 访问应用
open http://localhost:5173
```

### 生产环境（Nginx）

```bash
# 1. 配置环境变量
cp .env.example .env.prod
vim .env.prod  # 修改 VITE_API_URL、HOST_PORT 等

# 2. 构建并启动生产环境
docker-compose --env-file .env.prod --profile prod up -d --build

# 3. 查看日志
docker-compose logs -f app-prod

# 4. 访问应用
open http://localhost
```

### 停止服务

```bash
# 停止开发环境
docker-compose --profile dev down

# 停止生产环境
docker-compose --profile prod down
```

## 🔧 环境配置说明

### 端口配置（重要）

| 环境 | HOST_PORT | APP_PORT | 说明 |
|------|-----------|----------|------|
| 开发 | 5173 | 5173 | Vite 默认端口 |
| 测试 | 5174 | 80 | 避免端口冲突 |
| 生产 | 80 | 80 | 标准 HTTP 端口 |

**同时运行多个环境**:
```bash
# 使用不同项目名称
docker-compose --env-file .env.dev --profile dev -p myapp-dev up -d
docker-compose --env-file .env.test --profile prod -p myapp-test up -d

# 分别访问
open http://localhost:5173  # 开发环境
open http://localhost:5174  # 测试环境
```

### Vite 环境变量（重要）

Vite 只会暴露以 `VITE_` 开头的环境变量到客户端代码：

```bash
# ✅ 客户端可访问
VITE_API_URL=http://localhost:8000
VITE_APP_TITLE=My App

# ❌ 客户端无法访问
API_SECRET=secret123  # 不要在客户端暴露敏感信息
```

### 开发环境 vs 生产环境

| 特性 | 开发环境 | 生产环境 |
|------|---------|---------|
| Dockerfile | Dockerfile | Dockerfile.nginx |
| 服务器 | Vite Dev Server | Nginx |
| 热重载 | ✅ 支持 | ❌ 不支持 |
| 镜像大小 | ~500MB | < 50MB |
| 源码挂载 | ✅ 挂载 | ❌ 构建产物 |
| 性能 | 一般 | 高性能 |
| 适用场景 | 本地开发 | 测试/生产 |

## 🎨 开发环境特性

### 热重载配置

已挂载源代码目录，修改代码会自动刷新：

```yaml
volumes:
  - ../../src:/app/src
  - ../../public:/app/public
  - ../../index.html:/app/index.html
```

### 访问开发工具

```bash
# 访问应用
http://localhost:5173

# Vite 开发工具
# 在浏览器控制台可以看到 HMR 状态
```

## 🚀 生产环境特性

### Nginx 优化

已配置以下优化：

- **Gzip 压缩** - 减小传输大小
- **静态资源缓存** - JS/CSS/图片缓存 1 年
- **HTML 不缓存** - 确保获取最新版本
- **安全头部** - X-Frame-Options、X-XSS-Protection 等
- **SPA 支持** - 所有路由返回 index.html

### API 代理（可选）

如需代理后端 API，编辑 `nginx.conf`：

```nginx
location /api/ {
    proxy_pass http://backend:8000/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
```

### HTTPS 配置（生产推荐）

```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # ... 其他配置
}
```

## 🛠️ 常用命令

### 开发环境

```bash
# 启动
docker-compose --env-file .env.dev --profile dev up -d

# 查看日志
docker-compose logs -f app-dev

# 进入容器
docker-compose exec app-dev sh

# 重启
docker-compose restart app-dev
```

### 生产环境

```bash
# 构建（需要时）
docker-compose --env-file .env.prod --profile prod build --no-cache

# 启动
docker-compose --env-file .env.prod --profile prod up -d

# 查看日志
docker-compose logs -f app-prod

# 重启
docker-compose restart app-prod
```

## 🐛 快速问题排查

**端口被占用**:
```bash
lsof -i :5173
# 修改 .env 中的 HOST_PORT
```

**热重载不工作**:
```bash
# 确保 volumes 正确挂载
docker-compose exec app-dev ls /app/src
# 确保 Vite 使用 --host 0.0.0.0
```

**生产环境 API 请求失败**:
```bash
# 检查 VITE_API_URL 是否正确
# 检查 nginx.conf 是否配置了 API 代理
```

**环境变量不生效**:
```bash
# 开发环境：确保变量以 VITE_ 开头，在 .env 文件中
# 生产环境：需要在构建时传递
docker-compose build --build-arg VITE_API_URL=https://api.example.com
```

**构建很慢**:
已配置淘宝 npm 源加速，如仍慢可检查网络。

## 📦 Bundle 分析

查看生产构建大小：

```bash
# 本地构建
npm run build

# 分析 bundle 大小
npm run build -- --mode analyze
```

## 📚 详细文档

完整的 Docker 使用指南和最佳实践：

- **[统一 Docker 指南](../../../DOCKER_GUIDE.md)** - 多环境部署、镜像源配置、安全实践
- **配置文件说明**:
  - [Dockerfile](./Dockerfile) - 开发环境配置
  - [Dockerfile.nginx](./Dockerfile.nginx) - 生产环境配置
  - [docker-compose.yml](./docker-compose.yml) - 服务编排（profiles）
  - [nginx.conf](./nginx.conf) - Nginx 详细配置
  - [.env.example](./.env.example) - 所有环境变量说明

## 💡 最佳实践

✅ 使用 `.env.dev`、`.env.test`、`.env.prod` 分别管理不同环境
✅ 环境变量必须以 `VITE_` 开头才能在客户端使用
✅ 不要在客户端代码中暴露敏感信息（API 密钥、令牌等）
✅ 开发环境使用热重载提高效率
✅ 生产环境使用多阶段构建减小镜像体积
✅ 生产环境配置 Nginx 缓存和 gzip
✅ 定期更新基础镜像（`docker-compose pull`）
✅ 使用 `npm run build -- --mode analyze` 分析包大小

---

需要更多帮助？查看 [DOCKER_GUIDE.md](../../../DOCKER_GUIDE.md) 获取详细说明。
