import { createParamDecorator, ExecutionContext } from '@nestjs/common';

import { DEV_USER_ID } from './dev-user';

/**
 * Резолвит пользователя из query-параметра `user_id` по единому правилу:
 * `trim` → fallback `DEV_USER_ID`. До появления аутентификации заменяет
 * ручной резолвинг, продублированный в каждом контроллере.
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx
      .switchToHttp()
      .getRequest<{ query?: Record<string, unknown> }>();
    const raw = request.query?.user_id;
    const trimmed = typeof raw === 'string' ? raw.trim() : '';
    return trimmed || DEV_USER_ID;
  },
);
