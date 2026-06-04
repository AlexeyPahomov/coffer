export class AllocationRuleLineDto {
  category_id!: string;
  mode!: string;
  amount?: number | null;
  percent?: number | null;
  position?: number;
}
