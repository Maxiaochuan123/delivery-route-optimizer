import { defineApiHandler, getValidatedBody } from '../utils/handler';
import { validateAddress } from '../utils/validation';
import { geocodeAddress } from '../utils/amap';

/**
 * 地理编码：将地址转换为经纬度
 * POST /api/geocode
 * Body: { address: string }
 */
export default defineApiHandler(async (event) => {
  const { address } = await getValidatedBody(event, (data) => {
    if (!data.address) {
      throw new Error('Address is required');
    }
    return {
      address: validateAddress(data.address),
    };
  });

  const result = await geocodeAddress(address);

  return result;
});
