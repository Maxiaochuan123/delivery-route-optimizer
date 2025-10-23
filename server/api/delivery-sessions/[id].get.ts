import { defineApiHandler } from '../../utils/handler';
import { db, schema } from '../../database/db';
import { eq } from 'drizzle-orm';
import { createAppError } from '../../utils/errors';

const { deliverySessions, deliveryRoutes, orders } = schema;

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
        },
      })
      .from(deliveryRoutes)
      .leftJoin(orders, eq(deliveryRoutes.orderId, orders.id))
      .where(eq(deliveryRoutes.sessionId, id))
      .orderBy(deliveryRoutes.sequence);

    return {
      session,
      routes,
    };
  } catch (error: any) {
    console.error('Failed to get delivery session:', error);
    
    if (error.name === 'AppError') {
      throw error;
    }
    
    throw createAppError.database('Failed to get delivery session');
  }
});
