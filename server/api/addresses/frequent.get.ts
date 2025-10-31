import { defineApiHandler } from '../../utils/handler';
import { addressOperations } from '../../utils/db';

/**
 * 获取所有常用地址
 * GET /api/addresses/frequent
 * 按最后使用时间降序排列，返回包含联系方式的完整客户信息
 */
export default defineApiHandler(async () => {
  const addresses = await addressOperations.getAll();

  // 按最后使用时间降序排序
  return addresses.sort((a, b) => {
    const dateA = new Date(a.lastUsed).getTime();
    const dateB = new Date(b.lastUsed).getTime();
    return dateB - dateA;
  });
});
