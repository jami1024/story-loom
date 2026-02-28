# FastAPI 最佳实践 Skill

这个 skill 包含了在生产环境中验证的 FastAPI 最佳实践，帮助你快速构建可扩展、易维护的 FastAPI 应用。

## 📚 包含内容

### 核心文件
- **SKILL.md**: 详细的 FastAPI 最佳实践指南
- **development-workflow.md**: 完整的开发工作规范
- **architecture-design.md**: 架构设计指南和技术选型框架
- **init-project.sh**: 项目初始化脚本（可选使用）

### 文档模板（templates/）
- **requirement-template.md**: 需求文档模板
- **design-template.md**: 技术设计文档模板
- **adr-template.md**: 架构决策记录（ADR）模板
- **architecture-review-checklist.md**: 架构评审清单

## 🚀 使用方法

### 方式 1: 自动触发（推荐）

当你向 Claude 提出以下需求时，这个 skill 会自动激活：

- "创建一个新的 FastAPI 项目"
- "帮我搭建 FastAPI API"
- "用 FastAPI 建立一个项目"
- "FastAPI 项目结构应该怎么组织"

### 方式 2: 手动使用初始化脚本

如果你想快速创建项目骨架，可以运行：

```bash
cd your-project-directory
bash .claude/skills/fastapi-best-practices/init-project.sh
```

这会创建完整的项目结构和基础文件。

## 📖 Skill 涵盖的内容

### 1. 项目结构
- 基于领域的代码组织
- 清晰的关注点分离
- 推荐的目录结构

### 2. Pydantic 最佳实践
- Schema 设计模式（Create, Update, Response）
- 数据验证技巧
- 自定义验证器

### 3. 异步编程
- 何时使用 async/await
- 避免阻塞事件循环
- CPU 密集型 vs I/O 密集型操作

### 4. 依赖注入
- 数据库会话管理
- 验证依赖
- 认证和授权
- 依赖缓存机制

### 5. 服务层模式
- 业务逻辑分离
- 可测试的代码结构

### 6. API 端点设计
- RESTful 最佳实践
- 错误处理
- 响应模型

### 7. 配置管理
- 环境变量
- 设置缓存

### 8. 测试
- 测试数据库设置
- 依赖覆盖
- API 测试示例

### 9. 开发工作流
- 需求分析 → 技术设计 → 任务分解 → 代码实现 → 测试验证
- 文档驱动开发
- Git 提交规范
- 代码审查清单

### 10. 文档模板
- 需求文档模板（用户故事、验收标准）
- 技术设计模板（API 设计、数据模型、服务层）
- ADR 架构决策记录模板

### 11. 架构设计
- SOLID 架构原则
- 分层架构模式
- 技术选型决策框架
- 常见架构决策点（认证、缓存、消息队列）
- 性能和可扩展性考虑
- 安全架构设计
- 架构评审清单

## 💡 使用示例

### 示例 1: 创建新项目

```
你: 帮我创建一个 FastAPI 项目，用于管理用户和文章

Claude: [自动应用 FastAPI 最佳实践]
我会帮你创建一个遵循最佳实践的 FastAPI 项目...
[创建完整的项目结构，包括用户和文章模块]
```

### 示例 2: 添加新功能

```
你: 在我的 FastAPI 项目中添加一个评论功能

Claude: [自动应用最佳实践]
我会按照项目的最佳实践添加评论功能...
[创建 Comment 模型、schema、服务和 API 端点]
```

### 示例 3: 代码审查

```
你: 帮我看看这段 FastAPI 代码有什么问题

Claude: [使用 skill 中的最佳实践检查代码]
我发现了几个可以改进的地方：
1. 建议使用依赖注入进行验证...
2. 这个路由应该是异步的...
```

### 示例 4: 按工作流开发新功能

```
你: 我要添加一个用户注册功能，请遵循开发工作流

Claude: [自动应用开发工作流]
好的，我会按照开发工作流程进行：

1. 需求分析阶段
   - 理解用户注册的需求
   - 明确验收标准

2. 技术设计阶段
   - 设计 API 端点
   - 设计数据模型和 Schema
   - 规划服务层

3. 任务分解（使用 TodoWrite）
   ✓ 创建 UserCreate Schema
   → 创建 User 模型
   - 实现注册服务
   - 创建注册端点
   - 编写测试

让我开始实现...
```

