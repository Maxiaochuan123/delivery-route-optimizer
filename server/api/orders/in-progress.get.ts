import { defineApiHandler } from '../../utils/handler';
import { db, schema } from '../../database/db';
import { eq, inArray } from 'drizzle-orm';

/**
 * 获取进行中的订单
 * GET /api/orders/in-progress
 */
export default defineApiHandler(async () => {
  // 获取进行中的会话
  const activeSessions = await db
    .select()
    .from(schema.deliverySessions)
    .where(eq(schema.deliverySessions.status, 'in_progress'));

  if (activeSessions.length === 0) {
    return [];
  }

  // 获取进行中会话的订单 ID
  const activeSessionIds = activeSessions.map((s) => s.id);
  const activeRoutes = await db
    .select()
    .from(schema.deliveryRoutes)
    .where(inArray(schema.deliveryRoutes.sessionId, activeSessionIds));

  const inProgressOrderIds = activeRoutes.map((r) => r.orderId);

  if (inProgressOrderIds.length === 0) {
    return [];
  }

  // 获取订单详情
  const orders = await db
    .select()
    .from(schema.orders)
    .where(inArray(schema.orders.id, inProgressOrderIds));

  return orders;
});
