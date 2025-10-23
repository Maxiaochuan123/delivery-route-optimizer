import { defineApiHandler, getValidatedBody } from '../../utils/handler';
import { db, schema } from '../../database/db';
import { eq, sql } from 'drizzle-orm';
import { createAppError } from '../../utils/errors';

const { deliverySessions } = schema;

interface UpdateSessionRequest {
  completedAt?: string;
  totalDistance?: number;
  totalDuration?: number;
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

    if (body.completedAt !== undefined) {
      updateData.completedAt = body.completedAt || sql`CURRENT_TIMESTAMP`;
    }

    if (body.totalDistance !== undefined) {
      updateData.totalDistance = body.totalDistance;
    }

    if (body.totalDuration !== undefined) {
      updateData.totalDuration = body.totalDuration;
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
