import { defineApiHandler, getValidatedParams } from '../../utils/handler';
import { validateId } from '../../utils/validation';
import { orderOperations } from '../../utils/db';
import { createAppError } from '../../utils/errors';
import { db, schema } from '../../database/db';
import { eq } from 'drizzle-orm';

const { deliveryRoutes } = schema;

/**
 * 删除订单
 * DELETE /api/orders/:id
 */
export default defineApiHandler(async (event) => {
  const { id } = getValidatedParams(event, (params) => ({
    id: validateId(params.id),
  }));

  // 检查订单是否存在
  const existingOrder = await orderOperations.getById(id);
  if (!existingOrder) {
    throw createAppError.notFound('Order');
  }

  try {
    // 先删除相关的配送路线记录
    await db.delete(deliveryRoutes).where(eq(deliveryRoutes.orderId, id));

    // 然后删除订单
    await orderOperations.delete(id);

    return {
      message: 'Order deleted successfully',
      id,
    };
  } catch (error: any) {
    console.error('Delete order error:', error);
    throw createAppError.database('Failed to delete order');
  }
});
