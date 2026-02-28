# FastAPI 开发工作规范

## 📋 通用开发流程

关于通用的软件开发流程，请参考 **development-workflow skill**，其中包含：
- 需求分析方法
- 技术设计流程
- 任务分解模板（IMPLEMENTATION_PLAN.md）
- 代码审查清单
- 测试策略
- Git 提交规范（Conventional Commits）
- 文档模板（需求文档、设计文档、ADR）

本文档专注于 **FastAPI 特定** 的开发实践和工作流程。

---

## 🎯 FastAPI 核心理念

### 什么是简洁

- 每个函数/类只做一件事（单一职责）
- 避免过早抽象
- 不要耍小聪明 - 选择无聊但明显的方案
- **如果需要解释，说明太复杂了**
- 清晰意图优于聪明代码

### 核心原则

- **架构遵循** - 严格按照 FastAPI 分层架构边界执行
- **依赖注入优先** - 使用 FastAPI 依赖系统管理资源和验证
- **异步优先** - 充分利用 async/await
- **从现有代码学习** - 先研究和规划，再实现

---

## 🔨 FastAPI 实现流程（TDD 循环）

### 标准实现流程

```
1. 理解 → 研究代码库中 3 个类似实现，识别模式
2. 测试 → 先写测试（红灯）
3. 实现 → 最小代码通过测试（绿灯）
4. 重构 → 在测试通过的基础上清理代码
5. 提交 → 清晰的提交信息
```

### FastAPI 项目的实现顺序

```
Schema（API 契约）
  ↓
Model（数据存储）
  ↓
Service（业务逻辑）
  ↓
Endpoint（HTTP 接口）
  ↓
Test（功能验证）
```

**为什么这个顺序？**
- Schema 定义接口契约，先确定 API 设计
- Model 定义数据存储，确保数据结构正确
- Service 实现业务逻辑，保持代码分层
- Endpoint 连接 HTTP 和业务，简单的胶水代码
- Test 验证一切正常工作

### 实现示例：添加评论功能

```markdown
## 阶段 1：Schema 定义 ✅

### 实现
```python
# app/schemas/comment.py
from pydantic import BaseModel, Field

class CommentCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=500)
    post_id: int

class CommentResponse(BaseModel):
    id: int
    content: str
    author_id: int
    post_id: int
    created_at: datetime
```

### 测试
```python
def test_comment_create_validation():
    # 有效数据
    data = CommentCreate(content="Great post!", post_id=1)
    assert data.content == "Great post!"

    # 无效数据
    with pytest.raises(ValidationError):
        CommentCreate(content="", post_id=1)  # 内容为空
```

**提交**: `feat: 添加评论 Schema 定义`

---

## 阶段 2：数据模型 🔄

[继续下一阶段...]
```

---

## 🚨 遇到困难时（最多 3 次尝试）

**关键规则：每个问题最多尝试 3 次，然后必须停下来重新思考。**

### 3 次尝试后必须执行

在 `IMPLEMENTATION_PLAN.md` 中添加问题记录（格式参考 development-workflow skill）。

### 重新思考的方向

1. **研究 FastAPI 现有实现**
   - 在代码库中找 2-3 个类似的实现
   - 查看 FastAPI 官方文档和最佳实践
   - 搜索 GitHub 上的类似项目

2. **质疑基本假设**
   - 是否正确使用了 FastAPI 的依赖注入？
   - 是否遵循了 FastAPI 的异步模式？
   - 能分解成更小的问题吗？

3. **尝试不同角度**
   - 使用不同的 FastAPI 特性？
   - 调整架构模式？
   - 去掉抽象而不是增加？

### 实际示例：添加缓存功能

```markdown
## 问题记录

### 问题：为用户查询添加缓存
**发现时间**：2025-12-24
**所在阶段**：阶段 3 - 服务层优化

#### 尝试 1：使用 Python 装饰器 (失败)
**时间**：10:30
**做了什么**：创建通用 `@cache` 装饰器
```python
def cache(func):
    @wraps(func)
    async def wrapper(*args, **kwargs):
        key = f"{func.__name__}:{args}"
        cached = await redis.get(key)
        if cached:
            return cached
        result = await func(*args, **kwargs)
        await redis.set(key, result)
        return result
    return wrapper
```

**错误**：装饰器无法正确序列化 SQLAlchemy 对象
**分析**：Redis 需要 JSON 可序列化的数据，ORM 对象不行
**学习**：装饰器在异步 + ORM 环境下很复杂

#### 尝试 2：在 Service 方法中手动添加 (失败)
**时间**：11:00
**做了什么**：在每个 Service 方法中添加缓存逻辑
```python
async def get_user(db: AsyncSession, user_id: int):
    cached = await redis.get(f"user:{user_id}")
    if cached:
        return json.loads(cached)
    user = await db.get(User, user_id)
    await redis.set(f"user:{user_id}", user.json())
    return user
