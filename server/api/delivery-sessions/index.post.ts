import { defineApiHandler, getValidatedBody } from '../../utils/handler';
import { db, schema } from '../../database/db';
import { createAppError } from '../../utils/errors';

const { deliverySessions, deliveryRoutes, sessionOrders } = schema;

interface CreateSessionRequest {
  startLocation: string;
  startLat: number;
  startLng: number;
  orderIds: number[];
  routeData: Array<{
    orderId: number;
    sequence: number;
    distanceToNext: number;
    durationToNext: number;
  }>;
  totalDistance: number;
  totalDuration: number;
}

/**
 * 创建配送会话
 * POST /api/delivery-sessions
 */
export default defineApiHandler(async (event) => {
  const body = await getValidatedBody<CreateSessionRequest>(event, (data) => {
    if (!data.startLocation || !data.startLat || !data.startLng) {
      throw createAppError.validation('Start location is required');
    }

    if (!data.orderIds || !Array.isArray(data.orderIds) || data.orderIds.length === 0) {
      throw createAppError.validation('At least one order is required');
    }

    if (!data.routeData || !Array.isArray(data.routeData)) {
      throw createAppError.validation('Route data is required');
    }

    return data;
  });

  try {
    // 创建配送会话
    const [session] = await db
      .insert(deliverySessions)
      .values({
        startLocation: body.startLocation,
        startLat: body.startLat,
        startLng: body.startLng,
        totalDistance: body.totalDistance,
        totalDuration: body.totalDuration,
        orderCount: body.orderIds.length,
      })
      .returning();

    // 创建配送路线记录
    if (body.routeData.length > 0) {
      await db.insert(deliveryRoutes).values(
        body.routeData.map((route) => ({
          sessionId: session.id,
          orderId: route.orderId,
          sequence: route.sequence,
          distanceToNext: route.distanceToNext,
          durationToNext: route.durationToNext,
        }))
      );
    }

    // 保存会话和订单的关联关系（用于历史查询）
    if (body.orderIds.length > 0) {
      await db.insert(sessionOrders).values(
        body.orderIds.map((orderId) => ({
          sessionId: session.id,
          orderId: orderId,
        }))
      );
    }

    return {
      success: true,
      sessionId: session.id,
      session,
    };
  } catch (error: any) {
    console.error('Failed to create delivery session:', error);
    throw createAppError.database('Failed to create delivery session');
  }
});
