import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './schema';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';

// 确保数据目录存在
const dataDir = join(process.cwd(), 'data');
if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true });
}

const dbPath = join(dataDir, 'sqlite.db');

const client = createClient({
  url: `file:${dbPath}`,
});

export const db = drizzle(client, { schema });

export { schema };
