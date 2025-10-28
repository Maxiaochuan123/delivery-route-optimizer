import { defineApiHandler, getValidatedBody } from '../../../utils/handler';
import { db, schema } from '../../../database/db';
import { eq, and } from 'drizzle-orm';
import { createAppError } from '../../../utils/errors';

const { deliverySessions, orders, deliveryRoutes, sessionOrders } = schema;

interface CancelOrderRequest {
  orderId: number;
  cancelReason?: string | null;
  isLastOrder?: boolean;
}

/**
 * 从配送会话中取消单个订单
 * POST /api/delivery-sessions/:id/cancel-order
 */
export default defineApiHandler(async (event) => {
  const sessionId = parseInt(event.context.params?.id || '0');

  if (!sessionId || isNaN(sessionId)) {
    throw createAppError.validation('Invalid session ID');
  }

  const body = await getValidatedBody<CancelOrderRequest>(event, (data) => {
    if (!data.orderId || typeof data.orderId !== 'number') {
      throw createAppError.validation('Order ID is required');
    }
    return data;
  });

  try {
    // 查找配送会话
    const [session] = await db
      .select()
      .from(deliverySessions)
      .where(eq(deliverySessions.id, sessionId));

    if (!session) {
      throw createAppError.notFound('Session not found');
    }

    // 检查会话状态
    if (session.status === 'completed') {
      throw createAppError.validation('Cannot cancel order from a completed session');
    }

    // 将订单恢复为 pending 状态（不保存取消原因到订单表）
    await db
      .update(orders)
      .set({ 
        status: 'pending',
        completedAt: null
      })
      .where(eq(orders.id, body.orderId));

    // 保存取消原因到 session_orders 表（会话级别的取消原因）
    if (body.cancelReason) {
      await db
        .update(sessionOrders)
        .set({ cancelReason: body.cancelReason })
        .where(
          and(
            eq(sessionOrders.sessionId, sessionId),
            eq(sessionOrders.orderId, body.orderId)
          )
        );
    }

    // 从配送路线中删除该订单
    await db
      .delete(deliveryRoutes)
      .where(
        and(
          eq(deliveryRoutes.sessionId, sessionId),
          eq(deliveryRoutes.orderId, body.orderId)
        )
      );

    // 获取剩余的路线数量
    const remainingRoutes = await db
      .select()
      .from(deliveryRoutes)
      .where(eq(deliveryRoutes.sessionId, sessionId));

    // 如果这是最后一个订单，更新会话状态为 'cancelled'
    if (body.isLastOrder) {
      await db
        .update(deliverySessions)
        .set({ 
          status: 'cancelled',
          cancelReason: body.cancelReason || null,
          completedAt: new Date().toISOString()
          // 保留 orderCount、totalDistance、totalDuration 用于历史记录
        })
        .where(eq(deliverySessions.id, sessionId));
    }
    // 注意：不在这里更新统计信息，因为前端会重新优化路线后再更新

    return {
      success: true,
      message: 'Order cancelled successfully',
      data: {
        remainingOrders: remainingRoutes.length,
        sessionCancelled: body.isLastOrder || false
      }
    };
  } catch (error) {
    console.error('Failed to cancel order from session:', error);
    
    if (error && typeof error === 'object' && 'name' in error && error.name === 'AppError') {
      throw error;
    }
    
    throw createAppError.database('Failed to cancel order from session');
  }
});
