# {功能名称} 技术设计

**编号**：DESIGN-XXX
**需求**：REQ-XXX
**创建日期**：YYYY-MM-DD
**负责人**：[名字]
**状态**：草稿 | 评审中 | 已确认 | 已实现

---

## 背景

### 问题描述
描述需要解决的技术问题。

### 目标
- 目标1
- 目标2

### 约束
- 约束1（如：必须使用 PostgreSQL）
- 约束2（如：响应时间 < 200ms）

---

## 系统架构

### 整体架构图

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│   Client    │─────▶│   FastAPI   │─────▶│  Database   │
└─────────────┘      └─────────────┘      └─────────────┘
                            │
                            ▼
                     ┌─────────────┐
                     │    Redis    │
                     └─────────────┘
```

### 数据流图

```
Request → Pydantic Schema → Dependency → Service → Database
                                ↓
                            Validation
```

---

## API 设计

### 端点定义

#### 1. 创建资源

```python
@router.post("/api/v1/resources", response_model=ResourceResponse, status_code=201)
async def create_resource(
    data: ResourceCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    创建新资源

    权限：需要认证
    """
    pass
```

**请求**：
```json
{
  "name": "资源名称",
  "description": "描述",
  "metadata": {
    "key": "value"
  }
}
```

**响应 201**：
```json
{
  "id": 1,
  "name": "资源名称",
  "description": "描述",
  "created_at": "2025-12-24T10:00:00Z",
  "owner_id": 1
}
```

**错误响应**：
- 400 Bad Request：输入验证失败
- 401 Unauthorized：未认证
- 409 Conflict：资源已存在

#### 2. 获取资源

```python
@router.get("/api/v1/resources/{resource_id}", response_model=ResourceResponse)
async def get_resource(
    resource: Resource = Depends(valid_resource_id)
):
    """获取资源详情"""
    return resource
```

#### 3. 更新资源

```python
@router.put("/api/v1/resources/{resource_id}", response_model=ResourceResponse)
async def update_resource(
    data: ResourceUpdate,
    resource: Resource = Depends(valid_resource_id),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """更新资源"""
    pass
```

#### 4. 删除资源

```python
@router.delete("/api/v1/resources/{resource_id}", status_code=204)
async def delete_resource(
    resource: Resource = Depends(valid_resource_id),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """删除资源"""
    pass
```

#### 5. 列表资源

```python
@router.get("/api/v1/resources", response_model=ResourceListResponse)
async def list_resources(
    skip: int = 0,
    limit: int = 100,
    filter_by: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """获取资源列表"""
    pass
```

---

## 数据模型设计

### 数据库表结构

```sql
CREATE TABLE resources (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    metadata JSONB,
    owner_id INTEGER NOT NULL REFERENCES users(id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_resources_owner_id ON resources(owner_id);
CREATE INDEX idx_resources_created_at ON resources(created_at);
CREATE INDEX idx_resources_name ON resources(name);
```

### SQLAlchemy 模型

```python
# app/models/resource.py
from sqlalchemy import Column, Integer, String, Text, Boolean, ForeignKey, TIMESTAMP
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime

class Resource(Base):
    __tablename__ = "resources"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    metadata: Mapped[dict] = mapped_column(JSONB, default={})
    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    is_active: Mapped[bool] = mapped_column(default=True)
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )

    # 关系
    owner: Mapped["User"] = relationship("User", back_populates="resources")
```

### Pydantic Schema

```python
# app/schemas/resource.py
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class ResourceBase(BaseModel):
    """基础 Schema"""
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    metadata: dict = Field(default_factory=dict)

class ResourceCreate(ResourceBase):
    """创建 Schema"""
    pass

class ResourceUpdate(BaseModel):
    """更新 Schema - 所有字段可选"""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None
    metadata: Optional[dict] = None

class ResourceResponse(ResourceBase):
    """响应 Schema"""
    id: int
    owner_id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ResourceListResponse(BaseModel):
    """列表响应"""
    total: int
    items: list[ResourceResponse]
```

---

## 服务层设计

```python
# app/services/resource_service.py
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.resource import Resource
from app.schemas.resource import ResourceCreate, ResourceUpdate

class ResourceService:
    """资源业务逻辑层"""

    @staticmethod
    async def create_resource(
        db: AsyncSession,
        data: ResourceCreate,
        owner_id: int
    ) -> Resource:
        """创建资源"""
        # 检查名称是否已存在
        stmt = select(Resource).where(Resource.name == data.name)
        result = await db.execute(stmt)
        if result.scalar_one_or_none():
            raise ValueError("Resource name already exists")

        # 创建资源
        resource = Resource(
            name=data.name,
            description=data.description,
            metadata=data.metadata,
            owner_id=owner_id
        )
        db.add(resource)
        await db.commit()
        await db.refresh(resource)
        return resource

    @staticmethod
    async def get_resource(db: AsyncSession, resource_id: int) -> Resource | None:
        """获取资源"""
        return await db.get(Resource, resource_id)

    @staticmethod
    async def list_resources(
        db: AsyncSession,
        skip: int = 0,
        limit: int = 100,
        owner_id: Optional[int] = None
    ) -> tuple[list[Resource], int]:
        """获取资源列表"""
        stmt = select(Resource)
        if owner_id:
            stmt = stmt.where(Resource.owner_id == owner_id)

        # 获取总数
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = await db.scalar(count_stmt)

        # 获取列表
        stmt = stmt.offset(skip).limit(limit).order_by(Resource.created_at.desc())
        result = await db.execute(stmt)
        items = result.scalars().all()

        return items, total

    @staticmethod
    async def update_resource(
        db: AsyncSession,
        resource: Resource,
        data: ResourceUpdate
    ) -> Resource:
        """更新资源"""
        update_data = data.model_dump(exclude_unset=True)

        # 检查名称唯一性
        if "name" in update_data:
            stmt = select(Resource).where(
                Resource.name == update_data["name"],
                Resource.id != resource.id
            )
            result = await db.execute(stmt)
            if result.scalar_one_or_none():
                raise ValueError("Resource name already exists")

        for field, value in update_data.items():
            setattr(resource, field, value)

        await db.commit()
        await db.refresh(resource)
        return resource

    @staticmethod
    async def delete_resource(db: AsyncSession, resource: Resource) -> None:
        """删除资源（软删除）"""
        resource.is_active = False
        await db.commit()
```

---

## 依赖设计

```python
# app/api/v1/dependencies.py
from fastapi import Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.resource import Resource

async def valid_resource_id(
    resource_id: int,
    db: AsyncSession = Depends(get_db)
) -> Resource:
    """验证资源 ID"""
    resource = await db.get(Resource, resource_id)
    if not resource or not resource.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Resource {resource_id} not found"
        )
    return resource

async def verify_resource_owner(
    resource: Resource = Depends(valid_resource_id),
    current_user: User = Depends(get_current_active_user)
) -> Resource:
    """验证资源所有权"""
    if resource.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this resource"
        )
    return resource
```

---

## 技术选型

| 组件 | 选择 | 理由 |
|------|------|------|
| Web 框架 | FastAPI | 高性能、异步支持、自动 API 文档 |
| ORM | SQLAlchemy 2.0 | 成熟稳定、异步支持、类型提示 |
| 数据库 | PostgreSQL | ACID 支持、JSONB 类型、性能优秀 |
| 缓存 | Redis | 高性能、简单易用 |
| 认证 | JWT | 无状态、可扩展 |
| 验证 | Pydantic | 类型安全、性能优秀 |

---

## 性能优化

### 数据库优化
1. 添加索引：owner_id, created_at, name
2. 使用连接池：最大连接数 20
3. 查询优化：使用 select_from 避免 N+1

### 缓存策略
```python
# 缓存资源详情（1小时）
cache_key = f"resource:{resource_id}"
cached = await redis.get(cache_key)
if cached:
    return cached

resource = await db.get(Resource, resource_id)
await redis.setex(cache_key, 3600, resource.json())
```

### 分页
- 默认：limit=100
- 最大：limit=1000
- 使用游标分页（如果需要）

---

## 安全考虑

### 认证
- 使用 JWT Bearer Token
- Token 过期时间：30 分钟
- Refresh Token：7 天

### 授权
- 资源所有者可以完全控制
- 其他用户只能读取公开资源

### 输入验证
- Pydantic 自动验证类型和格式
- 依赖注入验证业务规则
- SQL 注入：使用 ORM 防护

### 速率限制
- 每用户：100 req/min
- 每 IP：1000 req/min

---

## 错误处理

| 场景 | HTTP 状态码 | 错误代码 | 错误消息 |
|------|-------------|----------|----------|
| 验证失败 | 400 | VALIDATION_ERROR | 详细验证错误 |
| 未认证 | 401 | UNAUTHORIZED | Invalid credentials |
| 权限不足 | 403 | FORBIDDEN | Not authorized |
| 资源不存在 | 404 | NOT_FOUND | Resource not found |
| 资源冲突 | 409 | CONFLICT | Resource already exists |
| 服务器错误 | 500 | INTERNAL_ERROR | Internal server error |

---

## 测试策略

### 单元测试
- [ ] Schema 验证测试
- [ ] Service 业务逻辑测试
- [ ] 依赖验证测试
- [ ] 边界条件测试

### 集成测试
- [ ] API 端点测试（CRUD）
- [ ] 认证授权测试
- [ ] 错误处理测试

### 性能测试
- [ ] 并发测试：1000 req/s
- [ ] 响应时间：P95 < 200ms

---

## 部署考虑

### 环境变量
```bash
DATABASE_URL=postgresql+asyncpg://...
REDIS_URL=redis://...
SECRET_KEY=...
```

### 数据库迁移
```bash
alembic revision --autogenerate -m "Add resources table"
alembic upgrade head
```

### 监控指标
- 请求量、响应时间
- 错误率
- 数据库连接数
- 缓存命中率

---

## 风险评估

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|--------|------|----------|
| 数据库性能瓶颈 | 中 | 高 | 添加索引、读写分离 |
| 并发冲突 | 低 | 中 | 使用乐观锁 |
| 缓存失效 | 中 | 低 | 多级缓存、降级方案 |

---

## 实施计划

### Phase 1：基础功能（3天）
- [ ] 数据模型和迁移
- [ ] Schema 定义
- [ ] Service 层实现
- [ ] CRUD API 端点

### Phase 2：认证授权（2天）
- [ ] 添加认证依赖
- [ ] 实现权限验证
- [ ] 添加所有权检查

### Phase 3：优化和测试（2天）
- [ ] 添加缓存
- [ ] 性能优化
- [ ] 编写测试
- [ ] 文档完善

---

## 替代方案

### 方案 A：使用 MongoDB
**优点**：灵活的 Schema
**缺点**：缺少 ACID 支持
**不选原因**：需要事务支持

### 方案 B：使用 GraphQL
**优点**：灵活的查询
**缺点**：复杂度高、学习曲线陡
**不选原因**：RESTful API 足够

---

## 参考资料

- [FastAPI 文档](https://fastapi.tiangolo.com/)
- [SQLAlchemy 文档](https://docs.sqlalchemy.org/)
- [PostgreSQL 文档](https://www.postgresql.org/docs/)

---

## 审核记录

| 审核人 | 日期 | 结果 | 意见 |
|--------|------|------|------|
| [名字] | YYYY-MM-DD | 通过/修改 | 审核意见 |

---

**变更历史**

| 日期 | 版本 | 变更内容 | 修改人 |
|------|------|----------|--------|
| YYYY-MM-DD | 1.0 | 初始版本 | [名字] |
