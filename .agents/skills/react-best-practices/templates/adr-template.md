# ADR-[编号]: [决策标题]

**状态**: [提议中 | 已接受 | 已弃用 | 已替代]
**日期**: YYYY-MM-DD
**决策者**: [姓名]
**关联文档**: [相关需求、设计文档编号]

---

## 上下文和问题陈述

简要描述需要做出决策的背景和面临的问题。

**示例**：
```
我们的用户管理系统需要实现认证机制。目前需要在 Session、JWT 和 OAuth2 之间选择一种方案。
系统特点：
- RESTful API 服务
- 移动端和 Web 端都需要访问
- 未来可能需要支持第三方应用接入
- 目前无需复杂的权限管理
```

---

## 决策驱动因素

列出影响决策的关键因素（正面和负面）。

### 正面因素（希望达成的目标）

- 🎯 **无状态**: API 服务器无状态，易于水平扩展
- 🎯 **跨域支持**: 移动端和 Web 端都能方便使用
- 🎯 **性能**: 认证过程不应成为性能瓶颈
- 🎯 **开发效率**: 实现简单，易于维护
- 🎯 **安全性**: 满足基本安全要求

### 负面因素（需要规避的问题）

- ❌ **复杂性**: 避免过度复杂的方案
- ❌ **依赖**: 减少外部服务依赖
- ❌ **成本**: 控制额外的基础设施成本
- ❌ **学习曲线**: 团队已有技术栈优先

---

## 考虑的方案

### 方案 1: Session + Cookie

**描述**:
使用传统的 Session 机制，Session ID 存储在 Cookie 中，Session 数据存储在服务器端（Redis）。

**优点**:
- ✅ 成熟稳定，被广泛使用
- ✅ 容易实现会话失效和注销
- ✅ 服务端完全控制会话

**缺点**:
- ❌ 需要服务端存储 Session（Redis）
- ❌ 水平扩展需要 Session 共享
- ❌ Cookie 在跨域场景下有限制
- ❌ 移动端支持不友好

**实现复杂度**: 中

**维护成本**: 中

### 方案 2: JWT (JSON Web Token)

**描述**:
使用 JWT 作为认证令牌，Token 包含用户信息并签名，客户端在每次请求时携带 Token。

**优点**:
- ✅ 无状态，服务器不需要存储会话
- ✅ 天然支持跨域和移动端
- ✅ 易于水平扩展
- ✅ 可以包含用户信息，减少数据库查询

**缺点**:
- ❌ Token 无法主动失效（除非引入黑名单）
- ❌ Token 过期后需要刷新机制
- ❌ Token 较大，每次请求都需要传输

**实现复杂度**: 低

**维护成本**: 低

### 方案 3: OAuth 2.0

**描述**:
使用 OAuth 2.0 协议，支持授权服务器、资源服务器分离。

**优点**:
- ✅ 标准协议，易于集成第三方
- ✅ 支持多种授权方式
- ✅ 安全性高

**缺点**:
- ❌ 实现复杂度高
- ❌ 对于简单场景过度设计
- ❌ 需要额外的授权服务器

**实现复杂度**: 高

**维护成本**: 高

---

## 决策结果

**选择的方案**: **方案 2 - JWT**

### 理由

1. **无状态特性符合需求**: 我们的 API 服务需要易于水平扩展，JWT 的无状态特性完美满足这一需求。

2. **跨平台支持**: JWT 对移动端和 Web 端都友好，只需在 HTTP Header 中携带 Token。

3. **实现简单**: 相比 OAuth 2.0，JWT 的实现复杂度低，开发效率高。

4. **团队熟悉**: 团队已有使用 JWT 的经验，学习成本低。

5. **满足当前需求**: 对于用户认证场景，JWT 已经足够，暂不需要 OAuth 2.0 的复杂特性。

### 权衡

虽然 JWT 无法主动失效，但可以通过以下方式缓解：
- 设置较短的 Token 过期时间（24 小时）
- 实现 Token 刷新机制
- 如有需要，可引入 Token 黑名单（Redis）

---

## 实现细节

### Token 结构

```json
{
  "alg": "HS256",
  "typ": "JWT"
}
{
  "user_id": 123,
  "username": "john",
  "exp": 1735142400,
  "iat": 1735056000
}
```

### 配置参数

```yaml
jwt:
  secret: "your-256-bit-secret"
  expires: 24h
  issuer: "myapp"
```

### 使用方式

**获取 Token**:
```http
POST /v1/auth/login
Content-Type: application/json

{
  "username": "john",
  "password": "password123"
}

Response:
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "expires_at": "2024-12-25T10:00:00Z"
}
```

