const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function isTransientDbError(error: unknown): boolean {
  // P1017 «Server has closed the connection» — pooler оборвал соединение (транзиентно).
  if ((error as { code?: unknown })?.code === 'P1017') {
    return true;
  }

  const message =
    error instanceof Error
      ? error.message.toLowerCase()
      : String(error).toLowerCase();

  return (
    message.includes('connection terminated unexpectedly') ||
    message.includes('connection closed') ||
    message.includes('closed the connection') ||
    message.includes('connection terminated due to connection timeout') ||
    message.includes('timeout exceeded when trying to connect') ||
    message.includes('econnreset')
  );
}

export async function withTransientDbRetry<T>(
  fn: () => Promise<T>,
  attempts = 4,
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (!isTransientDbError(error) || attempt === attempts - 1) {
        throw error;
      }
      await sleep(150 * (attempt + 1));
    }
  }

  throw lastError;
}
