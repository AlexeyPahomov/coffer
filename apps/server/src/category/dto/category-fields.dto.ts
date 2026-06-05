import type {
  CarryOverPolicy,
  CategoryIconKey,
  CategoryType,
  IconColorKey,
} from '@coffer/shared';

export class CategoryFieldsDto {
  name: string;
  type: CategoryType;
  icon: CategoryIconKey;
  icon_color: IconColorKey;
  carry_over_policy?: CarryOverPolicy;
}
