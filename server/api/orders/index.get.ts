import { defineApiHandler } from '../../utils/handler';
import { orderOperations } from '../../utils/db';

/**
 * 获取所有订单
 * GET /api/orders
 */
export default defineApiHandler(async () => {
  const orders = await orderOperations.getAll();
  return orders;
});
