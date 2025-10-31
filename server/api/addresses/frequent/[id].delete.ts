import { defineApiHandler } from '../../../utils/handler';
import { db, schema } from '../../../database/db';
import { eq } from 'drizzle-orm';
import { createAppError } from '../../../utils/errors';

/**
 * 删除常用地址
 * DELETE /api/addresses/frequent/:id
 */
export default defineApiHandler(async (event) => {
  const id = parseInt(event.context.params?.id || '0');

  if (!id || isNaN(id)) {
    throw createAppError.validation('Invalid address ID');
  }

  try {
    // 检查地址是否存在
    const existing = await db
      .select()
      .from(schema.frequentAddresses)
      .where(eq(schema.frequentAddresses.id, id));

    if (existing.length === 0) {
      throw createAppError.notFound('Address not found');
    }

    // 删除地址
    await db.delete(schema.frequentAddresses).where(eq(schema.frequentAddresses.id, id));

    return {
      message: 'Address removed from favorites',
      id,
    };
  } catch (err) {
    console.error('Failed to remove address:', err);
    throw createAppError.database('Failed to remove address from favorites');
  }
});
