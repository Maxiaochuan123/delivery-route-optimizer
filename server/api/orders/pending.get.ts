import { defineApiHandler } from '../../utils/handler';
import { db, schema } from '../../database/db';
import { eq } from 'drizzle-orm';

/**
 * 获取所有待处理订单
 * GET /api/orders/pending
 */
export default defineApiHandler(async () => {
  const orders = await db
    .select()
    .from(schema.orders)
    .where(eq(schema.orders.status, 'pending'));

  return orders;
});
