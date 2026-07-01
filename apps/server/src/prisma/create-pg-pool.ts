import { Pool, type PoolConfig } from 'pg';

import { describeDatabaseTarget, resolveDatabaseUrl } from '../database-url';

let sharedPool: Pool | undefined;

function resolvePoolMax(): number {
  const raw = Number(process.env.DATABASE_POOL_MAX ?? 5);
  if (!Number.isFinite(raw) || raw < 1) {
    return 5;
  }
  return Math.min(Math.floor(raw), 20);
}

export function getSharedPgPool(): Pool {
  if (sharedPool) {
    return sharedPool;
  }

  const connectionString = resolveDatabaseUrl();
  const config: PoolConfig = {
    connectionString,
    max: resolvePoolMax(),
    min: 0,
    // Держим соединение тёплым между запросами — без этого каждый запрос платил
    // полный TCP+TLS+pooler handshake (раньше idle=1s + maxUses=1 рвали коннект
    // после каждого запроса). idle < серверного таймаута Supavisor, чтобы отдавать
    // из пула живые соединения; обрывы всё равно ловит withTransientDbRetry.
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 60_000,
    allowExitOnIdle: true,
    keepAlive: true,
    keepAliveInitialDelayMillis: 1_000,
    // Периодически пересоздаём соединение (защита от залипания на pooler),
    // но не на каждый запрос.
    maxUses: 200,
  };

  if (process.env.DATABASE_SSL_REJECT_UNAUTHORIZED === 'false') {
    config.ssl = { rejectUnauthorized: false };
  }

  sharedPool = new Pool(config);
  console.log(
    `[pg Pool] target=${describeDatabaseTarget(connectionString)} max=${config.max} idle=${config.idleTimeoutMillis}ms maxUses=${config.maxUses}`,
  );
  sharedPool.on('error', (error) => {
    console.error('[pg Pool] idle client error', error.message);
  });

  return sharedPool;
}

export async function closeSharedPgPool(): Promise<void> {
  if (!sharedPool) {
    return;
  }
  await sharedPool.end();
  sharedPool = undefined;
}
