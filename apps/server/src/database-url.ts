function appendPostgresOption(url: URL, option: string): void {
  const current = url.searchParams.get('options') ?? '';
  if (current.includes(option)) {
    return;
  }
  url.searchParams.set('options', current ? `${current} ${option}` : option);
}

/** Supabase transaction pooler (:6543) + Prisma: `pgbouncer=true` в строке подключения. */
function normalizePoolerUrl(raw: string): string {
  try {
    const url = new URL(raw);
    const isTransactionPooler = url.port === '6543';

    if (isTransactionPooler && !url.searchParams.has('pgbouncer')) {
      url.searchParams.set('pgbouncer', 'true');
    }

    if (isTransactionPooler) {
      // Обрыв Node во время materializeMonth оставлял idle in transaction и блокировал PATCH.
      appendPostgresOption(url, '-c idle_in_transaction_session_timeout=60s');
    }

    return url.toString();
  } catch {
    return raw;
  }
}

export function resolveDatabaseUrl(): string {
  const url = process.env.DATABASE_URL_DIRECT ?? process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      'Задайте DATABASE_URL или DATABASE_URL_DIRECT в apps/server/.env.',
    );
  }
  return normalizePoolerUrl(url);
}

export function describeDatabaseTarget(connectionString: string): string {
  try {
    const url = new URL(connectionString);
    return `${url.hostname}:${url.port || '5432'}`;
  } catch {
    return 'unknown';
  }
}
