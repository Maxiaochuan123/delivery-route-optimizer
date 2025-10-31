import { defineApiHandler, getValidatedBody } from '../../utils/handler';
import { validateAddress, validateCoordinates } from '../../utils/validation';
import { addressOperations } from '../../utils/db';
import { db, schema } from '../../database/db';
import { eq } from 'drizzle-orm';
import { createAppError } from '../../utils/errors';

/**
 * 添加或更新常用客户
 * POST /api/addresses/frequent
 * Body: { customerName: string, address: string, alias?: string, lat?: number, lng?: number, contactType?: string, contactValue?: string }
 */
export default defineApiHandler(async (event) => {
  const body = await getValidatedBody(event, (data) => {
    if (!data.customerName) {
      throw createAppError.validation('Customer name is required');
    }
    
    if (!data.address) {
      throw createAppError.validation('Address is required');
    }

    validateAddress(data.address);

    if (data.lat !== undefined || data.lng !== undefined) {
      validateCoordinates(data.lat, data.lng);
    }

    // 验证联系方式类型
    if (data.contactType && !['phone', 'wechat'].includes(data.contactType)) {
      throw createAppError.validation('Contact type must be either "phone" or "wechat"');
    }

    return {
      customerName: data.customerName.trim(),
      address: data.address.trim(),
      alias: data.alias?.trim(),
      lat: data.lat,
      lng: data.lng,
      contactType: data.contactType,
      contactValue: data.contactValue?.trim(),
    };
  });

  try {
    // 检查客户是否已存在（基于客户姓名和地址）
    const existing = await db
      .select()
      .from(schema.frequentAddresses)
      .where(eq(schema.frequentAddresses.customerName, body.customerName));

    // 如果存在同名客户，检查地址是否相同
    const existingCustomer = existing.find(
      (c) => c.address === body.address && c.lat === body.lat && c.lng === body.lng
    );

    if (existingCustomer) {
      // 更新使用次数
      await addressOperations.incrementUsage(existingCustomer.id);

      // 如果提供了新的别名、坐标或联系方式，更新它们
      const updateData: {
        alias?: string;
        lat?: number;
        lng?: number;
        contactType?: string;
        contactValue?: string;
      } = {};
      if (body.alias) updateData.alias = body.alias;
      if (body.lat !== undefined) updateData.lat = body.lat;
      if (body.lng !== undefined) updateData.lng = body.lng;
      if (body.contactType) updateData.contactType = body.contactType;
      if (body.contactValue) updateData.contactValue = body.contactValue;

      if (Object.keys(updateData).length > 0) {
        const updated = await db
          .update(schema.frequentAddresses)
          .set(updateData)
          .where(eq(schema.frequentAddresses.id, existingCustomer.id))
          .returning();

        if (updated.length > 0 && updated[0]) {
          return updated[0];
        }
      }

      return existingCustomer;
    }

    // 创建新的常用客户
    const newCustomer = await addressOperations.create({
      customerName: body.customerName,
      address: body.address,
      alias: body.alias,
      lat: body.lat,
      lng: body.lng,
      contactType: body.contactType,
      contactValue: body.contactValue,
      usageCount: 1,
    });

    return newCustomer;
  } catch (err) {
    console.error('Failed to save frequent customer:', err);
    throw createAppError.database('Failed to save frequent customer');
  }
});
