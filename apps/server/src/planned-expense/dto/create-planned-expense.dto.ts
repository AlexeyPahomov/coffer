export class CreatePlannedExpenseDto {
  title: string;
  description?: string;
  icon_name?: string;
  icon_color?: string;
  amount: number;
  planned_date: string;
  planned_date_end?: string;
  category_id?: string;
  savings_category_id?: string;
  savings_amount?: number;
}
