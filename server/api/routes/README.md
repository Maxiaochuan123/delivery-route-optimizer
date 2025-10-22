# 路线优化 API

## 端点列表

### 1. 路线优化（通用）
**POST** `/api/routes/optimize`

根据起始位置和目的地列表，计算最优配送路线。

**请求体：**
```json
{
  "startLocation": {
    "lat": 39.9042,
    "lng": 116.4074,
    "address": "北京市东城区天安门广场"
  },
  "destinations": [
    {
      "id": "1",
      "lat": 39.9959,
      "lng": 116.4786,
      "address": "北京市朝阳区望京SOHO"
    },
    {
      "id": "2",
      "lat": 39.9833,
      "lng": 116.3167,
      "address": "北京市海淀区中关村"
    }
  ]
}
```

**必填字段：**
- `startLocation`: 起始位置
  - `lat`: 纬度
  - `lng`: 经度
  - `address`: 地址（可选）
- `destinations`: 目的地数组（最多 20 个）
  - `id`: 目的地唯一标识
  - `lat`: 纬度
  - `lng`: 经度
  - `address`: 地址（可选）

**响应：**
```json
{
  "success": true,
  "data": {
    "optimizedRoute": [
      {
        "id": "start",
        "sequence": 0,
        "lat": 39.9042,
        "lng": 116.4074,
        "address": "北京市东城区天安门广场",
        "distanceToNext": 15230,
        "durationToNext": 1820
      },
      {
        "id": "2",
        "sequence": 1,
        "lat": 39.9833,
        "lng": 116.3167,
        "address": "北京市海淀区中关村",
        "distanceToNext": 12450,
        "durationToNext": 1490
      },
      {
        "id": "1",
        "sequence": 2,
        "lat": 39.9959,
        "lng": 116.4786,
        "address": "北京市朝阳区望京SOHO",
        "distanceToNext": 0,
        "durationToNext": 0
      }
    ],
    "totalDistance": 27680,
    "totalDuration": 3310,
    "summary": {
      "totalDistanceKm": "27.68",
      "totalDurationMin": 55,
      "stopCount": 2
    }
  }
}
```

**字段说明：**
- `optimizedRoute`: 优化后的路线（按访问顺序）
  - `sequence`: 访问顺序（0 为起点）
  - `distanceToNext`: 到下一个点的距离（米）
  - `durationToNext`: 到下一个点的时间（秒）
- `totalDistance`: 总距离（米）
- `totalDuration`: 总时间（秒）
- `summary`: 摘要信息
  - `totalDistanceKm`: 总距离（公里）
  - `totalDurationMin`: 总时间（分钟）
  - `stopCount`: 配送点数量

---

### 2. 基于订单的路线优化
**POST** `/api/routes/optimize-orders`

根据订单 ID 列表计算最优配送路线。

**请求体：**
```json
{
  "startLocation": {
    "lat": 39.9042,
    "lng": 116.4074,
    "address": "北京市东城区天安门广场"
  },
  "orderIds": [1, 2, 3, 4, 5]
}
```

**必填字段：**
- `startLocation`: 起始位置
  - `lat`: 纬度
  - `lng`: 经度
  - `address`: 地址（可选）
- `orderIds`: 订单 ID 数组（最多 20 个）

**响应：**
```json
{
  "success": true,
  "data": {
    "optimizedRoute": [
      {
        "orderId": null,
        "sequence": 0,
        "lat": 39.9042,
        "lng": 116.4074,
        "address": "北京市东城区天安门广场",
        "customerName": null,
        "items": null,
        "notes": null,
        "distanceToNext": 15230,
        "durationToNext": 1820
      },
      {
        "orderId": 2,
        "sequence": 1,
        "lat": 39.9833,
        "lng": 116.3167,
        "address": "北京市海淀区中关村",
        "customerName": "李四",
        "items": "商品B x3",
        "notes": "请在下午送达",
        "distanceToNext": 12450,
        "durationToNext": 1490
      }
    ],
    "totalDistance": 27680,
    "totalDuration": 3310,
    "summary": {
      "totalDistanceKm": "27.68",
      "totalDurationMin": 55,
      "totalDurationHours": "0.9",
      "stopCount": 2,
      "orderCount": 2
    }
  }
}
```

