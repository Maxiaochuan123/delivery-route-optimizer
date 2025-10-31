import { defineApiHandler, getValidatedBody } from '../../utils/handler';
import { validateOrderInput } from '../../utils/validation';
import { orderOperations } from '../../utils/db';

/**
 * 创建新订单
 * POST /api/orders
 * Body: { address, customerName, items, lat?, lng?, notes?, contactType?, contactValue? }
 */
export default defineApiHandler(async (event) => {
  const body = await getValidatedBody(event, validateOrderInput);

  const order = await orderOperations.create({
    address: body.address,
    lat: body.lat,
    lng: body.lng,
    customerName: body.customerName,
    items: body.items,
    notes: body.notes,
    contactType: body.contactType,
    contactValue: body.contactValue,
    status: 'pending',
  });

  return order;
});
