import { db, schema } from '../database/db';
import { eq } from 'drizzle-orm';

// 订单相关操作
export const orderOperations = {
  // 创建订单
  async create(data: typeof schema.orders.$inferInsert) {
    const result = await db.insert(schema.orders).values(data).returning();
    return result[0];
  },

  // 获取所有订单
  async getAll() {
    return await db.select().from(schema.orders);
  },

  // 根据 ID 获取订单
  async getById(id: number) {
    const result = await db.select().from(schema.orders).where(eq(schema.orders.id, id));
    return result[0];
  },

  // 更新订单
  async update(id: number, data: Partial<typeof schema.orders.$inferInsert>) {
    const result = await db
      .update(schema.orders)
      .set(data)
      .where(eq(schema.orders.id, id))
      .returning();
    return result[0];
  },

  // 删除订单
  async delete(id: number) {
    await db.delete(schema.orders).where(eq(schema.orders.id, id));
  },
};

// 配送会话相关操作
export const sessionOperations = {
  async create(data: typeof schema.deliverySessions.$inferInsert) {
    const result = await db.insert(schema.deliverySessions).values(data).returning();
    return result[0];
  },

  async getAll() {
    return await db.select().from(schema.deliverySessions);
  },

  async getById(id: number) {
    const result = await db
      .select()
      .from(schema.deliverySessions)
      .where(eq(schema.deliverySessions.id, id));
    return result[0];
  },

  async update(id: number, data: Partial<typeof schema.deliverySessions.$inferInsert>) {
    const result = await db
      .update(schema.deliverySessions)
      .set(data)
      .where(eq(schema.deliverySessions.id, id))
      .returning();
    return result[0];
  },
};

// 常用地址相关操作
export const addressOperations = {
  async create(data: typeof schema.frequentAddresses.$inferInsert) {
    const result = await db.insert(schema.frequentAddresses).values(data).returning();
    return result[0];
  },

  async getAll() {
    return await db.select().from(schema.frequentAddresses);
  },

  async incrementUsage(id: number) {
    const address = await db
      .select()
      .from(schema.frequentAddresses)
      .where(eq(schema.frequentAddresses.id, id));

    if (address[0]) {
      await db
        .update(schema.frequentAddresses)
        .set({
          usageCount: address[0].usageCount + 1,
          lastUsed: new Date().toISOString(),
        })
        .where(eq(schema.frequentAddresses.id, id));
    }
  },
};
