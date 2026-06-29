/**
 * Загрузить связанные сущности по внешнему ключу строк и проиндексировать их по `id`.
 * Инкапсулирует повторяющийся паттерн «собрать уникальные id → findMany → Map по id»
 * (expense / allocation / planned-expense / budget-month).
 *
 * `pickId` может вернуть `null`/`undefined` (nullable FK) — такие строки пропускаются.
 * Если уникальных id нет, `load` не вызывается и возвращается пустая Map.
 */
export async function indexRelatedByIds<Row, Entity extends { id: string }>(
  rows: readonly Row[],
  pickId: (row: Row) => string | null | undefined,
  load: (ids: string[]) => Promise<Entity[]>,
): Promise<Map<string, Entity>> {
  const ids = [
    ...new Set(rows.map(pickId).filter((id): id is string => id != null)),
  ];

  if (ids.length === 0) {
    return new Map();
  }

  const entities = await load(ids);
  return new Map(entities.map((entity) => [entity.id, entity]));
}
