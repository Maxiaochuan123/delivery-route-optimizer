import { defineApiHandler, getValidatedBody } from '../../utils/handler';
import { db, schema } from '../../database/db';
import { eq } from 'drizzle-orm';
import { createAppError } from '../../utils/errors';

const { orders } = schema;

interface UpdateOrderRequest {
  status?: 'pending' | 'completed';
}

/**
 * 更新订单状态
 * PATCH /api/orders/:id
 */
export default defineApiHandler(async (event) => {
  const id = parseInt(event.context.params?.id || '0');

  if (!id || isNaN(id)) {
    throw createAppError.validation('Invalid order ID');
  }

  const body = await getValidatedBody<UpdateOrderRequest>(event, (data) => data);

  try {
    const updateData: any = {};

    if (body.status !== undefined) {
      updateData.status = body.status;
      
      // 如果状态变为 pending，清除 completedAt
      if (body.status === 'pending') {
        updateData.completedAt = null;
      }
    }

    const [order] = await db
      .update(orders)
      .set(updateData)
      .where(eq(orders.id, id))
      .returning();

    if (!order) {
      throw createAppError.notFound('Order not found');
    }

    return {
      success: true,
      data: order,
    };
  } catch (error: any) {
    console.error('Failed to update order:', error);
    
    if (error.name === 'AppError') {
      throw error;
    }
    
    throw createAppError.database('Failed to update order');
  }
});
