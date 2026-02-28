# 软件开发工作流程 Skill

**版本**: v1.0.0
**语言无关**: ✅

通用的软件工程实践和开发流程规范。

## 概述

本 Skill 提供语言和框架无关的软件开发最佳实践，包括：

- 📋 需求分析方法
- 🏗️ 技术设计流程
- ✅ 任务分解和管理
- 👀 代码审查清单
- 🧪 测试策略
- 📝 文档模板

## 适用场景

### ✅ 使用本 Skill

- 需求分析和用户故事编写
- 技术设计和架构决策
- 编写需求文档、设计文档、ADR
- 代码审查流程和清单
- 测试策略规划
- 项目管理和任务分解

### 🤝 与其他 Skill 协同

本 Skill 提供通用流程，配合技术栈特定的 Skill 使用：

```
development-workflow (本 Skill)
         +
fastapi-best-practices  →  FastAPI 项目开发
         +
golang-best-practices   →  Golang 项目开发
         +
react-best-practices    →  React 项目开发
```

## 核心内容

### 1. 六步开发流程

```
需求分析 → 技术设计 → 任务分解 → 代码实现 → 代码审查 → 测试验证
```

### 2. 标准文档模板

所有模板由 **doc-coauthoring skill** 提供：

- **需求文档模板** - 记录功能需求和验收标准
- **设计文档模板** - 记录技术方案和架构设计
- **ADR 模板** - 记录架构决策
- **架构评审清单** - 系统化评审架构

详见 [doc-coauthoring skill](../doc-coauthoring/SKILL.md)

### 3. 最佳实践

- Git 提交规范（Conventional Commits）
- 代码审查清单
- 测试金字塔
- 任务优先级管理

## 快速开始

### 场景 1：编写需求文档

```
1. 使用 doc-coauthoring skill 提供的需求文档模板
   参考：../.claude/skills/doc-coauthoring/templates/requirement-template.md

2. 填写需求内容
   - 背景和目标
   - 用户故事
   - 功能需求
   - 验收标准

3. 评审和确认
```

### 场景 2：记录架构决策

```
1. 使用 doc-coauthoring skill 提供的 ADR 模板
   参考：../.claude/skills/doc-coauthoring/templates/adr-template.md

2. 填写决策内容
   - 背景
   - 决策
   - 原因
   - 后果

3. 团队评审
```

### 场景 3：代码审查

```
使用代码审查清单（SKILL.md 第 5 节）：

- [ ] 功能性检查
- [ ] 可读性检查
- [ ] 可维护性检查
- [ ] 性能检查
- [ ] 安全性检查
- [ ] 测试覆盖
```

## 文档结构

```
development-workflow/
├── SKILL.md                         # 核心工作流程和最佳实践
└── README.md                        # 本文件

文档模板请参考：
../doc-coauthoring/templates/        # 需求、设计、ADR 等模板
```

## 使用示例

### 示例 1：新功能开发

```
用户："我需要添加用户批量导入功能"

工作流：
1. 需求分析
   - 使用 requirement-template.md 编写需求文档
   - 定义用户故事和验收标准

2. 技术设计
   - 使用 design-template.md 设计方案
   - 记录 ADR（如：选择 CSV 解析库）

3. 任务分解
   - 使用 TodoWrite 创建任务清单

4. 代码实现
   - 遵循 Conventional Commits 规范提交

5. 代码审查
   - 使用代码审查清单

6. 测试验证
   - 按测试金字塔编写测试
```

### 示例 2：技术选型

```
用户："帮我选择数据库"

工作流：
1. 使用 ADR 模板记录决策过程
2. 分析各个选项的优缺点
3. 记录最终决策和理由
4. 团队评审和确认
```

## 与技术栈 Skill 的关系

```
┌─────────────────────────────────────────────────┐
│          development-workflow                   │
│          (通用流程和模板)                        │
└───────────────┬─────────────────────────────────┘
                │
        ┌───────┼───────┐
        ↓       ↓       ↓
   ┌─────┐ ┌─────┐ ┌─────┐
   │FastAPI│ │Golang│ │React│
   │(具体) │ │(具体)│ │(具体)│
   └─────┘ └─────┘ └─────┘
```

**分工**：
- **development-workflow**：通用流程、文档模板、最佳实践
- **技术栈 Skill**：具体语言/框架的实现、架构模式、工具链

## 核心原则

### 1. 语言无关
本 Skill 的所有内容都不依赖特定编程语言或框架。

### 2. 实用导向
提供可直接使用的模板和清单，而非抽象概念。

### 3. 标准化
统一团队的开发流程和文档规范。

### 4. 灵活性
可根据项目实际情况调整和裁剪。

## 最佳实践

### Do's ✅
- ✅ 使用标准文档模板
- ✅ 记录重要的技术决策（ADR）
- ✅ 进行代码审查
- ✅ 遵循 Git 提交规范
- ✅ 编写测试

### Don'ts ❌
- ❌ 跳过需求分析直接写代码
- ❌ 忽略代码审查反馈
- ❌ 不写文档和测试
- ❌ 提交信息不规范
- ❌ 过度设计

## 相关资源

### 内部 Skills
- [FastAPI Best Practices](../fastapi-best-practices/README.md)
- [Golang Best Practices](../golang-best-practices/README.md)
- [React Best Practices](../react-best-practices/README.md)

### 外部资源
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Architecture Decision Records](https://adr.github.io/)
- [Google Engineering Practices](https://google.github.io/eng-practices/)

## 维护

**版本**: v1.0.0
**最后更新**: 2025-12-25
**维护者**: Claude Code Skills

## 反馈

如果你有改进建议或发现问题，欢迎反馈！
