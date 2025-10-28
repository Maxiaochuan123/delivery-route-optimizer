import { defineApiHandler } from '../../utils/handler';
import { db, schema } from '../../database/db';
import { eq } from 'drizzle-orm';

const { deliverySessions } = schema;

/**
 * 检查是否有活动的配送会话
 * GET /api/delivery-sessions/active
 */
export default defineApiHandler(async (event) => {
  try {
    const activeSessions = await db
      .select()
      .from(deliverySessions)
      .where(eq(deliverySessions.status, 'in_progress'))
      .limit(1);

    const hasActiveSession = activeSessions.length > 0;
    const activeSession = activeSessions[0] || null;

    return {
      hasActiveSession,
      activeSession: activeSession
        ? {
            sessionId: activeSession.id,
            startLocation: activeSession.startLocation,
            orderCount: activeSession.orderCount,
            createdAt: activeSession.createdAt,
          }
        : null,
    };
  } catch (error: any) {
    console.error('Failed to check active session:', error);
    throw error;
  }
});