```

**问题**：代码重复，每个方法都要写类似逻辑
**分析**：不够 DRY，维护困难
**学习**：需要某种抽象，但不应该是装饰器

#### 尝试 3：使用 FastAPI 依赖注入 (成功)
**时间**：14:00
**做了什么**：
1. 研究了项目中其他地方如何使用依赖
2. 发现 `get_db` 就是依赖注入的例子
3. 创建缓存依赖

```python
# app/core/cache.py
class CacheService:
    def __init__(self, redis: Redis):
        self.redis = redis

    async def get_user(self, user_id: int) -> dict | None:
        cached = await self.redis.get(f"user:{user_id}")
        return json.loads(cached) if cached else None

    async def set_user(self, user_id: int, user: dict):
        await self.redis.setex(
            f"user:{user_id}",
            3600,
            json.dumps(user)
        )

async def get_cache() -> CacheService:
    redis = await get_redis_connection()
    return CacheService(redis)

# app/services/user_service.py
class UserService:
    @staticmethod
    async def get_user(
        db: AsyncSession,
        cache: CacheService,
        user_id: int
    ) -> User:
        # 先查缓存
        cached = await cache.get_user(user_id)
        if cached:
            return User(**cached)

        # 查数据库
        user = await db.get(User, user_id)
        if user:
            await cache.set_user(user_id, user.dict())
        return user

# app/api/v1/endpoints/users.py
@router.get("/{user_id}")
async def get_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    cache: CacheService = Depends(get_cache)
):
    return await UserService.get_user(db, cache, user_id)
```

**成功原因**：
1. 符合 FastAPI 依赖注入模式
2. 易于测试（可以 mock CacheService）
3. 代码清晰，易于理解
4. 可复用，其他地方也能用

**学习**：遵循框架的核心模式，而不是对抗它
```

---

## 🏗️ FastAPI 技术标准

### 架构原则

#### 1. 组合优于继承
```python
# ❌ 不好：复杂的继承层次
class BaseService:
    def save(self): pass

class CachedService(BaseService):
    def save(self):
        super().save()

# ✅ 好：通过依赖注入组合
class UserService:
    def __init__(self, db: Database, cache: Cache):
        self.db = db
        self.cache = cache

    async def save(self, user: User):
        await self.cache.set(f"user:{user.id}", user)
        return await self.db.save(user)
```

#### 2. 接口优于单例
```python
# ❌ 不好：全局单例
class Database:
    _instance = None

# ✅ 好：通过依赖注入
async def get_db() -> AsyncSession:
    async with async_session() as session:
        yield session
```

#### 3. 显式优于隐式
```python
# ❌ 不好：隐式依赖
class UserService:
    async def create_user(self, email: str):
        db = get_global_db()  # 魔法般的全局变量

# ✅ 好：显式依赖
class UserService:
    async def create_user(self, db: AsyncSession, email: str):
        # 依赖清晰可见
```

#### 4. 测试驱动
```python
# 1. 先写测试
async def test_create_user():
    user = await UserService.create_user(db, "test@example.com")
    assert user.email == "test@example.com"

# 2. 再实现功能
class UserService:
    @staticmethod
    async def create_user(db: AsyncSession, email: str):
        user = User(email=email)
        db.add(user)
        await db.commit()
        return user
```

---

## 🔧 FastAPI 错误处理

### 原则

1. **快速失败** - 尽早发现问题
2. **描述性信息** - 包含调试所需的上下文
3. **适当层次** - 在正确的地方处理错误
4. **永远不要静默吞掉异常**

### FastAPI 错误处理最佳实践

```python
# ❌ 不好：静默失败
async def get_user(user_id: int):
    try:
        user = await db.get(User, user_id)
        return user
    except Exception:
        return None  # 丢失了错误信息

# ❌ 不好：泛泛而谈
async def get_user(user_id: int):
    if not user:
        raise HTTPException(status_code=404)  # 缺少上下文

# ✅ 好：清晰的错误信息
async def valid_user_id(
    user_id: int,
    db: AsyncSession = Depends(get_db)
) -> User:
    """验证并返回用户，如果不存在则自动返回 404"""
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(
            status_code=404,
            detail={
                "error": "user_not_found",
                "user_id": user_id,
                "message": f"User {user_id} does not exist"
            }
        )
    return user

# ✅ 更好：服务层抛出业务异常，端点层转换
class UserNotFoundError(Exception):
    def __init__(self, user_id: int):
        self.user_id = user_id

# Service 层
class UserService:
    @staticmethod
    async def get_user(db: AsyncSession, user_id: int):
        user = await db.get(User, user_id)
        if not user:
            raise UserNotFoundError(user_id)
        return user

# 全局异常处理
@app.exception_handler(UserNotFoundError)
async def user_not_found_handler(request: Request, exc: UserNotFoundError):
    return JSONResponse(
        status_code=404,
        content={"error": "user_not_found", "user_id": exc.user_id}
    )
```

