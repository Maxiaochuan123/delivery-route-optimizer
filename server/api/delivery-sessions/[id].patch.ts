import { defineApiHandler, getValidatedBody } from '../../utils/handler';
import { db, schema } from '../../database/db';
import { eq, sql } from 'drizzle-orm';
import { createAppError } from '../../utils/errors';

const { deliverySessions } = schema;

interface UpdateSessionRequest {
  status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  completedAt?: string;
  totalDistance?: number;
  totalDuration?: number;
  orderCount?: number;
}

/**
 * 更新配送会话（标记完成）
 * PATCH /api/delivery-sessions/:id
 */
export default defineApiHandler(async (event) => {
  const id = parseInt(event.context.params?.id || '0');

  if (!id || isNaN(id)) {
    throw createAppError.validation('Invalid session ID');
  }

  const body = await getValidatedBody<UpdateSessionRequest>(event, (data) => data);

  try {
    const updateData: any = {};

    if (body.status !== undefined) {
      updateData.status = body.status;
      // 如果状态变为 completed 或 cancelled，自动设置 completedAt
      if ((body.status === 'completed' || body.status === 'cancelled') && !body.completedAt) {
        updateData.completedAt = new Date().toISOString();
      }
    }

    if (body.completedAt !== undefined) {
      updateData.completedAt = body.completedAt || new Date().toISOString();
      // 如果设置了 completedAt，自动将状态设为 completed
      if (!body.status) {
        updateData.status = 'completed';
      }
    }

    if (body.totalDistance !== undefined) {
      updateData.totalDistance = body.totalDistance;
    }

    if (body.totalDuration !== undefined) {
      updateData.totalDuration = body.totalDuration;
    }

    if (body.orderCount !== undefined) {
      updateData.orderCount = body.orderCount;
    }

    const [session] = await db
      .update(deliverySessions)
      .set(updateData)
      .where(eq(deliverySessions.id, id))
      .returning();

    if (!session) {
      throw createAppError.notFound('Session not found');
    }

    return {
      success: true,
      session,
    };
  } catch (error: any) {
    console.error('Failed to update delivery session:', error);
    
    if (error.name === 'AppError') {
      throw error;
    }
    
    throw createAppError.database('Failed to update delivery session');
  }
});
