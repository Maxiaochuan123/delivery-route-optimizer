import { defineApiHandler, getValidatedParams } from '../../utils/handler';
import { validateId } from '../../utils/validation';
import { orderOperations } from '../../utils/db';
import { createAppError } from '../../utils/errors';

/**
 * 获取单个订单
 * GET /api/orders/:id
 */
export default defineApiHandler(async (event) => {
  const { id } = getValidatedParams(event, (params) => ({
    id: validateId(params.id),
  }));

  const order = await orderOperations.getById(id);

  if (!order) {
    throw createAppError.notFound('Order');
  }

  return order;
});
