# 地址管理 API

## 地理编码

### 1. 地址转经纬度（地理编码）
**POST** `/api/geocode`

将地址文本转换为经纬度坐标。

**请求体：**
```json
{
  "address": "北京市朝阳区望京SOHO"
}
```

**响应：**
```json
{
  "success": true,
  "data": {
    "lat": 39.9959,
    "lng": 116.4786,
    "formattedAddress": "北京市朝阳区望京街道望京SOHO",
    "province": "北京市",
    "city": "北京市",
    "district": "朝阳区"
  }
}
```

---

### 2. 经纬度转地址（逆地理编码）
**POST** `/api/geocode/reverse`

将经纬度坐标转换为地址文本。

**请求体：**
```json
{
  "lat": 39.9959,
  "lng": 116.4786
}
```

**响应：**
```json
{
  "success": true,
  "data": {
    "formattedAddress": "北京市朝阳区望京街道望京SOHO",
    "province": "北京市",
    "city": "北京市",
    "district": "朝阳区"
  }
}
```

---

## 常用地址管理

### 3. 获取所有常用地址
**GET** `/api/addresses/frequent`

获取所有常用地址，按使用次数降序排列。

**响应：**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "address": "北京市朝阳区望京SOHO",
      "alias": "公司",
      "lat": 39.9959,
      "lng": 116.4786,
      "usageCount": 15,
      "lastUsed": "2025-10-21T10:00:00.000Z"
    },
    {
      "id": 2,
      "address": "北京市海淀区中关村",
      "alias": "客户A",
      "lat": 39.9833,
      "lng": 116.3167,
      "usageCount": 8,
      "lastUsed": "2025-10-20T15:30:00.000Z"
    }
  ]
}
```

---

### 4. 添加或更新常用地址
**POST** `/api/addresses/frequent`

添加新的常用地址，如果地址已存在则增加使用次数。

**请求体：**
```json
{
  "address": "北京市朝阳区望京SOHO",
  "alias": "公司",
  "lat": 39.9959,
  "lng": 116.4786
}
```

**必填字段：**
- `address`: 地址文本

**可选字段：**
- `alias`: 地址别名（如"公司"、"客户A"）
- `lat`: 纬度
- `lng`: 经度

**响应：**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "address": "北京市朝阳区望京SOHO",
    "alias": "公司",
    "lat": 39.9959,
    "lng": 116.4786,
    "usageCount": 1,
    "lastUsed": "2025-10-21T10:00:00.000Z"
  }
}
```

**行为说明：**
- 如果地址已存在，会自动增加 `usageCount` 并更新 `lastUsed`
- 如果提供了新的 `alias` 或坐标，会更新这些字段
- 如果地址不存在，会创建新记录

---

### 5. 删除常用地址
**DELETE** `/api/addresses/frequent/:id`

删除指定的常用地址。

**路径参数：**
- `id`: 地址 ID

**响应：**
```json
{
  "success": true,
  "data": {
    "message": "Frequent address deleted successfully",
    "id": 1
  }
}
```

---

## 配置

### 环境变量

在项目根目录创建 `.env` 文件：

```env
AMAP_API_KEY=your_amap_api_key_here
```

### 获取高德地图 API Key

1. 访问 [高德开放平台](https://console.amap.com/dev/key/app)
2. 注册并登录
3. 创建应用
4. 添加 Key（选择"Web服务"类型）
5. 复制 Key 到 `.env` 文件

---

## 使用示例

### 使用 curl

```bash
# 地理编码
curl -X POST http://localhost:3000/api/geocode \
  -H "Content-Type: application/json" \
  -d '{"address": "北京市朝阳区望京SOHO"}'

# 逆地理编码
curl -X POST http://localhost:3000/api/geocode/reverse \
  -H "Content-Type: application/json" \
  -d '{"lat": 39.9959, "lng": 116.4786}'

# 获取常用地址
curl http://localhost:3000/api/addresses/frequent

# 添加常用地址
curl -X POST http://localhost:3000/api/addresses/frequent \
  -H "Content-Type: application/json" \
  -d '{
    "address": "北京市朝阳区望京SOHO",
    "alias": "公司",
    "lat": 39.9959,
    "lng": 116.4786
  }'

# 删除常用地址
curl -X DELETE http://localhost:3000/api/addresses/frequent/1
```

### 使用 JavaScript

```javascript
// 地理编码
const geocodeResult = await $fetch('/api/geocode', {
  method: 'POST',
  body: { address: '北京市朝阳区望京SOHO' },
});

// 逆地理编码
const reverseResult = await $fetch('/api/geocode/reverse', {
  method: 'POST',
  body: { lat: 39.9959, lng: 116.4786 },
});

// 获取常用地址
const addresses = await $fetch('/api/addresses/frequent');

// 添加常用地址
const newAddress = await $fetch('/api/addresses/frequent', {
  method: 'POST',
  body: {
    address: '北京市朝阳区望京SOHO',
    alias: '公司',
    lat: 39.9959,
    lng: 116.4786,
  },
});
```

---

## 错误处理

### 常见错误

**AMAP_API_KEY 未配置：**
```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "AMAP_API_KEY is not configured"
  }
}
```

**地址无效：**
```json
{
  "success": false,
  "error": {
    "code": "GEOCODING_FAILED",
    "message": "Address not found or invalid"
  }
}
```

**坐标无效：**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Latitude must be between -90 and 90"
  }
}
```
