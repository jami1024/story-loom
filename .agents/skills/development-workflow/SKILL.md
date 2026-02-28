---
name: development-workflow
description: 当用户需要了解软件开发流程、需求分析、技术设计、代码审查、测试策略、项目管理、CI/CD、分支策略时使用。触发词：开发流程、需求分析、技术设计、代码审查、测试策略、项目管理、文档模板、ADR、CI/CD、分支策略
---

# 软件开发工作流程

**版本**: v1.0.0
**更新日期**: 2025-12-25

本 skill 提供**语言无关**的通用开发流程和最佳实践。

---

## 📋 Skill 定位

本 skill 专注于**通用的软件工程实践**，不涉及特定编程语言或框架。

### 适用场景

- ✅ 需求分析和用户故事编写
- ✅ 技术设计和架构决策记录（ADR）
- ✅ 任务分解和项目管理
- ✅ 代码审查流程和清单
- ✅ 测试策略和质量保证
- ✅ 文档编写规范
- ✅ Git 分支策略（GitHub Flow / Git Flow）
- ✅ CI/CD 流水线配置

### 与其他 Skill 协同

```
development-workflow (通用流程)
         ↓
    协同使用
         ↓
├─→ fastapi-best-practices  (FastAPI 特定)
├─→ golang-best-practices   (Golang 特定)
└─→ react-best-practices    (React 特定)
```

---

## 🔄 核心开发流程

### 标准六步流程

```
1. 需求分析
   ↓
2. 技术设计
   ↓
3. 任务分解
   ↓
4. 代码实现
   ↓
5. 代码审查
   ↓
6. 测试验证
```

---

## 1️⃣ 需求分析

### 目标

理解要实现的功能和用户场景，明确需求边界。

### 判断是否需要文档化

- ✅ **需要文档**：
  - 新功能开发
  - 多模块影响
  - 架构变更
  - 需要评审的改动

- ❌ **不需要文档**：
  - 简单 Bug 修复
  - 代码格式化
  - 文档更新
  - 单文件小改动

### 需求文档模板

编写需求文档时，使用 **doc-coauthoring skill** 提供的结构化协作流程和标准模板（requirement-template.md）。

### 用户故事格式

```
作为 [角色]
我想要 [功能]
以便于 [价值]

验收标准：
- [ ] 标准 1
- [ ] 标准 2
- [ ] 标准 3
```

### 示例

```
作为 系统管理员
我想要 批量导入用户数据
以便于 快速完成用户初始化

验收标准：
- [ ] 支持 CSV 和 Excel 格式
- [ ] 单次可导入 1000 条记录
- [ ] 导入失败时提供详细错误信息
- [ ] 导入过程可中断和恢复
```

---

## 2️⃣ 技术设计

### 目标

设计技术方案，做出架构决策，记录关键选择。

### 技术设计文档模板

编写技术设计文档时，使用 **doc-coauthoring skill** 提供的结构化协作流程和标准模板（design-template.md）。

### 架构决策记录（ADR）

对于重要的技术决策，使用 **doc-coauthoring skill** 提供的 ADR 模板（adr-template.md）。

**何时使用 ADR**：
- 选择技术栈（数据库、框架、库）
- 架构模式决策（微服务、分层架构）
- 重要的设计模式选择
- 影响长期维护的决策

### ADR 示例

```markdown
# ADR-001: 选择 PostgreSQL 作为主数据库

## 状态
已接受

## 背景
需要为新项目选择数据库，要求支持复杂查询、事务和高并发。

## 决策
选择 PostgreSQL 作为主数据库。

## 原因
1. 强大的 ACID 事务支持
2. 丰富的数据类型（JSON、数组等）
3. 优秀的性能和可扩展性
4. 活跃的社区和成熟的生态

## 后果
- 正面：稳定可靠，功能丰富
- 负面：相比 NoSQL 在某些场景下性能稍差
- 风险：团队需要学习 PostgreSQL 特性
```

---

## 3️⃣ 任务分解

### 目标

将大任务分解为小的、可独立完成的子任务。

### 分解原则

1. **单一职责** - 每个任务只做一件事
2. **可测试** - 每个任务完成后可以测试
3. **适度大小** - 2-8 小时完成
4. **明确产出** - 清楚任务完成的标准

### 使用 TaskCreate 工具

```markdown
使用 TaskCreate 创建任务清单：

- [ ] 设计数据库 Schema
- [ ] 实现数据模型
- [ ] 实现 CRUD API
- [ ] 编写单元测试
- [ ] 编写集成测试
- [ ] 更新 API 文档
```

