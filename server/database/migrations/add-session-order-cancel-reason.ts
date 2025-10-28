import { db } from '../db';
import { sql } from 'drizzle-orm';

/**
 * 为 session_orders 表添加 cancel_reason 字段
 * 这样每个会话的订单可以有独立的取消原因
 */
export async function up() {
  console.log('Adding cancel_reason to session_orders table...');
  
  await db.run(sql`
    ALTER TABLE session_orders 
    ADD COLUMN cancel_reason TEXT
  `);

  console.log('✅ cancel_reason column added to session_orders');
}

export async function down() {
  console.log('Removing cancel_reason from session_orders table...');
  
  // SQLite 不支持 DROP COLUMN，需要重建表
  await db.run(sql`
    CREATE TABLE session_orders_new (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id INTEGER NOT NULL,
      order_id INTEGER NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (session_id) REFERENCES delivery_sessions(id),
      FOREIGN KEY (order_id) REFERENCES orders(id),
      UNIQUE(session_id, order_id)
    )
  `);
  
  await db.run(sql`
    INSERT INTO session_orders_new (id, session_id, order_id, created_at)
    SELECT id, session_id, order_id, created_at FROM session_orders
  `);
  
  await db.run(sql`DROP TABLE session_orders`);
  await db.run(sql`ALTER TABLE session_orders_new RENAME TO session_orders`);
  
  console.log('✅ cancel_reason column removed from session_orders');
}
