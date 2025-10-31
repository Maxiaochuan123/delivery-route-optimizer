import { defineApiHandler } from '../../../utils/handler';
import { addressOperations } from '../../../utils/db';

/**
 * 获取最近联系的常用客户
 * GET /api/addresses/frequent/recent
 * 返回按最后使用时间降序排序的前5个客户
 */
export default defineApiHandler(async () => {
  const addresses = await addressOperations.getAll();

  // 按最后使用时间降序排序，取前5个
  return addresses
    .sort((a, b) => {
      const dateA = new Date(a.lastUsed).getTime();
      const dateB = new Date(b.lastUsed).getTime();
      return dateB - dateA;
    })
    .slice(0, 5);
});
