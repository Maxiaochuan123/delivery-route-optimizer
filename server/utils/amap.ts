import { createAppError } from './errors';

// 高德地图 API 配置
const AMAP_KEY = process.env.AMAP_API_KEY || '';
const AMAP_BASE_URL = 'https://restapi.amap.com/v3';

/**
 * 地理编码：将地址转换为经纬度
 */
export async function geocodeAddress(address: string) {
  if (!AMAP_KEY) {
    throw createAppError.internal('AMAP_API_KEY is not configured');
  }

  try {
    const response = await $fetch<any>(`${AMAP_BASE_URL}/geocode/geo`, {
      params: {
        address,
        key: AMAP_KEY,
      },
    });

    if (response.status !== '1' || !response.geocodes || response.geocodes.length === 0) {
      throw createAppError.geocoding('Address not found or invalid');
    }

    const geocode = response.geocodes[0];
    const [lng, lat] = geocode.location.split(',').map(Number);

    return {
      lat,
      lng,
      formattedAddress: geocode.formatted_address,
      province: geocode.province,
      city: geocode.city,
      district: geocode.district,
    };
  } catch (error: any) {
    if (error.name === 'AppError') {
      throw error;
    }
    console.error('Geocoding error:', error);
    throw createAppError.geocoding('Failed to geocode address');
  }
}

/**
 * 逆地理编码：将经纬度转换为地址
 */
export async function reverseGeocode(lat: number, lng: number) {
  if (!AMAP_KEY) {
    throw createAppError.internal('AMAP_API_KEY is not configured');
  }

  try {
    const response = await $fetch<any>(`${AMAP_BASE_URL}/geocode/regeo`, {
      params: {
        location: `${lng},${lat}`,
        key: AMAP_KEY,
      },
    });

    if (response.status !== '1' || !response.regeocode) {
      throw createAppError.geocoding('Location not found or invalid');
    }

    const regeocode = response.regeocode;

    return {
      formattedAddress: regeocode.formatted_address,
      province: regeocode.addressComponent.province,
      city: regeocode.addressComponent.city,
      district: regeocode.addressComponent.district,
    };
  } catch (error: any) {
    if (error.name === 'AppError') {
      throw error;
    }
    console.error('Reverse geocoding error:', error);
    throw createAppError.geocoding('Failed to reverse geocode location');
  }
}

/**
 * 计算两点之间的距离（使用高德地图距离测量 API）
 */
export async function calculateDistance(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number }
) {
  if (!AMAP_KEY) {
    throw createAppError.internal('AMAP_API_KEY is not configured');
  }

  try {
    const response = await $fetch<any>(`${AMAP_BASE_URL}/distance`, {
      params: {
        origins: `${origin.lng},${origin.lat}`,
        destination: `${destination.lng},${destination.lat}`,
        type: 1, // 驾车距离
        key: AMAP_KEY,
      },
    });

    if (response.status !== '1' || !response.results || response.results.length === 0) {
      throw createAppError.routeCalculation('Failed to calculate distance');
    }

    const result = response.results[0];

    return {
      distance: parseInt(result.distance), // 米
      duration: parseInt(result.duration), // 秒
    };
  } catch (error: any) {
    if (error.name === 'AppError') {
      throw error;
    }
    console.error('Distance calculation error:', error);
    throw createAppError.routeCalculation('Failed to calculate distance');
  }
}

/**
 * 批量计算距离矩阵
 */
export async function calculateDistanceMatrix(
  origins: Array<{ lat: number; lng: number }>,
  destinations: Array<{ lat: number; lng: number }>
) {
  if (!AMAP_KEY) {
    throw createAppError.internal('AMAP_API_KEY is not configured');
  }

  // 高德地图 API 限制：origins 和 destinations 最多各 10 个
  if (origins.length > 10 || destinations.length > 10) {
    throw createAppError.validation('Too many locations (max 10 each)');
  }

  try {
    const originsStr = origins.map((o) => `${o.lng},${o.lat}`).join('|');
    const destinationsStr = destinations.map((d) => `${d.lng},${d.lat}`).join('|');

    const response = await $fetch<any>(`${AMAP_BASE_URL}/distance`, {
      params: {
        origins: originsStr,
        destination: destinationsStr,
        type: 1, // 驾车距离
        key: AMAP_KEY,
      },
    });

    if (response.status !== '1' || !response.results) {
      throw createAppError.routeCalculation('Failed to calculate distance matrix');
    }

    return response.results.map((result: any) => ({
      distance: parseInt(result.distance), // 米
      duration: parseInt(result.duration), // 秒
    }));
  } catch (error: any) {
    if (error.name === 'AppError') {
      throw error;
    }
    console.error('Distance matrix calculation error:', error);
    throw createAppError.routeCalculation('Failed to calculate distance matrix');
  }
}