### 任务优先级

- 🔴 **P0** - 紧急且重要（立即处理）
- 🟠 **P1** - 重要但不紧急（本周完成）
- 🟡 **P2** - 不重要但紧急（可安排他人）
- 🟢 **P3** - 不紧急不重要（有空再做）

---

## 4️⃣ 代码实现

### 实现原则

1. **先设计后实现** - 不要直接写代码
2. **小步提交** - 频繁提交，每次提交可运行
3. **及时重构** - 发现坏味道立即重构
4. **编写测试** - TDD 或至少写单元测试

### 代码质量标准

- ✅ 遵循语言/框架的最佳实践
- ✅ 有适当的注释（为什么，而非是什么）
- ✅ 变量和函数命名清晰
- ✅ 函数保持简短（< 50 行）
- ✅ 避免重复代码（DRY 原则）
- ✅ 错误处理完善

### Git 提交规范

使用 Conventional Commits：

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Type 类型**：
- `feat`: 新功能
- `fix`: Bug 修复
- `docs`: 文档更新
- `style`: 代码格式（不影响代码运行）
- `refactor`: 重构（既不是新功能也不是修复）
- `perf`: 性能优化
- `test`: 测试相关
- `chore`: 构建过程或辅助工具变动

**示例**：
```
feat(user): 添加用户批量导入功能

- 支持 CSV 和 Excel 格式
- 单次最多导入 1000 条记录
- 添加导入进度显示

Closes #123
```

---

## 5️⃣ 代码审查

### 目标

通过 Code Review 发现问题，提高代码质量，分享知识。

### 代码审查清单

#### 功能性
- [ ] 代码是否实现了需求？
- [ ] 边界条件是否处理？
- [ ] 错误处理是否完善？
- [ ] 是否有潜在的 Bug？

#### 可读性
- [ ] 代码是否易于理解？
- [ ] 命名是否清晰？
- [ ] 是否有必要的注释？
- [ ] 代码结构是否清晰？

#### 可维护性
- [ ] 是否遵循 SOLID 原则？
- [ ] 是否有重复代码？
- [ ] 函数是否过长？
- [ ] 是否易于扩展？

#### 性能
- [ ] 是否有性能问题？
- [ ] 数据库查询是否优化？
- [ ] 是否有内存泄漏风险？
- [ ] 是否有不必要的计算？

#### 安全性
- [ ] 是否有 SQL 注入风险？
- [ ] 是否有 XSS 风险？
- [ ] 敏感信息是否加密？
- [ ] 权限检查是否完善？

#### 测试
- [ ] 是否有单元测试？
- [ ] 测试覆盖率是否足够？
- [ ] 测试是否有意义？
- [ ] 是否测试了边界条件？

### Code Review 礼仪

**作为审查者**：
- ✅ 提建设性意见，而非指责
- ✅ 解释为什么，而非只说怎么改
- ✅ 认可好的代码
- ✅ 区分"必须改"和"建议改"

**作为被审查者**：
- ✅ 开放心态，接受批评
- ✅ 主动解释复杂的逻辑
- ✅ 及时回应评论
- ✅ 不要把批评当作人身攻击

---

## 6️⃣ 测试验证

### 测试金字塔

```
       /\
      /  \  E2E 测试（少量）
     /____\
    /      \  集成测试（适量）
   /________\
  /          \ 单元测试（大量）
 /__________\
```

### 测试类型

#### 1. 单元测试
- **目标**：测试单个函数/方法
- **特点**：快速、独立、可重复
- **覆盖率**：70-80%

#### 2. 集成测试
- **目标**：测试模块间交互
- **特点**：测试真实依赖（数据库、API）
- **覆盖率**：关键路径

#### 3. 端到端测试
- **目标**：测试完整用户流程
- **特点**：慢、脆弱、成本高
- **覆盖率**：核心业务流程

### 测试策略

1. **关键路径优先** - 先测试最重要的功能
2. **边界条件** - 测试极端情况
3. **错误情况** - 测试失败场景
4. **性能测试** - 对性能敏感的功能
5. **回归测试** - 修复 Bug 后添加测试

### 测试命名规范

```
test_<功能>_<场景>_<预期结果>

示例：
test_create_user_with_valid_data_succeeds()
test_create_user_with_duplicate_email_fails()
test_get_user_by_id_when_not_exists_returns_404()
```

---

## 📄 文档模板和协作编写

### 使用 doc-coauthoring skill

当需要编写正式文档时，使用 **doc-coauthoring skill** 提供的结构化协作流程和标准模板。

