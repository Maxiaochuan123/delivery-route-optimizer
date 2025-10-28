import { defineApiHandler } from '../../../utils/handler';
import { db, schema } from '../../../database/db';
import { eq, inArray } from 'drizzle-orm';
import { createAppError } from '../../../utils/errors';

const { deliverySessions, orders, deliveryRoutes } = schema;

interface AbandonSessionRequest {
  cancelReason?: string | null;
}

/**
 * 放弃配送会话
 * POST /api/delivery-sessions/:id/abandon
 */
export default defineApiHandler(async (event) => {
  const id = parseInt(event.context.params?.id || '0');

  if (!id || isNaN(id)) {
    throw createAppError.validation('Invalid session ID');
  }

  // 读取请求体
  const body = await readBody<AbandonSessionRequest>(event);
  const { cancelReason } = body || {};

  try {
    // 查找配送会话
    const [session] = await db
      .select()
      .from(deliverySessions)
      .where(eq(deliverySessions.id, id));

    if (!session) {
      throw createAppError.notFound('Session not found');
    }

    // 检查会话状态
    if (session.status === 'completed') {
      throw createAppError.validation('Cannot abandon a completed session');
    }

    if (session.status === 'cancelled') {
      throw createAppError.validation('Session is already cancelled');
    }

    // 获取该会话关联的所有订单 ID
    const routes = await db
      .select()
      .from(deliveryRoutes)
      .where(eq(deliveryRoutes.sessionId, id));

    const orderIds = routes.map(route => route.orderId);

    // 将会话关联的所有订单恢复为 pending 状态
    if (orderIds.length > 0) {
      await db
        .update(orders)
        .set({ 
          status: 'pending',
          completedAt: null
        })
        .where(inArray(orders.id, orderIds));
    }

    // 删除配送路线记录
    await db
      .delete(deliveryRoutes)
      .where(eq(deliveryRoutes.sessionId, id));

    // 更新配送会话状态为 'cancelled' 并保存取消原因
    await db
      .update(deliverySessions)
      .set({
        status: 'cancelled',
        cancelReason: cancelReason || null,
        completedAt: new Date().toISOString()
      })
      .where(eq(deliverySessions.id, id));

    return {
      success: true,
      message: 'Delivery session abandoned successfully',
      data: {
        restoredOrders: orderIds.length,
        sessionId: id,
        cancelReason: cancelReason || null
      }
    };
  } catch (error: unknown) {
    console.error('Failed to abandon delivery session:', error);
    
    if (error && typeof error === 'object' && 'name' in error && error.name === 'AppError') {
      throw error;
    }
    
    throw createAppError.database('Failed to abandon delivery session');
  }
});
