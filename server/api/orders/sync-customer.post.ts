/**
 * 同步更新订单中的客户信息
 */
import { db, schema } from '~/server/database/db';
import { eq, and } from 'drizzle-orm';

const { orders } = schema;

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const {
      oldCustomerName,
      oldAddress,
      newCustomerName,
      newAddress,
      newLat,
      newLng,
      newContactType,
      newContactValue,
    } = body;

    // 查找所有匹配旧客户信息的待处理订单
    const matchingOrders = await db
      .select()
      .from(orders)
      .where(
        and(
          eq(orders.customerName, oldCustomerName),
          eq(orders.address, oldAddress),
          eq(orders.status, 'pending')
        )
      );

    // 更新所有匹配的订单
    for (const order of matchingOrders) {
      await db
        .update(orders)
        .set({
          customerName: newCustomerName,
          address: newAddress,
          lat: newLat,
          lng: newLng,
          contactType: newContactType,
          contactValue: newContactValue,
        })
        .where(eq(orders.id, order.id));
    }

    return {
      success: true,
      data: {
        updatedCount: matchingOrders.length,
      },
    };
  } catch (error) {
    console.error('Failed to sync customer info to orders:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to sync customer info',
    });
  }
});
