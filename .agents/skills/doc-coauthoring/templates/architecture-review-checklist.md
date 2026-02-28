# FastAPI 架构评审清单

## 📝 使用说明

这份清单用于评审 FastAPI 项目的架构设计。在以下场景使用：
- 新项目启动前的架构设计评审
- 重大功能开发前的设计评审
- 定期架构审查（季度/半年）
- 代码审查时的架构符合性检查

**评分标准**：
- ✅ 已完成且符合标准
- ⚠️ 部分完成或需要改进
- ❌ 未完成或不符合标准
- N/A 不适用

---

## 1️⃣ 架构原则

### SOLID 原则

- [ ] **单一职责**：每个类/模块只负责一件事
  - Service 只包含业务逻辑
  - Endpoint 只处理 HTTP 请求/响应
  - Model 只定义数据结构和领域逻辑

- [ ] **开放封闭**：对扩展开放，对修改封闭
  - 使用抽象类和接口
  - 新功能通过继承而非修改实现

- [ ] **里氏替换**：子类可以替换父类
  - Repository 的不同实现可以互换

- [ ] **接口隔离**：接口小而专注
  - 避免臃肿的 Service 类
  - 按职责分离接口

- [ ] **依赖倒置**：依赖抽象而非具体实现
  - 使用 FastAPI 依赖注入
  - 依赖接口而非具体类

### 分层架构

- [ ] **层次清晰**：API、Service、Model、Database 分层明确
- [ ] **依赖方向正确**：上层依赖下层，不反向依赖
- [ ] **跨层调用**：避免跨层调用（如 API 直接访问 Database）

---

## 2️⃣ 项目结构

### 目录组织

- [ ] **按领域组织**：而非技术层（如 users、posts 而非 models、services）
  ```
  ✅ app/api/v1/endpoints/users.py
  ❌ app/endpoints/api.py
  ```

- [ ] **模块化**：每个功能模块相对独立
  ```
  app/
  ├── users/      # 用户模块
  ├── posts/      # 文章模块
  └── comments/   # 评论模块
  ```

- [ ] **配置集中**：配置文件统一管理
  ```
  app/core/config.py
  .env
  ```

### 文件命名

- [ ] **命名一致**：遵循统一的命名规范
  - Schema: `{Resource}Create`, `{Resource}Update`, `{Resource}Response`
  - Service: `{Resource}Service`
  - Model: `{Resource}`

---

## 3️⃣ API 设计

### RESTful 规范

- [ ] **资源命名**：使用名词复数，而非动词
  ```
  ✅ GET /api/v1/users
  ❌ GET /api/v1/getUsers
  ```

- [ ] **HTTP 方法正确使用**：
  - GET: 查询（幂等、安全）
  - POST: 创建
  - PUT: 完整更新
  - PATCH: 部分更新
  - DELETE: 删除

- [ ] **状态码准确**：
  - 200: 成功
  - 201: 创建成功
  - 204: 成功无返回内容
  - 400: 客户端错误
  - 401: 未认证
  - 403: 无权限
  - 404: 资源不存在
  - 409: 冲突
  - 500: 服务器错误

### 版本管理

- [ ] **API 版本化**：URL 路径版本（/api/v1）
- [ ] **向后兼容**：旧版本保持可用
- [ ] **废弃通知**：通过响应头告知废弃信息

### 文档

- [ ] **自动生成文档**：FastAPI Swagger UI 可访问
- [ ] **端点描述完整**：每个端点有清晰的文档字符串
- [ ] **示例完整**：请求和响应示例

---

## 4️⃣ 数据层

### 数据库设计

- [ ] **表命名规范**：小写、下划线分隔、复数形式
  ```python
  __tablename__ = "users"
  __tablename__ = "user_profiles"
  ```

- [ ] **主键设计**：每个表有主键（通常是自增 ID）
- [ ] **外键约束**：关联表使用外键
- [ ] **索引优化**：
  - WHERE 条件字段有索引
  - JOIN 关联字段有索引
  - 频繁排序字段有索引
  - 避免过度索引

- [ ] **时间戳**：created_at、updated_at 字段
  ```python
  created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
  updated_at: Mapped[datetime] = mapped_column(
      default=datetime.utcnow,
      onupdate=datetime.utcnow
  )
  ```

### ORM 使用

