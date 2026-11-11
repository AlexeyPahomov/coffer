export class UpdatePlannedExpenseDto {
  title?: string;
  description?: string;
  icon_name?: string;
  icon_color?: string;
  amount?: number;
  planned_date?: string;
  planned_date_end?: string | null;
  status?: 'PLANNED' | 'RESERVED' | 'COMPLETED' | 'CANCELLED';
  reserved_amount?: number;
  category_id?: string | null;
  savings_category_id?: string | null;
  savings_amount?: number;
}
