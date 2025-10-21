import { calculateDistanceMatrix } from './amap';
import { createAppError } from './errors';

export interface Location {
  id: string;
  lat: number;
  lng: number;
  address: string;
}

export interface OptimizedRoute {
  sequence: Location[];
  totalDistance: number;
  totalDuration: number;
  distances: number[]; // 每段距离
  durations: number[]; // 每段时间
}

/**
 * 路径优化器类
 */
export class RouteOptimizer {
  private distanceMatrix: number[][] = [];
  private durationMatrix: number[][] = [];

  /**
   * 优化路线
   */
  async optimize(start: Location, destinations: Location[]): Promise<OptimizedRoute> {
    if (destinations.length === 0) {
      throw createAppError.validation('At least one destination is required');
    }

    // 所有位置（起点 + 目的地）
    const allLocations = [start, ...destinations];

    // 计算距离矩阵
    await this.buildDistanceMatrix(allLocations);

    // 根据订单数量选择算法
    let route: number[];
    if (destinations.length <= 8) {
      // 小规模：使用最近邻 + 2-opt
      route = this.nearestNeighborWithTwoOpt();
    } else {
      // 大规模：仅使用最近邻
      route = this.nearestNeighbor();
    }

    // 构建结果
    return this.buildResult(allLocations, route);
  }

  /**
   * 构建距离矩阵
   */
  private async buildDistanceMatrix(locations: Location[]): Promise<void> {
    const n = locations.length;
    this.distanceMatrix = Array(n)
      .fill(0)
      .map(() => Array(n).fill(0));
    this.durationMatrix = Array(n)
      .fill(0)
      .map(() => Array(n).fill(0));

    // 批量计算距离（高德 API 限制每次最多 10 个）
    const batchSize = 10;

    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j += batchSize) {
        const batch = locations.slice(j, Math.min(j + batchSize, n));

        try {
          const results = await calculateDistanceMatrix([locations[i]], batch);

          results.forEach((result: { distance: number; duration: number }, idx: number) => {
            const actualJ = j + idx;
            this.distanceMatrix[i][actualJ] = result.distance;
            this.distanceMatrix[actualJ][i] = result.distance;
            this.durationMatrix[i][actualJ] = result.duration;
            this.durationMatrix[actualJ][i] = result.duration;
          });
        } catch (error) {
          // 如果 API 调用失败，使用直线距离估算
          console.warn('Distance API failed, using straight-line distance');
          batch.forEach((dest, idx) => {
            const actualJ = j + idx;
            const dist = this.haversineDistance(locations[i], dest);
            this.distanceMatrix[i][actualJ] = dist;
            this.distanceMatrix[actualJ][i] = dist;
            // 估算时间：假设平均速度 30km/h
            const duration = Math.round((dist / 1000 / 30) * 3600);
            this.durationMatrix[i][actualJ] = duration;
            this.durationMatrix[actualJ][i] = duration;
          });
        }
      }
    }
  }

  /**
   * 最近邻算法
   */
  private nearestNeighbor(): number[] {
    const n = this.distanceMatrix.length;
    const visited = new Array(n).fill(false);
    const route = [0]; // 从起点开始
    visited[0] = true;

    for (let i = 1; i < n; i++) {
      let nearest = -1;
      let minDistance = Infinity;

      for (let j = 0; j < n; j++) {
        if (!visited[j] && this.distanceMatrix[route[i - 1]][j] < minDistance) {
          minDistance = this.distanceMatrix[route[i - 1]][j];
          nearest = j;
        }
      }

      if (nearest !== -1) {
        route.push(nearest);
        visited[nearest] = true;
      }
    }

    return route;
  }

  /**
   * 最近邻 + 2-opt 优化
   */
  private nearestNeighborWithTwoOpt(): number[] {
    let route = this.nearestNeighbor();
    route = this.twoOptImprove(route);
    return route;
  }

  /**
   * 2-opt 局部优化算法
   */
  private twoOptImprove(route: number[]): number[] {
    let improved = true;
    let bestRoute = [...route];
    let iterations = 0;
    const maxIterations = 100; // 防止无限循环

    while (improved && iterations < maxIterations) {
      improved = false;
      iterations++;

      for (let i = 1; i < route.length - 2; i++) {
        for (let j = i + 1; j < route.length; j++) {
          const newRoute = this.twoOptSwap(bestRoute, i, j);
          const currentDistance = this.calculateRouteDistance(bestRoute);
          const newDistance = this.calculateRouteDistance(newRoute);

          if (newDistance < currentDistance) {
            bestRoute = newRoute;
            improved = true;
          }
        }
      }
    }

    return bestRoute;
  }

  /**
   * 2-opt 交换
   */
  private twoOptSwap(route: number[], i: number, j: number): number[] {
    const newRoute = [...route.slice(0, i), ...route.slice(i, j + 1).reverse(), ...route.slice(j + 1)];
    return newRoute;
  }

  /**
   * 计算路线总距离
   */
  private calculateRouteDistance(route: number[]): number {
    let totalDistance = 0;
    for (let i = 0; i < route.length - 1; i++) {
      totalDistance += this.distanceMatrix[route[i]][route[i + 1]];
    }
    return totalDistance;
  }

  /**
   * 计算路线总时间
   */
  private calculateRouteDuration(route: number[]): number {
    let totalDuration = 0;
    for (let i = 0; i < route.length - 1; i++) {
      totalDuration += this.durationMatrix[route[i]][route[i + 1]];
    }
    return totalDuration;
  }

  /**
   * 构建优化结果
   */
  private buildResult(locations: Location[], route: number[]): OptimizedRoute {
    const sequence = route.map((idx) => locations[idx]);
    const distances: number[] = [];
    const durations: number[] = [];

    for (let i = 0; i < route.length - 1; i++) {
      distances.push(this.distanceMatrix[route[i]][route[i + 1]]);
      durations.push(this.durationMatrix[route[i]][route[i + 1]]);
    }

    return {
      sequence,
      totalDistance: this.calculateRouteDistance(route),
      totalDuration: this.calculateRouteDuration(route),
      distances,
      durations,
    };
  }

  /**
   * Haversine 公式计算两点间直线距离（米）
   */
  private haversineDistance(loc1: Location, loc2: Location): number {
    const R = 6371000; // 地球半径（米）
    const lat1 = (loc1.lat * Math.PI) / 180;
    const lat2 = (loc2.lat * Math.PI) / 180;
    const deltaLat = ((loc2.lat - loc1.lat) * Math.PI) / 180;
    const deltaLng = ((loc2.lng - loc1.lng) * Math.PI) / 180;

    const a =
      Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }
}
