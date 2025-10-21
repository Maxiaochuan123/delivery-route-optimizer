import { defineApiHandler, getValidatedParams } from '../../../utils/handler';
import { validateId } from '../../../utils/validation';
import { db, schema } from '../../../database/db';
import { eq } from 'drizzle-orm';
import { createAppError } from '../../../utils/errors';

/**
 * 删除常用地址
 * DELETE /api/addresses/frequent/:id
 */
export default defineApiHandler(async (event) => {
  const { id } = getValidatedParams(event, (params) => ({
    id: validateId(params.id),
  }));

  // 检查地址是否存在
  const existing = await db
    .select()
    .from(schema.frequentAddresses)
    .where(eq(schema.frequentAddresses.id, id));

  if (existing.length === 0) {
    throw createAppError.notFound('Frequent address');
  }

  try {
    await db.delete(schema.frequentAddresses).where(eq(schema.frequentAddresses.id, id));

    return { message: 'Frequent address deleted successfully', id };
  } catch (error) {
    throw createAppError.database('Failed to delete frequent address');
  }
});
