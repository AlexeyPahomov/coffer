export const PLANNED_EXPENSE_ICON_KEYS = [
  'gift',
  'kayak',
  'trees',
  'plane',
  'car',
  'home',
  'landmark',
  'health',
  'wallet',
  'utensils',
  'shopping-cart',
  'building-2',
  'dog',
  'smartphone',
  'shield',
  'sparkles',
] as const;

export type PlannedExpenseIconKey = (typeof PLANNED_EXPENSE_ICON_KEYS)[number];

export const DEFAULT_PLANNED_EXPENSE_ICON_KEY: PlannedExpenseIconKey = 'gift';

export const PLANNED_EXPENSE_ICON_LABELS: Record<
  PlannedExpenseIconKey,
  string
> = {
  gift: 'Подарок',
  plane: 'Поездка',
  kayak: 'Каяк / Активный отдых',
  car: 'Авто',
  home: 'Дом',
  landmark: 'Накопления',
  health: 'Здоровье',
  wallet: 'Кошелёк',
  trees: 'Природа',
  utensils: 'Еда',
  'shopping-cart': 'Покупки',
  'building-2': 'Жильё',
  dog: 'Животные',
  smartphone: 'Связь и техника',
  shield: 'Страховка',
  sparkles: 'Праздник',
};

export function isPlannedExpenseIconKey(
  value: string,
): value is PlannedExpenseIconKey {
  return (PLANNED_EXPENSE_ICON_KEYS as readonly string[]).includes(value);
}
