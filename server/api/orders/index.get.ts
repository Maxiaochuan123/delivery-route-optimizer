import { defineApiHandler } from '../../utils/handler';
import { orderOperations } from '../../utils/db';
import { db, schema } from '../../database/db';
import { eq, inArray, and } from 'drizzle-orm';

/**
 * 获取所有待开始的订单（排除进行中和已完成的订单）
 * GET /api/orders
 */
export default defineApiHandler(async () => {
  const allOrders = await orderOperations.getAll();

  // 过滤掉已完成的订单
  const orders = allOrders.filter((order) => order.status !== 'completed');

  // 获取进行中的会话
  const activeSessions = await db
    .select()
    .from(schema.deliverySessions)
    .where(eq(schema.deliverySessions.status, 'in_progress'));

  if (activeSessions.length === 0) {
    // 没有进行中的会话，返回所有未完成的订单
    return orders;
  }

  // 获取进行中会话的订单 ID
  const activeSessionIds = activeSessions.map((s) => s.id);
  const activeRoutes = await db
    .select()
    .from(schema.deliveryRoutes)
    .where(inArray(schema.deliveryRoutes.sessionId, activeSessionIds));

  const inProgressOrderIds = new Set(activeRoutes.map((r) => r.orderId));

  // 过滤掉进行中的订单，只返回待开始的订单
  const pendingOrders = orders.filter((order) => !inProgressOrderIds.has(order.id));

  return pendingOrders;
});
