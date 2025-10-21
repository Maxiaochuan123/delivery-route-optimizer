import { defineApiHandler, getValidatedBody } from '../../utils/handler';
import { validateCoordinates } from '../../utils/validation';
import { reverseGeocode } from '../../utils/amap';
import { createAppError } from '../../utils/errors';

/**
 * 逆地理编码：将经纬度转换为地址
 * POST /api/geocode/reverse
 * Body: { lat: number, lng: number }
 */
export default defineApiHandler(async (event) => {
  const { lat, lng } = await getValidatedBody(event, (data) => {
    if (data.lat === undefined || data.lng === undefined) {
      throw createAppError.validation('Latitude and longitude are required');
    }

    validateCoordinates(data.lat, data.lng);

    return {
      lat: Number(data.lat),
      lng: Number(data.lng),
    };
  });

  const result = await reverseGeocode(lat, lng);

  return result;
});
