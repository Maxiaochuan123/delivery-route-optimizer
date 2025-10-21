# 配送路径优化系统

个人商家配送路径优化工具，帮助优化配送路线，减少配送时间和距离。

## 技术栈

- **前端框架**: Nuxt 4 + Vue 3 + TypeScript
- **UI 组件**: shadcn-vue + Radix Vue
- **地图服务**: 高德地图 API
- **数据库**: SQLite + Drizzle ORM
- **代码规范**: ESLint + Prettier

## 项目结构

```
delivery-route-optimizer/
├── .kiro/specs/          # 项目规格文档
│   ├── requirements.md   # 需求文档
│   ├── design.md         # 设计文档
│   └── tasks.md          # 任务列表
├── app/                  # Nuxt 应用入口
├── components/           # Vue 组件
├── composables/          # Vue 组合式函数
├── pages/                # 页面路由
├── server/               # 服务端代码
│   ├── api/             # API 端点
│   └── utils/           # 服务端工具函数
├── lib/                  # 工具库
├── types/                # TypeScript 类型定义
├── utils/                # 客户端工具函数
└── public/               # 静态资源
```

## 开发指南

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

访问 `http://localhost:3000`

### 代码检查和格式化

```bash
# 运行 ESLint
npm run lint

# 自动修复 ESLint 问题
npm run lint:fix

# 格式化代码
npm run format
```

### 构建生产版本

```bash
npm run build
npm run preview
```

## 功能特性

- ✅ 订单地址管理
- ✅ 当前位置设定
- ✅ 路线优化计算
- ✅ 地图路线展示
- ✅ 导航集成
- ✅ 配送历史记录
- ✅ 常用地址管理

## 开发进度

查看 `.kiro/specs/tasks.md` 了解详细的开发任务和进度。
