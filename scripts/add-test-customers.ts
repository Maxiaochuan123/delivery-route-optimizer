/**
 * 添加测试客户脚本
 */

import { db, schema } from '../server/database/db';

const { frequentAddresses } = schema;

// 测试客户数据 - 50个不同姓名的客户
const testCustomers = [
  { name: '张伟', alias: '老张', address: '成都市武侯区天府大道中段1号', contactType: 'phone', contactValue: '13811111111' },
  { name: '王芳', alias: '小王', address: '成都市锦江区红星路二段1号', contactType: 'wechat', contactValue: 'wangfang123' },
  { name: '李娜', alias: '娜姐', address: '成都市青羊区青羊大道1号', contactType: 'phone', contactValue: '13822222222' },
  { name: '刘强', alias: '刘总', address: '成都市金牛区人民北路一段1号', contactType: 'phone', contactValue: '13833333333' },
  { name: '陈静', alias: '静静', address: '成都市成华区建设路1号', contactType: 'wechat', contactValue: 'chenjing456' },
  { name: '杨洋', alias: '阳阳', address: '成都市高新区天府软件园A区', contactType: 'phone', contactValue: '13844444444' },
  { name: '赵敏', alias: '敏敏', address: '成都市双流区航空港大道1号', contactType: 'wechat', contactValue: 'zhaomin789' },
  { name: '黄磊', alias: '黄老师', address: '成都市温江区柳城大道1号', contactType: 'phone', contactValue: '13855555555' },
  { name: '周杰', alias: '杰哥', address: '成都市郫都区犀浦镇', contactType: 'phone', contactValue: '13866666666' },
  { name: '吴彦', alias: '彦彦', address: '成都市新都区新都大道1号', contactType: 'wechat', contactValue: 'wuyan321' },
  { name: '徐峰', alias: '峰哥', address: '成都市龙泉驿区龙泉大道1号', contactType: 'phone', contactValue: '13877777777' },
  { name: '孙丽', alias: '丽姐', address: '成都市青白江区大弯街道', contactType: 'wechat', contactValue: 'sunli654' },
  { name: '马超', alias: '超哥', address: '成都市新津区五津西路1号', contactType: 'phone', contactValue: '13888888888' },
  { name: '朱婷', alias: '婷婷', address: '成都市都江堰市都江堰大道1号', contactType: 'phone', contactValue: '13899999999' },
  { name: '胡歌', alias: '歌哥', address: '成都市彭州市天彭镇', contactType: 'wechat', contactValue: 'huge987' },
  { name: '郭敬明', alias: '小四', address: '成都市邛崃市临邛镇', contactType: 'phone', contactValue: '13900000000' },
  { name: '林志玲', alias: '志玲姐', address: '成都市崇州市崇阳街道', contactType: 'wechat', contactValue: 'linzhiling' },
  { name: '何炅', alias: '何老师', address: '成都市金堂县赵镇', contactType: 'phone', contactValue: '13911111111' },
  { name: '谢娜', alias: '娜娜', address: '成都市大邑县晋原街道', contactType: 'phone', contactValue: '13922222222' },
  { name: '汪涵', alias: '涵哥', address: '成都市蒲江县鹤山街道', contactType: 'wechat', contactValue: 'wanghan123' },
  { name: '宋丹丹', alias: '丹姐', address: '成都市简阳市简城街道', contactType: 'phone', contactValue: '13933333333' },
  { name: '范冰冰', alias: '冰冰', address: '成都市武侯区科华北路1号', contactType: 'wechat', contactValue: 'fanbingbing' },
  { name: '冯小刚', alias: '冯导', address: '成都市锦江区春熙路1号', contactType: 'phone', contactValue: '13944444444' },
  { name: '葛优', alias: '葛大爷', address: '成都市青羊区宽窄巷子1号', contactType: 'phone', contactValue: '13955555555' },
  { name: '巩俐', alias: '巩皇', address: '成都市金牛区九里堤路1号', contactType: 'wechat', contactValue: 'gongli456' },
  { name: '章子怡', alias: '国际章', address: '成都市成华区双林路1号', contactType: 'phone', contactValue: '13966666666' },
  { name: '周星驰', alias: '星爷', address: '成都市高新区孵化园1号', contactType: 'wechat', contactValue: 'zhouxingchi' },
  { name: '刘德华', alias: '华仔', address: '成都市双流区东升街道', contactType: 'phone', contactValue: '13977777777' },
  { name: '张学友', alias: '歌神', address: '成都市温江区光华大道1号', contactType: 'phone', contactValue: '13988888888' },
  { name: '郭富城', alias: '城城', address: '成都市郫都区红光镇', contactType: 'wechat', contactValue: 'guofucheng' },
  { name: '黎明', alias: '黎天王', address: '成都市新都区三河街道', contactType: 'phone', contactValue: '13999999999' },
  { name: '梁朝伟', alias: '伟仔', address: '成都市龙泉驿区大面街道', contactType: 'wechat', contactValue: 'liangchaowei' },
  { name: '刘嘉玲', alias: '嘉玲姐', address: '成都市青白江区大同镇', contactType: 'phone', contactValue: '13800000001' },
  { name: '张曼玉', alias: '曼玉', address: '成都市新津区花源镇', contactType: 'phone', contactValue: '13800000002' },
  { name: '王菲', alias: '菲姐', address: '成都市都江堰市蒲阳镇', contactType: 'wechat', contactValue: 'wangfei789' },
  { name: '那英', alias: '那姐', address: '成都市彭州市丽春镇', contactType: 'phone', contactValue: '13800000003' },
  { name: '孙燕姿', alias: '燕姿', address: '成都市邛崃市固驿镇', contactType: 'wechat', contactValue: 'sunyanzi' },
  { name: '蔡依林', alias: 'Jolin', address: '成都市崇州市羊马镇', contactType: 'phone', contactValue: '13800000004' },
  { name: '林俊杰', alias: 'JJ', address: '成都市金堂县淮口镇', contactType: 'phone', contactValue: '13800000005' },
  { name: '周杰伦', alias: '周董', address: '成都市大邑县安仁镇', contactType: 'wechat', contactValue: 'zhoujielun' },
  { name: '陈奕迅', alias: 'Eason', address: '成都市蒲江县寿安镇', contactType: 'phone', contactValue: '13800000006' },
  { name: '邓紫棋', alias: 'GEM', address: '成都市简阳市石桥镇', contactType: 'wechat', contactValue: 'dengziqi' },
  { name: '李宇春', alias: '春春', address: '成都市武侯区桐梓林路1号', contactType: 'phone', contactValue: '13800000007' },
  { name: '张靓颖', alias: '靓颖', address: '成都市锦江区水井坊1号', contactType: 'phone', contactValue: '13800000008' },
  { name: '华晨宇', alias: '花花', address: '成都市青羊区文殊院1号', contactType: 'wechat', contactValue: 'huachenyu' },
  { name: '毛不易', alias: '毛毛', address: '成都市金牛区茶店子1号', contactType: 'phone', contactValue: '13800000009' },
  { name: '薛之谦', alias: '老薛', address: '成都市成华区猛追湾1号', contactType: 'wechat', contactValue: 'xuezhiqian' },
  { name: '李荣浩', alias: '浩浩', address: '成都市高新区环球中心', contactType: 'phone', contactValue: '13800000010' },
  { name: '邓超', alias: '超哥', address: '成都市双流区华阳街道', contactType: 'phone', contactValue: '13800000011' },
  { name: '孙俪', alias: '娘娘', address: '成都市温江区万春镇', contactType: 'wechat', contactValue: 'sunli888' },
];

