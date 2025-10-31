import { defineApiHandler } from '../../../utils/handler';
import { db, schema } from '../../../database/db';
import { eq, inArray } from 'drizzle-orm';
import { createAppError } from '../../../utils/errors';

const { deliverySessions, deliveryRoutes, orders } = schema;

interface CompleteSessionRequest {
  completedAt?: string;
}

/**
 * 完成配送会话并更新所有订单状态
 * POST /api/delivery-sessions/:id/complete
 */
export default defineApiHandler(async (event) => {
  const id = parseInt(event.context.params?.id || '0');

  if (!id || isNaN(id)) {
    throw createAppError.validation('Invalid session ID');
  }

  const body = await readBody<CompleteSessionRequest>(event);

  try {
    const completedAtTime = body?.completedAt || new Date().toISOString();

    // 获取会话的所有订单
    const routes = await db
      .select()
      .from(deliveryRoutes)
      .where(eq(deliveryRoutes.sessionId, id));

    const orderIds = routes.map((r) => r.orderId);

    // 更新会话状态
    const [session] = await db
      .update(deliverySessions)
      .set({
        status: 'completed',
        completedAt: completedAtTime,
      })
      .where(eq(deliverySessions.id, id))
      .returning();

    if (!session) {
      throw createAppError.notFound('Session not found');
    }

    // 更新所有订单状态为 completed
    if (orderIds.length > 0) {
      await db
        .update(orders)
        .set({
          status: 'completed',
          completedAt: completedAtTime,
        })
        .where(inArray(orders.id, orderIds));
    }

    return {
      success: true,
      session,
      updatedOrders: orderIds.length,
    };
  } catch (error: unknown) {
    console.error('Failed to complete delivery session:', error);

    if (error && typeof error === 'object' && 'name' in error && error.name === 'AppError') {
      throw error;
    }

    throw createAppError.database('Failed to complete delivery session');
  }
});