**使用 Token**:
```http
GET /v1/users/123
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

### 安全措施

1. **密钥管理**: Secret Key 通过环境变量配置，不硬编码
2. **HTTPS**: 生产环境强制 HTTPS，防止 Token 被截获
3. **过期时间**: Token 有效期 24 小时，过期后需重新登录
4. **签名验证**: 服务端验证 Token 签名，防止篡改

---

## 后续影响

### 架构影响

- ✅ API 服务器无状态，易于水平扩展
- ✅ 不需要 Redis 存储 Session（可选）
- ✅ 代码简化，减少 Session 管理逻辑

### 开发影响

- 📝 需要实现 Token 生成和验证逻辑
- 📝 需要实现认证中间件
- 📝 需要考虑 Token 刷新机制（后续）

### 运维影响

- 🔧 需要妥善保管 Secret Key
- 🔧 需要在配置中心管理 JWT 配置
- 🔧 密钥轮换需要制定策略（后续）

---

## 验证

### 功能验证

- [ ] 用户登录成功返回 Token
- [ ] 携带 Token 访问受保护接口成功
- [ ] 无效 Token 返回 401 错误
- [ ] 过期 Token 返回 401 错误
- [ ] Token 签名验证正确

### 性能验证

- [ ] Token 验证耗时 < 10ms
- [ ] 支持 1000+ 并发认证请求

### 安全验证

- [ ] Token 篡改后验证失败
- [ ] HTTPS 传输
- [ ] Secret Key 不泄露

---

## 替代方案

如果未来需求变化，可以考虑以下替代方案：

### 场景 1: 需要主动失效 Token

**方案**: JWT + Redis 黑名单
- Token 依然使用 JWT
- 需要失效时，将 Token 加入 Redis 黑名单
- 认证时先检查黑名单

### 场景 2: 需要复杂的权限管理

**方案**: JWT + Casbin
- Token 依然使用 JWT
- 权限管理使用 Casbin
- Token 中只存储用户 ID，权限从数据库/缓存查询

### 场景 3: 需要支持第三方应用

**方案**: 迁移到 OAuth 2.0
- 保留 JWT 用于第一方应用
- 增加 OAuth 2.0 支持第三方应用
- 可以共用授权逻辑

---

## 相关决策

- [ADR-002: 选择 bcrypt 作为密码加密算法](ADR-002-password-hashing.md)
- [ADR-003: API 响应格式标准化](ADR-003-api-response-format.md)

---

## 参考资料

- [JWT 官方文档](https://jwt.io/introduction)
- [JWT 最佳实践](https://datatracker.ietf.org/doc/html/rfc8725)
- [OWASP JWT Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html)

---

## 注释

### 为什么不选择 Session？

虽然 Session 是成熟方案，但不符合我们的无状态架构目标。引入 Redis 存储 Session 会增加系统复杂度和成本。

### 为什么不选择 OAuth 2.0？

OAuth 2.0 适合需要第三方授权的场景，对于当前的用户认证需求过于复杂。如果未来有第三方接入需求，可以在 JWT 基础上扩展。

### Token 刷新机制为什么延后？

为了简化初期实现，Token 刷新机制放在后续迭代。当前 24 小时的有效期已经能满足用户体验需求。

---

## 变更记录

| 日期 | 版本 | 变更内容 | 变更人 |
|------|------|----------|--------|
| 2024-12-24 | v1.0 | 初始版本，决定使用 JWT | [姓名] |

---

## 示例：其他常见 ADR

### ADR-002: 选择 bcrypt 作为密码加密算法

**决策**: 使用 bcrypt (cost=10) 加密存储密码

**理由**:
- 专门设计用于密码哈希
- 内置盐值，防止彩虹表攻击
- 计算成本可调，可抵御暴力破解
- Go 标准库支持 (golang.org/x/crypto/bcrypt)

**替代方案**: Argon2id（更新的算法，但 bcrypt 已足够安全且更成熟）

---

### ADR-003: 选择 GORM 作为 ORM

**决策**: 使用 GORM v2 作为 ORM 框架

**理由**:
- 功能丰富（Preload、Association、Hook）
- 社区活跃，生态好
- 支持多种数据库
- 开发效率高

**替代方案**:
- ent: 类型安全更好，但学习曲线陡
- sqlx: 更轻量，但需要手写更多 SQL

---

### ADR-004: 选择 Wire 作为依赖注入工具

**决策**: 使用 Wire 进行依赖注入

**理由**:
- 编译时依赖注入，无运行时反射
- 类型安全，编译器检查
- 生成的代码可读性强
- 性能高

**替代方案**:
- dig: 运行时注入，更灵活但有反射开销
- fx: Uber 出品，功能更丰富但更复杂

---

## ADR 编号规范

ADR 按时间顺序递增编号：

```
docs/adr/
├── ADR-001-jwt-authentication.md
├── ADR-002-bcrypt-password-hashing.md
├── ADR-003-gorm-as-orm.md
├── ADR-004-wire-dependency-injection.md
└── ADR-005-gin-web-framework.md
```

每个重要的技术决策都应该有对应的 ADR 文档。