- [ ] **关系定义正确**：relationship、back_populates 设置正确
- [ ] **懒加载配置**：selectinload、joinedload 正确使用
- [ ] **避免 N+1 查询**：使用 eager loading

### 事务管理

- [ ] **事务边界清晰**：在 Service 层管理事务
- [ ] **错误回滚**：异常时自动回滚
- [ ] **幂等性考虑**：多次执行同一操作结果一致

---

## 5️⃣ 业务逻辑

### Service 层

- [ ] **职责单一**：每个 Service 负责一个领域
- [ ] **方法命名清晰**：
  ```python
  create_user()
  get_user_by_id()
  list_users()
  update_user()
  delete_user()
  ```

- [ ] **依赖注入**：通过构造函数或参数注入依赖
  ```python
  class UserService:
      def __init__(self, db: AsyncSession, cache: CacheService):
          self.db = db
          self.cache = cache
  ```

- [ ] **业务验证**：复杂的业务规则在 Service 中验证
- [ ] **避免重复代码**：提取公共逻辑

### 错误处理

- [ ] **分层异常**：
  - 领域层：业务异常（UserNotFoundError）
  - 应用层：抛出业务异常
  - API 层：转换为 HTTP 响应

- [ ] **异常信息完整**：包含必要的上下文
  ```python
  raise UserNotFoundError(
      user_id=user_id,
      message=f"User {user_id} not found"
  )
  ```

- [ ] **全局异常处理**：统一的异常处理器

---

## 6️⃣ 认证和授权

### 认证

- [ ] **认证方式选择合理**：
  - API: JWT
  - Web: Session 或 JWT
  - 移动应用: OAuth2

- [ ] **Token 安全**：
  - 短过期时间（15-30分钟）
  - Refresh Token 机制
  - 安全存储（不存本地）

- [ ] **密码安全**：
  - 使用 bcrypt/argon2 加密
  - 永不明文存储
  - 强密码策略

### 授权

- [ ] **权限模型清晰**：RBAC 或 ABAC
- [ ] **权限检查**：每个需要授权的端点都检查
  ```python
  @router.delete("/posts/{post_id}")
  async def delete_post(
      post: Post = Depends(valid_post_id),
      user: User = Depends(get_current_user)
  ):
      if post.author_id != user.id and not user.is_admin:
          raise HTTPException(status_code=403)
  ```

- [ ] **最小权限原则**：只授予必要权限

---

## 7️⃣ 性能优化

### 查询优化

- [ ] **避免 N+1 查询**：使用 eager loading
- [ ] **分页实现**：大数据量使用分页
  - 基础分页：offset/limit
  - 游标分页：大数据量
- [ ] **查询结果缓存**：热点数据缓存
- [ ] **只查询需要的字段**：避免 SELECT *

### 缓存策略

- [ ] **缓存层次**：
  - 应用层缓存（Redis）
  - 数据库查询缓存
  - HTTP 缓存（CDN）

- [ ] **缓存模式**：
  - Cache-Aside（读多写少）
  - Write-Through（写操作也快）

- [ ] **缓存失效策略**：
  - TTL 过期
  - 手动失效
  - LRU 淘汰

- [ ] **缓存预热**：应用启动时加载热点数据

### 异步处理

- [ ] **异步 I/O**：数据库、HTTP 请求使用 async/await
- [ ] **后台任务**：长时间任务使用 Celery 或 BackgroundTasks
- [ ] **批量操作**：批量插入/更新而非循环

---

## 8️⃣ 安全性

### 输入验证

- [ ] **Pydantic 验证**：所有输入使用 Pydantic 验证
- [ ] **自定义验证器**：复杂验证逻辑使用 @validator
- [ ] **白名单验证**：而非黑名单

### 注入防护

- [ ] **SQL 注入**：使用 ORM，不拼接 SQL
- [ ] **XSS 防护**：返回 HTML 时转义
- [ ] **CSRF 防护**：使用 CSRF Token

### 其他安全措施

- [ ] **HTTPS**：生产环境强制 HTTPS
- [ ] **CORS 配置**：限制允许的域名
- [ ] **速率限制**：防止暴力破解和 DDoS
  ```python
  @limiter.limit("5/minute")
  async def login(request: Request):
      pass
  ```

- [ ] **敏感信息**：
  - 不记录密码、Token 到日志
  - 使用环境变量存储密钥
  - 敏感字段不在响应中返回

