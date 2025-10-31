import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// 订单表
export const orders = sqliteTable('orders', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  address: text('address').notNull(),
  lat: real('lat'),
  lng: real('lng'),
  customerName: text('customer_name'),
  items: text('items'),
  notes: text('notes'),
  contactType: text('contact_type'), // 'phone' | 'wechat'
  contactValue: text('contact_value'), // 电话号码或微信号
  status: text('status').default('pending').notNull(), // pending, completed, cancelled
  cancelReason: text('cancel_reason'), // 取消原因
  createdAt: text('created_at')
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  completedAt: text('completed_at'),
});

// 配送记录表
export const deliverySessions = sqliteTable('delivery_sessions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  startLocation: text('start_location').notNull(),
  startLat: real('start_lat'),
  startLng: real('start_lng'),
  totalDistance: integer('total_distance'), // 米
  totalDuration: integer('total_duration'), // 秒
  orderCount: integer('order_count'),
  status: text('status').default('pending').notNull(), // pending, in_progress, completed, cancelled
  cancelReason: text('cancel_reason'), // 取消原因
  createdAt: text('created_at')
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  completedAt: text('completed_at'),
});

// 配送路线表
export const deliveryRoutes = sqliteTable('delivery_routes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  sessionId: integer('session_id')
    .notNull()
    .references(() => deliverySessions.id),
  orderId: integer('order_id')
    .notNull()
    .references(() => orders.id),
  sequence: integer('sequence').notNull(),
  distanceToNext: integer('distance_to_next'),
  durationToNext: integer('duration_to_next'),
});

// 会话订单关联表（保存会话和订单的关联关系）
export const sessionOrders = sqliteTable('session_orders', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  sessionId: integer('session_id')
    .notNull()
    .references(() => deliverySessions.id),
  orderId: integer('order_id')
    .notNull()
    .references(() => orders.id),
  cancelReason: text('cancel_reason'), // 该订单在此会话中的取消原因
  createdAt: text('created_at')
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

// 常用客户表（原常用地址表，现在包含客户信息）
export const frequentAddresses = sqliteTable('frequent_addresses', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  customerName: text('customer_name').notNull(), // 客户姓名
  address: text('address').notNull(),
  alias: text('alias'), // 客户别名（可选，如"老张"、"李总"）
  lat: real('lat'),
  lng: real('lng'),
  contactType: text('contact_type'), // 'phone' | 'wechat'
  contactValue: text('contact_value'), // 电话号码或微信号
  usageCount: integer('usage_count').default(1).notNull(),
  lastUsed: text('last_used')
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});
