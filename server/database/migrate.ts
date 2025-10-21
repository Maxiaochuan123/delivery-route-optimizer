import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { migrate } from 'drizzle-orm/libsql/migrator';
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

const db = drizzle(client);

console.log('Running migrations...');

await migrate(db, { migrationsFolder: './server/database/migrations' });

console.log('Migrations completed!');

client.close();