### 示例 5: 使用文档模板

```
你: 帮我创建一个用户注册功能的需求文档

Claude: [使用需求文档模板]
我会使用需求文档模板为你创建文档...
[创建包含用户故事、验收标准、API 设计的完整需求文档]
```

### 示例 6: 架构设计和技术选型

```
你: 我需要设计一个用户系统，帮我做架构设计和技术选型

Claude: [自动应用架构设计指南]
好的，我会帮你做架构设计和技术选型：

1. 架构原则（SOLID）
   - 分层架构：API、Service、Model、Database
   - 依赖注入模式

2. 技术选型决策
   - 数据库：PostgreSQL（需要 ACID 事务）
   - 缓存：Redis（会话和热点数据）
   - 认证：JWT（无状态、可扩展）

3. 架构决策点
   - 认证方式：JWT + Refresh Token
   - 密码加密：bcrypt
   - 缓存策略：Cache-Aside 模式

让我创建详细的技术设计文档...
```

### 示例 7: 架构评审

```
你: 帮我评审这个项目的架构

Claude: [使用架构评审清单]
我会使用架构评审清单进行全面评审：

✅ 已完成：
- SOLID 原则遵循良好
- 分层架构清晰
- 数据库索引优化

⚠️ 需要改进：
- 缺少缓存层
- N+1 查询问题
- 缺少速率限制

❌ 未完成：
- 没有监控和告警
- 缺少架构文档

让我提供详细的改进建议...
```

## 🎯 核心原则

这个 skill 遵循以下核心原则：

### 技术原则
1. **领域驱动设计** - 按业务领域组织代码
2. **关注点分离** - 路由、服务、模型清晰分离
3. **异步优先** - 充分利用 FastAPI 的性能优势
4. **依赖注入** - 使用 FastAPI 的依赖系统
5. **可测试性** - 编写易于测试的代码

### 工作流原则
1. **文档驱动** - 所有决策基于文档记录
2. **渐进确认** - 每阶段完成后需确认
3. **架构遵循** - 严格按照架构边界执行
4. **需求优先** - 先理解需求，再设计实现
5. **小步快跑** - 大功能分解为可独立交付的小模块

## 📂 文件结构

```
.claude/skills/fastapi-best-practices/
├── README.md                           # 本文件
├── SKILL.md                            # FastAPI 最佳实践核心内容
├── development-workflow.md             # 开发工作流程和规范
├── architecture-design.md              # 架构设计指南（新增）
├── init-project.sh                     # 项目初始化脚本
└── templates/                          # 文档模板
    ├── requirement-template.md         # 需求文档模板
    ├── design-template.md              # 技术设计模板
    ├── adr-template.md                 # ADR 模板
    └── architecture-review-checklist.md # 架构评审清单（新增）
```

## 📚 参考资源

- [FastAPI 官方文档](https://fastapi.tiangolo.com/)
- [zhanymkanov/fastapi-best-practices](https://github.com/zhanymkanov/fastapi-best-practices)
- [Pydantic 文档](https://docs.pydantic.dev/)

## 🔄 更新记录

- **2025-12-24 v3.0**:
  - 新增架构设计指南（architecture-design.md）
  - 添加 SOLID 原则和分层架构模式
  - 创建技术选型决策框架
  - 添加架构评审清单模板
  - 新增架构设计示例

- **2025-12-24 v2.0**:
  - 添加完整的开发工作规范（development-workflow.md）
  - 创建文档模板（需求、设计、ADR）
  - 整合工作流指导到 SKILL.md
  - 添加开发流程和代码审查清单

- **2025-12-24 v1.0**:
  - 创建 skill，包含完整的 FastAPI 最佳实践
  - 基于 zhanymkanov/fastapi-best-practices

## 💬 反馈

如果你有任何建议或发现问题，欢迎修改 SKILL.md 文件来改进这个 skill！
