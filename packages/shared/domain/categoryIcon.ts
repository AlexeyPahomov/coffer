export const CATEGORY_ICON_KEYS = [
  'shopping-cart',
  'wallet',
  'home',
  'building-2',
  'utensils',
  'landmark',
  'car',
  'trees',
  'dog',
  'health',
  'shirt',
  'dumbbell',
  'gift',
  'plane',
  'book-open',
  'baby',
] as const;

export type CategoryIconKey = (typeof CATEGORY_ICON_KEYS)[number];

export const DEFAULT_CATEGORY_ICON_KEY: CategoryIconKey = 'shopping-cart';

export const CATEGORY_ICON_LABELS: Record<CategoryIconKey, string> = {
  'shopping-cart': 'Корзина',
  wallet: 'Кошелёк',
  home: 'Дом',
  'building-2': 'Здание',
  utensils: 'Еда',
  landmark: 'Накопления',
  car: 'Авто',
  trees: 'Природа',
  dog: 'Животные',
  health: 'Здоровье',
  shirt: 'Одежда',
  dumbbell: 'Спорт',
  gift: 'Подарки',
  plane: 'Путешествия',
  'book-open': 'Обучение',
  baby: 'Дети',
};

export function isCategoryIconKey(value: string): value is CategoryIconKey {
  return (CATEGORY_ICON_KEYS as readonly string[]).includes(value);
}
