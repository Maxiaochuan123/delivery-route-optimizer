import { defineApiHandler } from '../../utils/handler';
import { db, schema } from '../../database/db';
import { desc, gte } from 'drizzle-orm';

const { deliverySessions } = schema;

/**
 * 获取配送会话列表
 * GET /api/delivery-sessions?filter=all|today|week|month
 */
export default defineApiHandler(async (event) => {
  const query = getQuery(event);
  const filter = (query.filter as string) || 'all';

  try {
    let sessions;

    // 根据筛选条件获取数据（返回所有会话）
    if (filter === 'all') {
      sessions = await db.select().from(deliverySessions).orderBy(desc(deliverySessions.createdAt));
    } else {
      const now = new Date();
      let startDate: Date;

      switch (filter) {
        case 'today': {
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        }
        case 'week': {
          const dayOfWeek = now.getDay();
          startDate = new Date(now);
          startDate.setDate(now.getDate() - dayOfWeek);
          startDate.setHours(0, 0, 0, 0);
          break;
        }
        case 'month': {
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        }
        default: {
          startDate = new Date(0);
        }
      }

      sessions = await db
        .select()
        .from(deliverySessions)
        .where(gte(deliverySessions.createdAt, startDate.toISOString()))
        .orderBy(desc(deliverySessions.createdAt));
    }

    // 计算统计信息（只统计已完成的会话，排除已取消的）
    const completedSessions = sessions.filter(
      (s) => s.completedAt !== null && s.status === 'completed'
    );
    const stats = completedSessions.reduce(
      (acc, session) => {
        acc.totalSessions += 1;
        acc.totalDistance += session.totalDistance || 0;
        acc.totalOrders += session.orderCount || 0;
        acc.totalDuration += session.totalDuration || 0;
        return acc;
      },
      {
        totalSessions: 0,
        totalDistance: 0,
        totalOrders: 0,
        totalDuration: 0,
      }
    );

    return {
      sessions,
      stats: {
        totalSessions: stats.totalSessions,
        totalDistanceKm: (stats.totalDistance / 1000).toFixed(2),
        totalOrders: stats.totalOrders,
        totalDurationMin: Math.round(stats.totalDuration / 60),
      },
    };
  } catch (error) {
    console.error('Failed to get delivery sessions:', error);
    throw error;
  }
});
