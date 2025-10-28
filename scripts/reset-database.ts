/**
 * 重置数据库脚本
 * 清空所有表的数据
 */

import { db, schema } from '../server/database/db';
import { sql } from 'drizzle-orm';

const { orders, deliverySessions, deliveryRoutes, frequentAddresses, sessionOrders } = schema;

async function resetDatabase() {
  try {
    console.log('🗑️  开始清空数据库...');

    // 删除所有表的数据（按照外键依赖顺序）
    await db.delete(deliveryRoutes);
    console.log('✅ 清空 delivery_routes 表');

    await db.delete(sessionOrders);
    console.log('✅ 清空 session_orders 表');

    await db.delete(deliverySessions);
    console.log('✅ 清空 delivery_sessions 表');

    await db.delete(orders);
    console.log('✅ 清空 orders 表');

    await db.delete(frequentAddresses);
    console.log('✅ 清空 frequent_addresses 表');

    // 重置自增 ID
    await db.run(sql`DELETE FROM sqlite_sequence WHERE name='orders'`);
    await db.run(sql`DELETE FROM sqlite_sequence WHERE name='delivery_sessions'`);
    await db.run(sql`DELETE FROM sqlite_sequence WHERE name='delivery_routes'`);
    await db.run(sql`DELETE FROM sqlite_sequence WHERE name='session_orders'`);
    await db.run(sql`DELETE FROM sqlite_sequence WHERE name='frequent_addresses'`);
    console.log('✅ 重置自增 ID');

    console.log('🎉 数据库清空完成！');
    console.log('');
    console.log('📝 请手动清除浏览器缓存：');
    console.log('   1. 打开浏览器开发者工具 (F12)');
    console.log('   2. 进入 Application/应用 标签');
    console.log('   3. 清除 Local Storage 中的 delivery_session_data');
    console.log('   4. 刷新页面');
  } catch (error) {
    console.error('❌ 清空数据库失败:', error);
    throw error;
  }
}

resetDatabase();
