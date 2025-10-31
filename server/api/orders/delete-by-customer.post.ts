/**
 * 根据客户信息删除相关的待处理订单
 */
import { db, schema } from '~/server/database/db';
import { eq, and } from 'drizzle-orm';

const { orders } = schema;

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const { customerName, address } = body;

    // 查找所有匹配的待处理订单
    const matchingOrders = await db
      .select()
      .from(orders)
      .where(
        and(
          eq(orders.customerName, customerName),
          eq(orders.address, address),
          eq(orders.status, 'pending')
        )
      );

    // 删除所有匹配的订单
    for (const order of matchingOrders) {
      await db.delete(orders).where(eq(orders.id, order.id));
    }

    return {
      success: true,
      data: {
        deletedCount: matchingOrders.length,
      },
    };
  } catch (error) {
    console.error('Failed to delete orders by customer:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to delete orders',
    });
  }
});