**注意事项：**
- 订单必须已经有坐标信息（lat 和 lng）
- 如果订单没有坐标，需要先调用地理编码 API
- 起点的 `orderId` 为 `null`

---

## 算法说明

### 算法选择策略

系统会根据订单数量自动选择最优算法：

- **≤8 个订单**: 使用最近邻算法 + 2-opt 优化
  - 提供更优的路线
  - 计算时间稍长但可接受
  
- **>8 个订单**: 仅使用最近邻算法
  - 快速计算
  - 提供较好的路线（非最优但实用）

### 距离计算

1. **优先使用高德地图 API**
   - 获取实际道路距离和预估时间
   - 考虑路况和交通情况

2. **备选方案：Haversine 公式**
   - 当 API 调用失败时使用
   - 计算直线距离
   - 估算时间（假设平均速度 30km/h）

---

## 使用示例

### 使用 curl

```bash
# 通用路线优化
curl -X POST http://localhost:3000/api/routes/optimize \
  -H "Content-Type: application/json" \
  -d '{
    "startLocation": {
      "lat": 39.9042,
      "lng": 116.4074,
      "address": "北京市东城区天安门广场"
    },
    "destinations": [
      {
        "id": "1",
        "lat": 39.9959,
        "lng": 116.4786,
        "address": "北京市朝阳区望京SOHO"
      },
      {
        "id": "2",
        "lat": 39.9833,
        "lng": 116.3167,
        "address": "北京市海淀区中关村"
      }
    ]
  }'

# 基于订单的路线优化
curl -X POST http://localhost:3000/api/routes/optimize-orders \
  -H "Content-Type: application/json" \
  -d '{
    "startLocation": {
      "lat": 39.9042,
      "lng": 116.4074,
      "address": "我的位置"
    },
    "orderIds": [1, 2, 3, 4, 5]
  }'
```

### 使用 JavaScript

```javascript
// 通用路线优化
const result = await $fetch('/api/routes/optimize', {
  method: 'POST',
  body: {
    startLocation: {
      lat: 39.9042,
      lng: 116.4074,
      address: '北京市东城区天安门广场',
    },
    destinations: [
      {
        id: '1',
        lat: 39.9959,
        lng: 116.4786,
        address: '北京市朝阳区望京SOHO',
      },
      {
        id: '2',
        lat: 39.9833,
        lng: 116.3167,
        address: '北京市海淀区中关村',
      },
    ],
  },
});

console.log(`总距离: ${result.summary.totalDistanceKm} 公里`);
console.log(`预计时间: ${result.summary.totalDurationMin} 分钟`);

// 基于订单的路线优化
const orderResult = await $fetch('/api/routes/optimize-orders', {
  method: 'POST',
  body: {
    startLocation: {
      lat: 39.9042,
      lng: 116.4074,
      address: '我的位置',
    },
    orderIds: [1, 2, 3, 4, 5],
  },
});
```

---

## 错误处理

### 常见错误

**缺少起始位置：**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Start location is required"
  }
}
```

**目的地数量超限：**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Maximum 20 destinations allowed"
  }
}
```

**订单没有坐标：**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Some orders do not have coordinates. Please geocode addresses first."
  }
}
```

**路线计算失败：**
```json
{
  "success": false,
  "error": {
    "code": "ROUTE_CALCULATION_FAILED",
    "message": "Failed to optimize route"
  }
}
```

---

## 性能说明

- **小规模（≤8 个订单）**: 通常在 2-5 秒内完成
- **中等规模（9-15 个订单）**: 通常在 5-10 秒内完成
- **大规模（16-20 个订单）**: 通常在 10-15 秒内完成

实际时间取决于：
- 高德地图 API 响应速度
- 网络状况
- 服务器性能
