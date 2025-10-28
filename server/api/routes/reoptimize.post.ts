import { defineApiHandler, getValidatedBody } from '../../utils/handler';
import { validateCoordinates } from '../../utils/validation';
import { RouteOptimizer, type Location } from '../../utils/route-optimizer';
import { orderOperations } from '../../utils/db';
import { createAppError } from '../../utils/errors';

interface ReoptimizeRequest {
  startLocation: {
    lat: number;
    lng: number;
    address: string;
  };
  orderIds: number[];
}

/**
 * 重新优化当前配送会话的路线
 * POST /api/routes/reoptimize
 * Body: { startLocation, orderIds }
 *
 * 注意：此 API 不检查活动会话状态，专门用于在配送过程中重新优化路线
 */
export default defineApiHandler(async (event) => {
  const body = await getValidatedBody<ReoptimizeRequest>(event, (data) => {
    // 验证起始位置
    if (!data.startLocation) {
      throw createAppError.validation('Start location is required');
    }

    validateCoordinates(data.startLocation.lat, data.startLocation.lng);

    // 验证订单 ID
    if (!data.orderIds || !Array.isArray(data.orderIds)) {
      throw createAppError.validation('Order IDs must be an array');
    }

    if (data.orderIds.length === 0) {
      throw createAppError.validation('At least one order ID is required');
    }

    if (data.orderIds.length > 20) {
      throw createAppError.validation('Maximum 20 orders allowed');
    }

    return data;
  });

  // 获取所有订单
  const orders = await Promise.all(body.orderIds.map((id) => orderOperations.getById(id)));

  // 检查是否所有订单都存在
  const missingOrders = orders
    .map((order, index) => (order ? null : body.orderIds[index]))
    .filter((id) => id !== null);

  if (missingOrders.length > 0) {
    throw createAppError.notFound(`Orders not found: ${missingOrders.join(', ')}`);
  }

  // 检查订单是否有坐标
  const ordersWithoutCoords = orders.filter((order) => !order?.lat || !order?.lng);

  if (ordersWithoutCoords.length > 0) {
    throw createAppError.validation(
      'Some orders do not have coordinates. Please geocode addresses first.'
    );
  }

  // 构建起始位置
  const start: Location = {
    id: 'start',
    lat: body.startLocation.lat,
    lng: body.startLocation.lng,
    address: body.startLocation.address || 'Start Location',
  };

  // 构建目的地列表
  const destinations: Location[] = orders.map((order) => ({
    id: String(order!.id),
    lat: order!.lat!,
    lng: order!.lng!,
    address: order!.address,
  }));

  try {
    // 执行路线优化
    const optimizer = new RouteOptimizer();
    const result = await optimizer.optimize(start, destinations);

    console.log('Reoptimize result:', {
      sequenceLength: result.sequence.length,
      totalDistance: result.totalDistance,
      totalDuration: result.totalDuration,
    });

    // 格式化返回结果（不需要包装 success 和 data，handler 会自动处理）
    return {
      optimizedRoute: result.sequence.map((loc, index) => {
        const order = orders.find((o) => String(o?.id) === loc.id);
        return {
          orderId: loc.id === 'start' ? null : Number(loc.id),
          sequence: index,
          lat: loc.lat,
          lng: loc.lng,
          address: loc.address,
          customerName: order?.customerName,
          items: order?.items,
          notes: order?.notes,
          distanceToNext: result.distances[index] || 0,
          durationToNext: result.durations[index] || 0,
        };
      }),
      totalDistance: result.totalDistance,
      totalDuration: result.totalDuration,
      summary: {
        totalDistanceKm: (result.totalDistance / 1000).toFixed(2),
        totalDurationMin: Math.round(result.totalDuration / 60),
        totalDurationHours: (result.totalDuration / 3600).toFixed(1),
        stopCount: destinations.length + 1, // 包括起点
        orderCount: orders.length,
      },
    };
  } catch (error: unknown) {
    console.error('Route reoptimization error:', error);

    if (error && typeof error === 'object' && 'name' in error && error.name === 'AppError') {
      throw error;
    }

    throw createAppError.routeCalculation('Failed to reoptimize route');
  }
});