**doc-coauthoring skill 提供**：
1. **三阶段协作流程**：
   - Context Gathering（收集上下文）
   - Refinement & Structure（迭代完善）
   - Reader Testing（读者验证）

2. **标准文档模板**：
   - **需求文档模板**：记录功能需求、用户故事、验收标准
   - **技术设计文档模板**：记录技术方案、架构设计、接口定义
   - **ADR 模板**：记录重要的技术决策、选择理由、权衡分析
   - **架构评审清单**：系统化地评审架构设计

3. **质量保证方法**：
   - Reader Testing（用 fresh Claude 验证文档可读性）
   - 迭代优化流程
   - 文档完整性检查

**何时使用 doc-coauthoring**：
- 编写需求文档、设计文档、ADR 时
- 需要确保文档质量和可读性时
- 需要结构化的文档编写指导时

---

## 🔀 Git 分支策略

### GitHub Flow（推荐中小型项目）

```
main ─────────────────────────────────────────→
  └── feature/add-user-import ──── PR ──→ merge
  └── fix/login-error ───────────── PR ──→ merge
```

**规则**：
1. `main` 分支始终可部署
2. 从 `main` 创建功能分支，命名：`feature/xxx`、`fix/xxx`、`refactor/xxx`
3. 通过 Pull Request 合并，必须通过 CI 和 Code Review
4. 合并后立即部署

### Git Flow（适合版本发布制项目）

```
main ────────────────────────── tag v1.0 ── tag v1.1 ──→
  └── develop ────────────────────────────────────────→
       └── feature/xxx ──→ merge to develop
       └── release/1.1 ──→ merge to main + develop
  └── hotfix/critical-bug ──→ merge to main + develop
```

**何时使用 Git Flow**：
- 有明确版本发布周期的项目
- 需要同时维护多个版本
- 需要 hotfix 机制

---

## 🚀 CI/CD 流水线

### 基础流水线结构

```
代码提交 → 代码检查 → 单元测试 → 构建 → 部署
   ↓          ↓          ↓        ↓       ↓
  Push      Lint      Test     Build   Deploy
          + Format   + Cover
```

### GitHub Actions 示例

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup
        uses: actions/setup-node@v4  # 或 setup-python、setup-go
      - name: Lint
        run: make lint

  test:
    runs-on: ubuntu-latest
    needs: lint
    steps:
      - uses: actions/checkout@v4
      - name: Setup
        uses: actions/setup-node@v4
      - name: Test
        run: make test
      - name: Upload coverage
        uses: codecov/codecov-action@v4

  build:
    runs-on: ubuntu-latest
    needs: test
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - name: Build
        run: make build
```

### CI/CD 最佳实践

1. **快速反馈** - CI 流程控制在 10 分钟内
2. **并行执行** - lint 和 test 可以并行
3. **缓存依赖** - 使用 `actions/cache` 加速构建
4. **环境隔离** - staging 环境验证后再部署 production
5. **回滚机制** - 部署失败时能快速回滚
6. **密钥管理** - 使用 GitHub Secrets / Vault，不硬编码

---

## 🎯 最佳实践总结

### Do's ✅

1. **小步快跑** - 增量开发，频繁集成
2. **先计划后执行** - 磨刀不误砍柴工
3. **及时重构** - 保持代码整洁
4. **编写测试** - 测试是质量保证
5. **文档同步** - 代码和文档同步更新
6. **代码审查** - 互相学习，提高质量

### Don'ts ❌

1. **不要跳过设计** - 直接写代码容易返工
2. **不要忽略测试** - 测试不是浪费时间
3. **不要过度设计** - 够用就好，不要过度工程
4. **不要拒绝重构** - "以后再改"永远不会改
5. **不要单打独斗** - 及时沟通，寻求帮助
6. **不要忽略代码审查反馈** - 反馈是学习机会

---

## 📚 相关 Skills

### 文档编写
- **doc-coauthoring** - 结构化文档协作编写流程和标准模板

### 后端开发
- **fastapi-best-practices** - FastAPI 开发实践
- **golang-best-practices** - Golang 开发实践

### 前端开发
- **react-best-practices** - React 开发实践
- **frontend-design** - UI 设计指导

---

## 🔗 外部资源

- [Conventional Commits](https://www.conventionalcommits.org/)
- [Architecture Decision Records](https://adr.github.io/)
- [Code Review Best Practices](https://google.github.io/eng-practices/review/)
- [Testing Best Practices](https://martinfowler.com/testing/)

---

**最后更新**：2025-12-25
**维护者**：Claude Code Skills