---

## 🤔 FastAPI 决策框架

当有多个有效方案时，按以下优先级选择：

### 1. 可测试性（最重要）
> 我能轻松测试这个吗？
> 能否 mock 依赖？

### 2. 可读性
> 6 个月后有人能理解吗？

```python
# ❌ 聪明但晦涩
u = [x for x in l if x.a and not x.d and x.e > 5]

# ✅ 清晰明了
active_premium_users = [
    user for user in users
    if user.is_active
    and not user.is_deleted
    and user.subscription_level > 5
]
```

### 3. 一致性
> 这与项目现有模式匹配吗？
> 是否遵循 FastAPI 惯用法？

**关键：在实现前，找 3 个类似功能作为参考**

### 4. 简洁性
> 这是能工作的最简单方案吗？
> 是否充分利用 FastAPI 的特性？

### 5. 可逆性
> 以后改起来有多难？

---

## 📚 FastAPI 项目集成

### 学习代码库（实现前必做）

1. **找 3 个类似的功能/组件**
   ```bash
   # 例如：要实现评论功能
   # 1. 查看 app/api/v1/endpoints/users.py
   # 2. 查看 app/api/v1/endpoints/posts.py
   # 3. 查看 app/api/v1/endpoints/likes.py
   ```

2. **识别 FastAPI 通用模式和约定**
   - Schema 命名：`{Resource}Create`, `{Resource}Update`, `{Resource}Response`
   - Service 方法：`create_{resource}`, `get_{resource}`, `list_{resources}`
   - 依赖命名：`valid_{resource}_id`, `get_current_user`
   - 异步函数：所有 I/O 操作使用 async/await

3. **使用相同的库/工具**
   - 不要引入新库，除非有充分理由并得到团队同意
   - 优先使用 FastAPI 内置特性

4. **遵循现有测试模式**
   - 使用 pytest-asyncio
   - 使用项目的 fixtures（如 `async_client`, `test_db`）

---

## ✅ FastAPI 质量门控

### 完成定义（Definition of Done）

一个 FastAPI 任务只有满足以下所有条件才算完成：

- [ ] **测试**：编写了异步测试且全部通过
- [ ] **规范**：代码遵循 FastAPI 项目约定
- [ ] **类型**：所有函数有类型提示
- [ ] **依赖**：正确使用依赖注入系统
- [ ] **异步**：I/O 操作使用 async/await
- [ ] **文档**：端点有文档字符串（自动生成 Swagger）
- [ ] **Schema**：输入输出使用 Pydantic Schema

### FastAPI 测试指南

#### 1. 测试行为，不测试实现
```python
# ❌ 不好：测试实现细节
def test_create_user_calls_add():
    db.add.assert_called_once()

# ✅ 好：测试行为结果
async def test_create_user_returns_user_with_email():
    user = await service.create_user(db, "test@example.com")
    assert user.email == "test@example.com"
```

#### 2. 使用 FastAPI 测试客户端
```python
from httpx import AsyncClient

async def test_create_user_endpoint(async_client: AsyncClient):
    response = await async_client.post(
        "/api/v1/users",
        json={"email": "test@example.com", "username": "test"}
    )
    assert response.status_code == 201
    assert response.json()["email"] == "test@example.com"
```

#### 3. 清晰的测试名称描述场景
```python
# ❌ 不好
def test_user():
    ...

# ✅ 好
async def test_create_user_with_valid_email_succeeds():
    ...

async def test_create_user_with_duplicate_email_raises_409():
    ...
```

---

## ⚠️ FastAPI 特定注意事项

### 永远不要

- ❌ 在异步函数中使用同步数据库操作
- ❌ 在 endpoint 中写业务逻辑（应该在 Service 层）
- ❌ 绕过 Pydantic 验证直接使用字典
- ❌ 使用全局变量而不是依赖注入
- ❌ 在 endpoint 中直接操作 database session

### 永远要

- ✅ 使用 async/await 处理 I/O
- ✅ 使用依赖注入管理资源
- ✅ 使用 Pydantic Schema 验证输入
- ✅ 在 Service 层实现业务逻辑
- ✅ 使用类型提示（充分利用 FastAPI 的自动补全）
- ✅ 编写异步测试

