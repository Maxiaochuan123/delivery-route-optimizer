import { defineApiHandler } from '../../utils/handler';
import { db, schema } from '../../database/db';
import { desc } from 'drizzle-orm';

const { deliverySessions } = schema;

/**
 * 获取所有配送会话（包括未完成的）
 * GET /api/delivery-sessions/all
 */
export default defineApiHandler(async (event) => {
  try {
    const sessions = await db
      .select()
      .from(deliverySessions)
      .orderBy(desc(deliverySessions.createdAt));

    return {
      success: true,
      sessions,
    };
  } catch (error: any) {
    console.error('Failed to get all delivery sessions:', error);
    throw error;
  }
});
