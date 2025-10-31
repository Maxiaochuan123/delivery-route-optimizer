/**
 * 统计客户的待处理订单数量
 */
import { db, schema } from '~/server/database/db';
import { eq, and, count } from 'drizzle-orm';

const { orders } = schema;

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const { customerName, address } = body;

    // 统计匹配的待处理订单数量
    const result = await db
      .select({ count: count() })
      .from(orders)
      .where(
        and(
          eq(orders.customerName, customerName),
          eq(orders.address, address),
          eq(orders.status, 'pending')
        )
      );

    return {
      success: true,
      data: {
        count: result[0]?.count || 0,
      },
    };
  } catch (error) {
    console.error('Failed to count orders by customer:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to count orders',
    });
  }
});