---

## 🚀 FastAPI 快速开始清单

### 开始新功能前

1. [ ] 阅读并理解需求
2. [ ] 在代码库中找 3 个类似的 FastAPI 实现
3. [ ] 识别要遵循的 FastAPI 模式
4. [ ] 规划 Schema → Model → Service → Endpoint → Test 顺序
5. [ ] 确认每个阶段的成功标准

### 开发 FastAPI 功能时

1. [ ] 先定义 Pydantic Schema
2. [ ] 创建或修改 SQLAlchemy Model
3. [ ] 实现 Service 层业务逻辑
4. [ ] 创建 Endpoint（使用依赖注入）
5. [ ] 编写异步测试
6. [ ] 验证 Swagger 文档生成正确

### 完成 FastAPI 功能后

1. [ ] 所有异步测试通过
2. [ ] 类型检查通过（mypy）
3. [ ] Pydantic Schema 验证正确
4. [ ] 依赖注入使用正确
5. [ ] Swagger 文档清晰完整
6. [ ] 无同步阻塞操作

---

## 📋 FastAPI 实战示例

### 示例：实现评论功能

#### 第 1 步：定义 Schema

```python
# app/schemas/comment.py
from pydantic import BaseModel, Field
from datetime import datetime

class CommentBase(BaseModel):
    content: str = Field(..., min_length=1, max_length=500)

class CommentCreate(CommentBase):
    post_id: int

class CommentUpdate(BaseModel):
    content: str | None = Field(None, min_length=1, max_length=500)

class CommentResponse(CommentBase):
    id: int
    author_id: int
    post_id: int
    created_at: datetime

    class Config:
        from_attributes = True
```

#### 第 2 步：定义 Model

```python
# app/models/comment.py
from sqlalchemy import Integer, String, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime

class Comment(Base):
    __tablename__ = "comments"

    id: Mapped[int] = mapped_column(primary_key=True)
    content: Mapped[str] = mapped_column(Text)
    author_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    post_id: Mapped[int] = mapped_column(ForeignKey("posts.id"))
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)

    author: Mapped["User"] = relationship("User", back_populates="comments")
    post: Mapped["Post"] = relationship("Post", back_populates="comments")
```

#### 第 3 步：实现 Service

```python
# app/services/comment_service.py
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

class CommentService:
    @staticmethod
    async def create_comment(
        db: AsyncSession,
        data: CommentCreate,
        author_id: int
    ) -> Comment:
        comment = Comment(
            content=data.content,
            post_id=data.post_id,
            author_id=author_id
        )
        db.add(comment)
        await db.commit()
        await db.refresh(comment)
        return comment

    @staticmethod
    async def get_comment(db: AsyncSession, comment_id: int) -> Comment | None:
        return await db.get(Comment, comment_id)
```

#### 第 4 步：创建 Endpoint

```python
# app/api/v1/endpoints/comments.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter()

@router.post("/", response_model=CommentResponse, status_code=status.HTTP_201_CREATED)
async def create_comment(
    data: CommentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """创建评论"""
    return await CommentService.create_comment(db, data, current_user.id)

@router.get("/{comment_id}", response_model=CommentResponse)
async def get_comment(
    comment: Comment = Depends(valid_comment_id)
):
    """获取评论详情"""
    return comment

# 依赖
async def valid_comment_id(
    comment_id: int,
    db: AsyncSession = Depends(get_db)
) -> Comment:
    comment = await CommentService.get_comment(db, comment_id)
    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Comment {comment_id} not found"
        )
    return comment
```

#### 第 5 步：编写测试

```python
# tests/api/v1/test_comments.py
import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_create_comment_succeeds(
    async_client: AsyncClient,
    test_user: User,
    test_post: Post
):
    response = await async_client.post(
        "/api/v1/comments",
        json={"content": "Great post!", "post_id": test_post.id},
        headers={"Authorization": f"Bearer {test_user.token}"}
    )
    assert response.status_code == 201
    data = response.json()
    assert data["content"] == "Great post!"
    assert data["post_id"] == test_post.id

@pytest.mark.asyncio
async def test_create_comment_with_empty_content_fails(async_client: AsyncClient):
    response = await async_client.post(
        "/api/v1/comments",
        json={"content": "", "post_id": 1}
    )
    assert response.status_code == 422
```

---

**版本**：v3.0
**更新日期**：2025-12-25
**核心原则**：FastAPI 依赖注入、异步优先、Schema → Model → Service → Endpoint → Test
