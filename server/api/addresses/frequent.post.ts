import { defineApiHandler, getValidatedBody } from '../../utils/handler';
import { validateAddress, validateCoordinates } from '../../utils/validation';
import { addressOperations } from '../../utils/db';
import { db, schema } from '../../database/db';
import { eq } from 'drizzle-orm';
import { createAppError } from '../../utils/errors';

/**
 * 添加或更新常用地址
 * POST /api/addresses/frequent
 * Body: { address: string, alias?: string, lat?: number, lng?: number }
 */
export default defineApiHandler(async (event) => {
  const body = await getValidatedBody(event, (data) => {
    if (!data.address) {
      throw createAppError.validation('Address is required');
    }

    validateAddress(data.address);

    if (data.lat !== undefined || data.lng !== undefined) {
      validateCoordinates(data.lat, data.lng);
    }

    return {
      address: data.address.trim(),
      alias: data.alias?.trim(),
      lat: data.lat,
      lng: data.lng,
    };
  });

  try {
    // 检查地址是否已存在
    const existing = await db
      .select()
      .from(schema.frequentAddresses)
      .where(eq(schema.frequentAddresses.address, body.address));

    if (existing.length > 0 && existing[0]) {
      const existingAddress = existing[0];
      
      // 更新使用次数
      await addressOperations.incrementUsage(existingAddress.id);

      // 如果提供了新的别名或坐标，更新它们
      const updateData: any = {};
      if (body.alias) updateData.alias = body.alias;
      if (body.lat !== undefined) updateData.lat = body.lat;
      if (body.lng !== undefined) updateData.lng = body.lng;

      if (Object.keys(updateData).length > 0) {
        const updated = await db
          .update(schema.frequentAddresses)
          .set(updateData)
          .where(eq(schema.frequentAddresses.id, existingAddress.id))
          .returning();
        
        if (updated.length > 0 && updated[0]) {
          return updated[0];
        }
      }

      return existingAddress;
    }

    // 创建新的常用地址
    const newAddress = await addressOperations.create({
      address: body.address,
      alias: body.alias,
      lat: body.lat,
      lng: body.lng,
      usageCount: 1,
    });

    return newAddress;
  } catch (error) {
    throw createAppError.database('Failed to save frequent address');
  }
});
