import { defineApiHandler, getValidatedBody } from '../../../utils/handler';
import { validateAddress, validateCoordinates } from '../../../utils/validation';
import { db, schema } from '../../../database/db';
import { eq } from 'drizzle-orm';
import { createAppError } from '../../../utils/errors';

/**
 * 更新常用客户信息
 * PUT /api/addresses/frequent/:id
 * Body: { customerName?: string, address?: string, alias?: string, lat?: number, lng?: number, contactType?: string, contactValue?: string }
 */
export default defineApiHandler(async (event) => {
  const id = parseInt(event.context.params?.id || '0');

  if (!id || isNaN(id)) {
    throw createAppError.validation('Invalid customer ID');
  }

  const body = await getValidatedBody(event, (data) => {
    // 验证地址格式（如果提供）
    if (data.address) {
      validateAddress(data.address);
    }

    // 验证坐标（如果提供）
    if (data.lat !== undefined || data.lng !== undefined) {
      validateCoordinates(data.lat, data.lng);
    }

    // 验证联系方式类型
    if (data.contactType && !['phone', 'wechat'].includes(data.contactType)) {
      throw createAppError.validation('Contact type must be either "phone" or "wechat"');
    }

    const updateData: {
      customerName?: string;
      address?: string;
      alias?: string;
      lat?: number;
      lng?: number;
      contactType?: string;
      contactValue?: string;
    } = {};

    if (data.customerName) updateData.customerName = data.customerName.trim();
    if (data.address) updateData.address = data.address.trim();
    if (data.alias !== undefined) updateData.alias = data.alias?.trim();
    if (data.lat !== undefined) updateData.lat = data.lat;
    if (data.lng !== undefined) updateData.lng = data.lng;
    if (data.contactType !== undefined) updateData.contactType = data.contactType;
    if (data.contactValue !== undefined) updateData.contactValue = data.contactValue?.trim();

    return updateData;
  });

  try {
    // 检查客户是否存在
    const existing = await db
      .select()
      .from(schema.frequentAddresses)
      .where(eq(schema.frequentAddresses.id, id));

    if (existing.length === 0) {
      throw createAppError.notFound('Customer not found');
    }

    // 更新客户信息
    const updated = await db
      .update(schema.frequentAddresses)
      .set(body)
      .where(eq(schema.frequentAddresses.id, id))
      .returning();

    if (updated.length === 0 || !updated[0]) {
      throw createAppError.database('Failed to update customer');
    }

    return updated[0];
  } catch (err) {
    if (err instanceof Error && 'statusCode' in err) {
      throw err;
    }
    console.error('Failed to update customer:', err);
    throw createAppError.database('Failed to update customer');
  }
});
