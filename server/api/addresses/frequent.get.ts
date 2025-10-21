import { defineApiHandler } from '../../utils/handler';
import { addressOperations } from '../../utils/db';

/**
 * 获取所有常用地址
 * GET /api/addresses/frequent
 * 按使用次数降序排列
 */
export default defineApiHandler(async () => {
  const addresses = await addressOperations.getAll();

  // 按使用次数降序排序
  return addresses.sort((a, b) => b.usageCount - a.usageCount);
});
