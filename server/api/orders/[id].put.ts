import { defineApiHandler, getValidatedParams, getValidatedBody } from '../../utils/handler';
import { validateId, validateAddress, validateCoordinates } from '../../utils/validation';
import { orderOperations } from '../../utils/db';
import { createAppError } from '../../utils/errors';

/**
 * 更新订单
 * PUT /api/orders/:id
 * Body: { address?, customerName?, items?, lat?, lng?, notes?, status? }
 */
export default defineApiHandler(async (event) => {
  const { id } = getValidatedParams(event, (params) => ({
    id: validateId(params.id),
  }));

  const body = await getValidatedBody(event, (data) => {
    // 验证地址（如果提供）
    if (data.address) {
      validateAddress(data.address);
    }

    // 验证坐标（如果提供）
    if (data.lat !== undefined || data.lng !== undefined) {
      validateCoordinates(data.lat, data.lng);
    }

    // 验证状态（如果提供）
    if (data.status && !['pending', 'completed'].includes(data.status)) {
      throw createAppError.validation('Status must be either "pending" or "completed"');
    }

    return data;
  });

  // 检查订单是否存在
  const existingOrder = await orderOperations.getById(id);
  if (!existingOrder) {
    throw createAppError.notFound('Order');
  }

  try {
    const updateData: any = {};

    if (body.address) updateData.address = body.address.trim();
    if (body.customerName) updateData.customerName = body.customerName.trim();
    if (body.items) updateData.items = body.items.trim();
    if (body.notes !== undefined) updateData.notes = body.notes?.trim();
    if (body.lat !== undefined) updateData.lat = body.lat;
    if (body.lng !== undefined) updateData.lng = body.lng;
    if (body.status) {
      updateData.status = body.status;
      if (body.status === 'completed') {
        updateData.completedAt = new Date().toISOString();
      }
    }

    const updatedOrder = await orderOperations.update(id, updateData);
    return updatedOrder;
  } catch (error) {
    throw createAppError.database('Failed to update order');
  }
});
