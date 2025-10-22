import { defineApiHandler, getValidatedBody } from '../../utils/handler';
import { createAppError } from '../../utils/errors';

interface SearchRequest {
  keyword: string;
  city?: string;
}

/**
 * 地址搜索 API（高德地图 POI 搜索）
 * POST /api/geocode/search
 */
export default defineApiHandler(async (event) => {
  const body = await getValidatedBody<SearchRequest>(event, (data) => {
    if (!data.keyword || typeof data.keyword !== 'string') {
      throw createAppError.validation('Keyword is required');
    }

    if (data.keyword.length < 2) {
      throw createAppError.validation('Keyword must be at least 2 characters');
    }

    return data;
  });

  const config = useRuntimeConfig();
  const amapKey = config.public.amapKey;

  if (!amapKey) {
    throw createAppError.internal('AMap API key is not configured');
  }

  try {
    // 调用高德地图 POI 搜索 API
    const params = new URLSearchParams({
      key: amapKey,
      keywords: body.keyword,
      output: 'json',
      offset: '10', // 返回最多10条结果
      extensions: 'base',
    });

    if (body.city) {
      params.append('city', body.city);
    }

    const response = await $fetch(`https://restapi.amap.com/v3/place/text?${params.toString()}`);

    const data = response as any;

    if (data.status === '1' && data.pois) {
      // 格式化返回结果
      const pois = data.pois.map((poi: any) => {
        const [lng, lat] = poi.location.split(',').map(Number);
        
        // 构建完整地址
        const addressParts = [];
        if (poi.pname) addressParts.push(poi.pname);
        if (poi.cityname && poi.cityname !== poi.pname) addressParts.push(poi.cityname);
        if (poi.adname) addressParts.push(poi.adname);
        if (poi.address) addressParts.push(poi.address);
        
        const fullAddress = addressParts.join('');
        
        return {
          id: poi.id,
          name: poi.name,
          address: poi.address || '',
          fullAddress,
          location: {
            lat,
            lng,
          },
        };
      });

      return {
        pois,
        count: data.count,
      };
    }

    throw createAppError.geocoding('Address search failed');
  } catch (error: any) {
    console.error('AMap search error:', error);

    if (error.name === 'AppError') {
      throw error;
    }

    throw createAppError.geocoding('Failed to search address');
  }
});
