import { AllocationRuleLineDto } from './allocation-rule-line.dto';

export class CreateAllocationRuleDto {
  name!: string;
  trigger_income_type?: string | null;
  is_active?: boolean;
  lines!: AllocationRuleLineDto[];
}
