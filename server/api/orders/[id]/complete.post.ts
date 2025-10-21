import { defineApiHandler, getValidatedParams } from '../../../utils/handler';
import { validateId } from '../../../utils/validation';
import { orderOperations } from '../../../utils/db';
import { createAppError } from '../../../utils/errors';

/**
 * 标记订单为已完成
 * POST /api/orders/:id/complete
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

  // 检查订单是否已完成
  if (existingOrder.status === 'completed') {
    return existingOrder;
  }

  try {
    const updatedOrder = await orderOperations.update(id, {
      status: 'completed',
      completedAt: new Date().toISOString(),
    });

    return updatedOrder;
  } catch (error) {
    throw createAppError.database('Failed to complete order');
  }
});
