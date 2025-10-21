import { defineApiHandler, getValidatedBody } from '../../utils/handler';
import { validateOrderInput } from '../../utils/validation';
import { orderOperations } from '../../utils/db';
import { createAppError } from '../../utils/errors';

/**
 * 创建新订单
 * POST /api/orders
 * Body: { address, customerName, items, lat?, lng?, notes? }
 */
export default defineApiHandler(async (event) => {
  const body = await getValidatedBody(event, validateOrderInput);

  try {
    const order = await orderOperations.create({
      address: body.address,
      lat: body.lat,
      lng: body.lng,
      customerName: body.customerName,
      items: body.items,
      notes: body.notes,
      status: 'pending',
    });

    return order;
  } catch (error) {
    throw createAppError.database('Failed to create order');
  }
});
