import { Pool, type PoolConfig } from 'pg';

import { resolveDatabaseUrl } from '../database-url';

let sharedPool: Pool | undefined;

function resolvePoolMax(): number {
  const raw = Number(process.env.DATABASE_POOL_MAX ?? 1);
  if (!Number.isFinite(raw) || raw < 1) {
    return 1;
  }
  return Math.min(Math.floor(raw), 1);
}

export function getSharedPgPool(): Pool {
  if (sharedPool) {
    return sharedPool;
  }

  const config: PoolConfig = {
    connectionString: resolveDatabaseUrl(),
    max: resolvePoolMax(),
    min: 0,
    idleTimeoutMillis: 1_000,
    connectionTimeoutMillis: 60_000,
    allowExitOnIdle: true,
    keepAlive: true,
    keepAliveInitialDelayMillis: 1_000,
    maxUses: 1,
  };

  if (process.env.DATABASE_SSL_REJECT_UNAUTHORIZED === 'false') {
    config.ssl = { rejectUnauthorized: false };
  }

  sharedPool = new Pool(config);
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
