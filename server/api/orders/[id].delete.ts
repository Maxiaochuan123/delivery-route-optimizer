import { defineApiHandler, getValidatedParams } from '../../utils/handler';
import { validateId } from '../../utils/validation';
import { orderOperations } from '../../utils/db';
import { createAppError } from '../../utils/errors';

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
    await orderOperations.delete(id);
    return { message: 'Order deleted successfully', id };
  } catch (error) {
    throw createAppError.database('Failed to delete order');
  }
});
