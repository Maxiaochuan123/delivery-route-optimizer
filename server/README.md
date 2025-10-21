# Server API 文档

## 目录结构

```
server/
├── api/                    # API 端点
│   ├── orders/            # 订单相关 API
│   ├── routes/            # 路线优化 API
│   ├── addresses/         # 地址管理 API
│   ├── health.get.ts      # 健康检查
│   └── test.post.ts       # 测试端点
├── database/              # 数据库相关
│   ├── schema.ts          # 数据库表定义
│   ├── db.ts              # 数据库连接
│   └── migrate.ts         # 迁移脚本
├── middleware/            # 服务端中间件
│   ├── cors.ts            # CORS 配置
│   └── logger.ts          # 请求日志
└── utils/                 # 工具函数
    ├── db.ts              # 数据库操作
    ├── errors.ts          # 错误定义
    ├── response.ts        # 响应格式化
    ├── validation.ts      # 请求验证
    └── handler.ts         # API 处理器包装
```

## API 响应格式

### 成功响应

```json
{
  "success": true,
  "data": { ... },
  "message": "Optional success message"
}
```

### 错误响应

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error description",
    "details": { ... }
  }
}
```

## 使用示例

### 创建 API 端点

```typescript
// server/api/example.post.ts
import { defineApiHandler, getValidatedBody } from '../utils/handler';
import { validateRequired } from '../utils/validation';

export default defineApiHandler(async (event) => {
  // 获取并验证请求体
  const body = await getValidatedBody(event, (data) => {
    validateRequired(data, ['field1', 'field2']);
    return data;
  });

  // 处理业务逻辑
  const result = await someOperation(body);

  // 返回数据（自动包装为成功响应）
  return result;
});
```

### 错误处理

```typescript
import { createAppError } from '../utils/errors';

// 抛出验证错误
throw createAppError.validation('Invalid input');

// 抛出未找到错误
throw createAppError.notFound('Resource');

// 抛出数据库错误
throw createAppError.database('Database operation failed');
```

## 中间件

### CORS

自动为所有 API 请求添加 CORS 头，支持跨域访问。

### Logger

记录所有 API 请求的方法、路径、状态码和响应时间。

## 测试

访问以下端点测试 API 框架：

- `GET /api/health` - 健康检查
- `POST /api/test` - 测试端点（需要 `message` 字段）
