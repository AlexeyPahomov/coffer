export const bootstrapQueryKeys = {
  all: ['bootstrap'] as const,
  bundle: (periodMonth: string, asOf: string) =>
    [...bootstrapQueryKeys.all, periodMonth, asOf] as const,
}
