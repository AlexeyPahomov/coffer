export class CreateIncomeDto {
  user_id!: string;
  amount!: number;
  source?: string;
  income_type?: string;
  status?: string;
  period_month!: string; // "2026-05-01"
}
