export class CreateTransferDto {
  from_category_id: string;
  /** Отсутствует → списание из накоплений в свободный пул (без конверта-получателя). */
  to_category_id?: string;
  amount: number;
  period_month: string; // "2026-06-01"
}
