import { config } from 'dotenv';
import { resolve } from 'node:path';
import { defineConfig } from 'prisma/config';

config({ path: resolve(__dirname, '.env') });

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    // Миграции требуют session/direct-соединение: транзакционный pooler (:6543,
    // pgbouncer) не держит advisory-локи и DDL. Рантайм остаётся на DATABASE_URL.
    url:
      process.env.DATABASE_URL_MIGRATE ??
      process.env.DATABASE_URL_DIRECT ??
      process.env.DATABASE_URL,
  },
});
