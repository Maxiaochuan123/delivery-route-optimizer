/**
 * 添加测试订单脚本
 */

import { db, schema } from '../server/database/db';

const { orders } = schema;

async function addTestOrders() {
  try {
    console.log('📦 开始添加测试订单...');

    const testOrders = [
      {
        address: '成都市武侯区天府大道中段',
        lat: 30.5702,
        lng: 104.0647,
        customerName: '张三',
        items: '手机 x1',
        notes: '请在工作日送达',
        status: 'pending',
      },
      {
        address: '成都市高新区天府软件园',
        lat: 30.5408,
        lng: 104.0633,
        customerName: '李四',
        items: '笔记本电脑 x1',
        notes: '需要签收',
        status: 'pending',
      },
      {
        address: '成都市青羊区东风路',
        lat: 30.6251,
        lng: 104.0417,
        customerName: '王五',
        items: '耳机 x1',
        notes: '请在周末送达',
        status: 'pending',
      },
    ];

    for (const order of testOrders) {
      const [inserted] = await db.insert(orders).values(order).returning();
      console.log(`✅ 添加订单: ${inserted.customerName} - ${inserted.address}`);
    }

    console.log('🎉 测试订单添加完成！');
    console.log(`📊 共添加 ${testOrders.length} 个订单`);
  } catch (error) {
    console.error('❌ 添加测试订单失败:', error);
    throw error;
  }
}

addTestOrders();