---

## 9️⃣ 可维护性

### 代码质量

- [ ] **代码格式统一**：使用 Black、Ruff
- [ ] **类型提示**：所有函数有类型提示
  ```python
  async def get_user(user_id: int) -> User:
      pass
  ```

- [ ] **文档字符串**：公共方法有文档
  ```python
  async def create_user(data: UserCreate) -> User:
      """
      创建新用户

      Args:
          data: 用户创建数据

      Returns:
          创建的用户对象

      Raises:
          ValueError: 邮箱已存在
      """
  ```

- [ ] **魔法数字**：使用常量或枚举
  ```python
  # ❌ 不好
  if user.status == 1:

  # ✅ 好
  class UserStatus(Enum):
      ACTIVE = 1
      INACTIVE = 2

  if user.status == UserStatus.ACTIVE:
  ```

### 测试

- [ ] **测试覆盖率**：> 80%
- [ ] **单元测试**：Service 层逻辑
- [ ] **集成测试**：API 端点
- [ ] **测试数据库**：使用独立的测试数据库
- [ ] **测试名称清晰**：
  ```python
  def test_create_user_with_valid_data_succeeds():
      pass

  def test_create_user_with_duplicate_email_raises_error():
      pass
  ```

### 日志

- [ ] **结构化日志**：使用 JSON 格式
- [ ] **日志级别正确**：
  - DEBUG: 调试信息
  - INFO: 一般信息
  - WARNING: 警告
  - ERROR: 错误
  - CRITICAL: 严重错误

- [ ] **上下文信息**：包含 request_id、user_id 等
- [ ] **敏感信息脱敏**：密码、Token 不记录

---

## 🔟 可扩展性

### 横向扩展

- [ ] **无状态设计**：不依赖本地状态
  - 使用 JWT 而非 Session
  - Session 存 Redis 而非内存

- [ ] **数据库连接池**：配置合理的连接池
  ```python
  engine = create_async_engine(
      DATABASE_URL,
      pool_size=20,          # 连接池大小
      max_overflow=10,       # 最大溢出
      pool_pre_ping=True     # 连接检查
  )
  ```

- [ ] **负载均衡**：支持多实例部署

### 监控和告警

- [ ] **健康检查端点**：
  ```python
  @router.get("/health")
  async def health_check():
      return {"status": "healthy"}
  ```

- [ ] **性能指标收集**：
  - 请求数、响应时间
  - 数据库查询时间
  - 缓存命中率

- [ ] **错误监控**：集成 Sentry 等错误追踪
- [ ] **链路追踪**：集成 OpenTelemetry

---

## 1️⃣1️⃣ 部署和运维

### 配置管理

- [ ] **环境分离**：dev、staging、prod 配置分离
- [ ] **配置文件**：使用 .env 文件
- [ ] **敏感配置**：不提交到 Git
- [ ] **配置验证**：启动时验证必需配置

### 容器化

- [ ] **Dockerfile**：优化的镜像构建
- [ ] **docker-compose**：本地开发环境
- [ ] **镜像大小**：使用多阶段构建，减小镜像

### CI/CD

- [ ] **自动化测试**：每次提交运行测试
- [ ] **代码质量检查**：Lint、类型检查
- [ ] **自动化部署**：通过 CI/CD 自动部署

---

## 📊 评审总结

### 评分统计

- ✅ 已完成：_____ 项
- ⚠️ 需改进：_____ 项
- ❌ 未完成：_____ 项
- N/A 不适用：_____ 项

**总分**：_____ / _____

### 主要问题

1.
2.
3.

### 改进建议

#### 高优先级（必须立即改进）

1.
2.
3.

#### 中优先级（建议改进）

1.
2.
3.

#### 低优先级（可选改进）

1.
2.

### 下一步行动

- [ ] 创建改进任务（TASK-XXX）
- [ ] 分配责任人
- [ ] 设置截止日期
- [ ] 安排复审

---

## 📝 评审记录

**评审日期**：YYYY-MM-DD
**评审人**：[名字]
**项目**：[项目名称]
**版本**：[版本号]

**评审结论**：
- [ ] 通过
- [ ] 通过（有条件）
- [ ] 不通过（需重大修改）

**签名**：___________

---

**模板版本**：v1.0
**更新日期**：2025-12-24
