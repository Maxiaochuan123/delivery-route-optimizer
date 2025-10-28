import { defineApiHandler } from '../../utils/handler';
import { db, schema } from '../../database/db';
import { eq } from 'drizzle-orm';
import { createAppError } from '../../utils/errors';

const { deliverySessions, deliveryRoutes, orders, sessionOrders } = schema;

/**
 * 获取配送会话详情
 * GET /api/delivery-sessions/:id
 */
export default defineApiHandler(async (event) => {
  const id = parseInt(event.context.params?.id || '0');

  if (!id || isNaN(id)) {
    throw createAppError.validation('Invalid session ID');
  }

  try {
    // 获取会话信息
    const [session] = await db
      .select()
      .from(deliverySessions)
      .where(eq(deliverySessions.id, id));

    if (!session) {
      throw createAppError.notFound('Session not found');
    }

    // 获取路线信息
    const routes = await db
      .select({
        id: deliveryRoutes.id,
        orderId: deliveryRoutes.orderId,
        sequence: deliveryRoutes.sequence,
        distanceToNext: deliveryRoutes.distanceToNext,
        durationToNext: deliveryRoutes.durationToNext,
        order: {
          id: orders.id,
          address: orders.address,
          customerName: orders.customerName,
          items: orders.items,
          notes: orders.notes,
          status: orders.status,
          cancelReason: orders.cancelReason,
        },
      })
      .from(deliveryRoutes)
      .leftJoin(orders, eq(deliveryRoutes.orderId, orders.id))
      .where(eq(deliveryRoutes.sessionId, id))
      .orderBy(deliveryRoutes.sequence);

    // 如果路线为空（订单已全部取消），从 session_orders 查询原始订单
    if (routes.length === 0) {
      const originalOrders = await db
        .select({
          id: sessionOrders.id,
          orderId: sessionOrders.orderId,
          sequence: sessionOrders.id, // 使用 id 作为顺序
          distanceToNext: deliveryRoutes.distanceToNext, // 使用 null 的列
          durationToNext: deliveryRoutes.durationToNext, // 使用 null 的列
          order: {
            id: orders.id,
            address: orders.address,
            customerName: orders.customerName,
            items: orders.items,
            notes: orders.notes,
            status: orders.status,
            cancelReason: sessionOrders.cancelReason, // 从 session_orders 读取取消原因
          },
        })
        .from(sessionOrders)
        .leftJoin(orders, eq(sessionOrders.orderId, orders.id))
        .leftJoin(deliveryRoutes, eq(deliveryRoutes.id, -1)) // 假连接以获取 null 列
        .where(eq(sessionOrders.sessionId, id))
        .orderBy(sessionOrders.id);

      return {
        session,
        routes: originalOrders,
      };
    }

    return {
      session,
      routes,
    };
  } catch (error) {
    console.error('Failed to get delivery session:', error);
    
    if (error && typeof error === 'object' && 'name' in error && error.name === 'AppError') {
      throw error;
    }
    
    throw createAppError.database('Failed to get delivery session');
  }
});
