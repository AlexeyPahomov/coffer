import type { Logger } from '@nestjs/common';

/** Дождаться projector перед ответом мутации — snapshot актуален к моменту refetch. */
export async function awaitBudgetProjection(
  logger: Logger,
  context: string,
  task: Promise<void>,
): Promise<void> {
  try {
    await task;
  } catch (error: unknown) {
    logger.warn(
      `Budget snapshot projection failed (${context})`,
      error instanceof Error ? error.stack : String(error),
    );
  }
}
