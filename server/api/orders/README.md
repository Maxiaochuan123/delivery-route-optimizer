# 订单管理 API

## 端点列表

### 1. 创建订单
**POST** `/api/orders`

创建新的配送订单。

**请求体：**
```json
{
  "address": "北京市朝阳区xxx",
  "customerName": "张三",
  "items": "商品A x2, 商品B x1",
  "lat": 39.9042,
  "lng": 116.4074,
  "notes": "请在下午送达"
}
```

**必填字段：**
- `address`: 配送地址
- `customerName`: 客户姓名
- `items`: 商品信息

**可选字段：**
- `lat`: 纬度
- `lng`: 经度
- `notes`: 备注信息

**响应：**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "address": "北京市朝阳区xxx",
    "customerName": "张三",
    "items": "商品A x2, 商品B x1",
    "lat": 39.9042,
    "lng": 116.4074,
    "notes": "请在下午送达",
    "status": "pending",
    "createdAt": "2025-10-21T09:00:00.000Z",
    "completedAt": null
  }
}
```

---

### 2. 获取所有订单
**GET** `/api/orders`

获取所有订单列表。

**响应：**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "address": "北京市朝阳区xxx",
      "customerName": "张三",
      ...
    }
  ]
}
```

---

### 3. 获取单个订单
**GET** `/api/orders/:id`

根据 ID 获取订单详情。

**路径参数：**
- `id`: 订单 ID

**响应：**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "address": "北京市朝阳区xxx",
    ...
  }
}
```

---

### 4. 更新订单
**PUT** `/api/orders/:id`

更新订单信息。

**路径参数：**
- `id`: 订单 ID

**请求体：**
```json
{
  "address": "新地址",
  "customerName": "李四",
  "items": "更新的商品信息",
  "notes": "更新的备注",
  "status": "completed"
}
```

**可更新字段：**
- `address`: 配送地址
- `customerName`: 客户姓名
- `items`: 商品信息
- `lat`: 纬度
- `lng`: 经度
- `notes`: 备注信息
- `status`: 订单状态（pending 或 completed）

**响应：**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "address": "新地址",
    ...
  }
}
```

---

### 5. 删除订单
**DELETE** `/api/orders/:id`

删除指定订单。

**路径参数：**
- `id`: 订单 ID

**响应：**
```json
{
  "success": true,
  "data": {
    "message": "Order deleted successfully",
    "id": 1
  }
}
```

---

### 6. 获取待处理订单
**GET** `/api/orders/pending`

获取所有状态为 pending 的订单。

**响应：**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "status": "pending",
      ...
    }
  ]
}
```

---

### 7. 获取已完成订单
**GET** `/api/orders/completed`

获取所有状态为 completed 的订单。

**响应：**
```json
{
  "success": true,
  "data": [
    {
      "id": 2,
      "status": "completed",
      "completedAt": "2025-10-21T10:00:00.000Z",
      ...
    }
  ]
}
```

---

### 8. 标记订单为已完成
**POST** `/api/orders/:id/complete`

将订单状态更新为已完成。

**路径参数：**
- `id`: 订单 ID

**响应：**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "status": "completed",
    "completedAt": "2025-10-21T10:00:00.000Z",
    ...
  }
}
```

---

## 错误响应

所有端点在出错时返回统一的错误格式：

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Missing required fields: address, customerName",
    "details": {
      "missing": ["address", "customerName"]
    }
  }
}
```

**常见错误码：**
- `VALIDATION_ERROR`: 请求数据验证失败
- `NOT_FOUND`: 订单不存在
- `DATABASE_ERROR`: 数据库操作失败
- `INTERNAL_ERROR`: 服务器内部错误

---

## 使用示例

### 使用 curl

```bash
# 创建订单
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "address": "北京市朝阳区xxx",
    "customerName": "张三",
    "items": "商品A x2"
  }'

# 获取所有订单
curl http://localhost:3000/api/orders

# 获取单个订单
curl http://localhost:3000/api/orders/1

# 更新订单
curl -X PUT http://localhost:3000/api/orders/1 \
  -H "Content-Type: application/json" \
  -d '{"notes": "更新的备注"}'

# 标记订单完成
curl -X POST http://localhost:3000/api/orders/1/complete

# 删除订单
curl -X DELETE http://localhost:3000/api/orders/1
```

### 使用 JavaScript (fetch)

```javascript
// 创建订单
const response = await fetch('http://localhost:3000/api/orders', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    address: '北京市朝阳区xxx',
    customerName: '张三',
    items: '商品A x2',
  }),
});
const result = await response.json();
console.log(result.data);
```