// 成都市的一些真实坐标点（大致范围）
const chengduCoordinates = [
  { lat: 30.6586, lng: 104.0647 }, // 天府广场
  { lat: 30.6398, lng: 104.0633 }, // 春熙路
  { lat: 30.6722, lng: 104.0431 }, // 宽窄巷子
  { lat: 30.5702, lng: 103.9880 }, // 双流机场
  { lat: 30.6600, lng: 104.1200 }, // 东郊记忆
  { lat: 30.5400, lng: 104.0700 }, // 华阳
  { lat: 30.7000, lng: 103.9500 }, // 温江
  { lat: 30.8200, lng: 103.8800 }, // 郫都
  { lat: 30.7500, lng: 104.2700 }, // 龙泉
  { lat: 30.8800, lng: 104.1500 }, // 新都
];

async function addTestCustomers() {
  try {
    console.log('📦 开始添加测试客户数据...');

    let successCount = 0;

    for (let index = 0; index < testCustomers.length; index++) {
      const customer = testCustomers[index];
      
      try {
        // 随机选择一个坐标点
        const coord = chengduCoordinates[index % chengduCoordinates.length];
        // 添加一些随机偏移
        const lat = coord.lat + (Math.random() - 0.5) * 0.05;
        const lng = coord.lng + (Math.random() - 0.5) * 0.05;

        // 随机使用次数（1-50次）
        const usageCount = Math.floor(Math.random() * 50) + 1;

        // 随机最后使用时间（最近30天内）
        const daysAgo = Math.floor(Math.random() * 30);
        const lastUsed = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString();

        await db.insert(frequentAddresses).values({
          customerName: customer.name,
          address: customer.address,
          alias: customer.alias,
          lat,
          lng,
          contactType: customer.contactType as 'phone' | 'wechat',
          contactValue: customer.contactValue,
          usageCount,
          lastUsed,
        });

        successCount++;
        console.log(`✅ 添加客户: ${customer.name} - ${customer.address}`);
      } catch (error) {
        console.error(`❌ 添加客户 ${customer.name} 失败:`, error);
      }
    }

    console.log(`🎉 测试客户添加完成！`);
    console.log(`📊 共成功添加 ${successCount} 个客户`);
  } catch (error) {
    console.error('❌ 添加测试数据失败:', error);
    throw error;
  }
}

addTestCustomers();
