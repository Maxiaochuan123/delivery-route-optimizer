import { defineApiHandler, getValidatedBody } from '../../utils/handler';
import { validateCoordinates } from '../../utils/validation';
import { RouteOptimizer, type Location } from '../../utils/route-optimizer';
import { createAppError } from '../../utils/errors';

interface OptimizeRequest {
  startLocation: {
    lat: number;
    lng: number;
    address: string;
  };
  destinations: Array<{
    id: string;
    lat: number;
    lng: number;
    address: string;
  }>;
}

/**
 * 路线优化 API
 * POST /api/routes/optimize
 * Body: { startLocation, destinations }
 */
export default defineApiHandler(async (event) => {
  const body = await getValidatedBody<OptimizeRequest>(event, (data) => {
    // 验证起始位置
    if (!data.startLocation) {
      throw createAppError.validation('Start location is required');
    }

    if (!data.startLocation.lat || !data.startLocation.lng) {
      throw createAppError.validation('Start location must have lat and lng');
    }

    validateCoordinates(data.startLocation.lat, data.startLocation.lng);

    // 验证目的地
    if (!data.destinations || !Array.isArray(data.destinations)) {
      throw createAppError.validation('Destinations must be an array');
    }

    if (data.destinations.length === 0) {
      throw createAppError.validation('At least one destination is required');
    }

    if (data.destinations.length > 20) {
      throw createAppError.validation('Maximum 20 destinations allowed');
    }

    // 验证每个目的地
    data.destinations.forEach((dest: any, index: number) => {
      if (!dest.id) {
        throw createAppError.validation(`Destination ${index} must have an id`);
      }
      if (!dest.lat || !dest.lng) {
        throw createAppError.validation(`Destination ${index} must have lat and lng`);
      }
      validateCoordinates(dest.lat, dest.lng);
    });

    return data;
  });

  // 构建起始位置
  const start: Location = {
    id: 'start',
    lat: body.startLocation.lat,
    lng: body.startLocation.lng,
    address: body.startLocation.address || 'Start Location',
  };

  // 构建目的地列表
  const destinations: Location[] = body.destinations.map((dest) => ({
    id: dest.id,
    lat: dest.lat,
    lng: dest.lng,
    address: dest.address || `Destination ${dest.id}`,
  }));

  try {
    // 执行路线优化
    const optimizer = new RouteOptimizer();
    const result = await optimizer.optimize(start, destinations);

    // 格式化返回结果
    return {
      optimizedRoute: result.sequence.map((loc, index) => ({
        id: loc.id,
        sequence: index,
        lat: loc.lat,
        lng: loc.lng,
        address: loc.address,
        distanceToNext: result.distances[index] || 0,
        durationToNext: result.durations[index] || 0,
      })),
      totalDistance: result.totalDistance,
      totalDuration: result.totalDuration,
      summary: {
        totalDistanceKm: (result.totalDistance / 1000).toFixed(2),
        totalDurationMin: Math.round(result.totalDuration / 60),
        stopCount: destinations.length,
      },
    };
  } catch (error: any) {
    console.error('Route optimization error:', error);
    
    if (error.name === 'AppError') {
      throw error;
    }
    
    throw createAppError.routeCalculation('Failed to optimize route');
  }
});
