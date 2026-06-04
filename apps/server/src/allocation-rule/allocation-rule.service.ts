import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  DEFAULT_ALLOCATION_TYPE,
  isAllocationRuleLineMode,
  isIncomeType,
} from '@coffer/shared';

import type { AllocationRuleLineMode } from '../generated/prisma/client';
import { DEV_USER_ID } from '../lib/dev-user';
import { sumPrismaMoneyAmounts, toMoneyNumber } from '../lib/money';
import { BudgetMonthService } from '../budget/budget-month.service';
import { PrismaService } from '../prisma/prisma.service';
import { ApplyAllocationRuleDto } from './dto/apply-allocation-rule.dto';
import { AllocationRuleLineDto } from './dto/allocation-rule-line.dto';
import { CreateAllocationRuleDto } from './dto/create-allocation-rule.dto';
import { UpdateAllocationRuleDto } from './dto/update-allocation-rule.dto';

type RuleWithLines = Awaited<
  ReturnType<AllocationRuleService['findMatchingRules']>
>[number];

type PreviewLine = {
  category_id: string;
  category_name: string;
  mode: AllocationRuleLineMode;
  amount: number;
  percent: number | null;
};

type PreviewRule = {
  rule: {
    id: string;
    name: string;
    trigger_income_type: string | null;
  };
  lines: PreviewLine[];
  total: number;
  remainingAfterApply: number;
  exceedsRemaining: boolean;
};

@Injectable()
export class AllocationRuleService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly budgetMonthService: BudgetMonthService,
  ) {}

  private normalizeTriggerIncomeType(value: string | null | undefined) {
    const normalized = value?.trim() || null;
    if (normalized !== null && !isIncomeType(normalized)) {
      throw new BadRequestException('Invalid trigger income type');
    }
    return normalized;
  }

  private validateLine(line: AllocationRuleLineDto): void {
    if (!isAllocationRuleLineMode(line.mode)) {
      throw new BadRequestException('Invalid allocation rule line mode');
    }

    if (line.mode === 'FIXED') {
      if (line.amount == null || line.amount <= 0) {
        throw new BadRequestException('Fixed allocation rule line needs amount');
      }
      return;
    }

    if (line.percent == null || line.percent <= 0 || line.percent > 100) {
      throw new BadRequestException(
        'Percent allocation rule line needs percent between 0 and 100',
      );
    }
  }

  private async validateRuleDto(dto: CreateAllocationRuleDto): Promise<void> {
    if (!dto.name?.trim()) {
      throw new BadRequestException('Rule name is required');
    }
    if (!Array.isArray(dto.lines) || dto.lines.length === 0) {
      throw new BadRequestException('Rule needs at least one line');
    }

    dto.lines.forEach((line) => this.validateLine(line));

    const categoryIds = [...new Set(dto.lines.map((line) => line.category_id))];
    const categories = await this.prisma.category.findMany({
      where: { id: { in: categoryIds }, user_id: DEV_USER_ID },
    });

    if (categories.length !== categoryIds.length) {
      throw new BadRequestException('Category not found');
    }
  }

  private lineData(line: AllocationRuleLineDto, index: number) {
    const mode = line.mode as AllocationRuleLineMode;
    return {
      category_id: line.category_id,
      mode,
      amount: mode === 'FIXED' ? line.amount : null,
      percent: mode === 'PERCENT' ? line.percent : null,
      position: line.position ?? index,
    };
  }

  private includeRuleRelations() {
    return {
      lines: {
        include: { category: true },
        orderBy: { position: 'asc' as const },
      },
    };
  }

  private normalizeRequiredId(value: string | null | undefined, field: string) {
    const normalized = value?.trim() ?? '';
    if (!normalized) {
      throw new BadRequestException(`${field} is required`);
    }
    return normalized;
  }

  private normalizeOptionalId(value: string | null | undefined) {
    const normalized = value?.trim() ?? '';
    return normalized || undefined;
  }

  async create(dto: CreateAllocationRuleDto) {
    await this.validateRuleDto(dto);

    return this.prisma.allocationRule.create({
      data: {
        user_id: DEV_USER_ID,
        name: dto.name.trim(),
        trigger_income_type: this.normalizeTriggerIncomeType(
          dto.trigger_income_type,
        ),
        is_active: dto.is_active ?? true,
        lines: {
          create: dto.lines.map((line, index) => this.lineData(line, index)),
        },
      },
      include: this.includeRuleRelations(),
    });
  }

  findAll() {
    return this.prisma.allocationRule.findMany({
      where: { user_id: DEV_USER_ID },
      orderBy: [{ is_active: 'desc' }, { created_at: 'desc' }],
      include: this.includeRuleRelations(),
    });
  }

  async update(id: string, dto: UpdateAllocationRuleDto) {
    await this.validateRuleDto(dto);

    const existing = await this.prisma.allocationRule.findFirst({
      where: { id, user_id: DEV_USER_ID },
    });
    if (!existing) {
      throw new NotFoundException('Allocation rule not found');
    }

    await this.prisma.allocationRule.update({
      where: { id },
      data: {
        name: dto.name.trim(),
        trigger_income_type: this.normalizeTriggerIncomeType(
          dto.trigger_income_type,
        ),
        is_active: dto.is_active ?? true,
      },
    });
    await this.prisma.allocationRuleLine.deleteMany({ where: { rule_id: id } });
    await this.prisma.allocationRuleLine.createMany({
      data: dto.lines.map((line, index) => ({
        rule_id: id,
        ...this.lineData(line, index),
      })),
    });

    return this.prisma.allocationRule.findUnique({
      where: { id },
      include: this.includeRuleRelations(),
    });
  }

  private async requireIncome(incomeId: string) {
    const normalizedIncomeId = this.normalizeRequiredId(
      incomeId,
      'income_id',
    );
    const income = await this.prisma.income.findFirst({
      where: { id: normalizedIncomeId, user_id: DEV_USER_ID },
    });
    if (!income) {
      throw new NotFoundException('Income not found');
    }
    return income;
  }

  private findMatchingRules(income: { income_type: string }, ruleId?: string) {
    const normalizedRuleId = this.normalizeOptionalId(ruleId);
    return this.prisma.allocationRule.findMany({
      where: {
        user_id: DEV_USER_ID,
        is_active: true,
        id: normalizedRuleId,
        OR: [
          { trigger_income_type: null },
          { trigger_income_type: income.income_type },
        ],
      },
      orderBy: { created_at: 'asc' },
      include: this.includeRuleRelations(),
    });
  }

  private roundMoney(value: number): number {
    return Math.round(value * 100) / 100;
  }

  private previewLine(line: RuleWithLines['lines'][number], incomeAmount: number) {
    const mode = line.mode;
    const amount =
      mode === 'FIXED'
        ? toMoneyNumber(line.amount?.toString() ?? 0)
        : this.roundMoney(
            (incomeAmount * toMoneyNumber(line.percent?.toString() ?? 0)) / 100,
          );

    return {
      category_id: line.category_id,
      category_name: line.category.name,
      mode,
      amount,
      percent: line.percent == null ? null : toMoneyNumber(line.percent.toString()),
    };
  }

  private buildPreviewRule(
    rule: RuleWithLines,
    incomeAmount: number,
    alreadyAllocated: number,
  ): PreviewRule {
    const lines = rule.lines.map((line) => this.previewLine(line, incomeAmount));
    const total = lines.reduce((sum, line) => sum + line.amount, 0);
    const remainingAfterApply = incomeAmount - alreadyAllocated - total;

    return {
      rule: {
        id: rule.id,
        name: rule.name,
        trigger_income_type: rule.trigger_income_type,
      },
      lines,
      total,
      remainingAfterApply,
      exceedsRemaining: remainingAfterApply < 0,
    };
  }

  async preview(incomeId: string, ruleId?: string) {
    const normalizedIncomeId = this.normalizeRequiredId(
      incomeId,
      'income_id',
    );
    const income = await this.requireIncome(incomeId);
    const incomeAmount = toMoneyNumber(income.amount.toString());
    const allocations = await this.prisma.allocation.findMany({
      where: { income_id: normalizedIncomeId },
    });
    const alreadyAllocated = sumPrismaMoneyAmounts(allocations);
    const rules = await this.findMatchingRules(income, ruleId);

    return {
      income: {
        id: income.id,
        amount: incomeAmount,
        income_type: income.income_type,
        status: income.status,
      },
      alreadyAllocated,
      rules: rules.map((rule) =>
        this.buildPreviewRule(rule, incomeAmount, alreadyAllocated),
      ),
    };
  }

  private allocationRowsForPreviewLines(
    income: Awaited<ReturnType<AllocationRuleService['requireIncome']>>,
    lines: readonly PreviewLine[],
  ) {
    return lines
      .filter((line) => line.amount > 0)
      .map((line) => ({
        user_id: DEV_USER_ID,
        income_id: income.id,
        category_id: line.category_id,
        amount: line.amount,
        type: DEFAULT_ALLOCATION_TYPE,
        period_month: income.period_month,
      }));
  }

  async apply(dto: ApplyAllocationRuleDto) {
    const income = await this.requireIncome(dto.income_id);
    if (income.status !== 'RECEIVED') {
      throw new BadRequestException('Expected income cannot be allocated');
    }

    const preview = await this.preview(dto.income_id, dto.rule_id);
    const normalizedRuleId = this.normalizeOptionalId(dto.rule_id);
    const rulesToApply = normalizedRuleId
      ? preview.rules.filter((rule) => rule.rule.id === normalizedRuleId)
      : preview.rules;

    if (rulesToApply.length === 0) {
      throw new BadRequestException('No matching allocation rules');
    }

    const lines = rulesToApply.flatMap((rule) => rule.lines);
    const total = lines.reduce((sum, line) => sum + line.amount, 0);
    const incomeAmount = toMoneyNumber(income.amount.toString());

    if (preview.alreadyAllocated + total > incomeAmount) {
      throw new BadRequestException('Allocation rules exceed income amount');
    }

    const allocationRows = this.allocationRowsForPreviewLines(income, lines);
    if (allocationRows.length === 0) {
      throw new BadRequestException('Allocation rules produced no allocations');
    }

    await this.prisma.allocation.createMany({ data: allocationRows });

    const periodMonth = income.period_month.toISOString().slice(0, 7);
    await this.budgetMonthService.rebuildFrom(income.user_id, periodMonth);

    return this.prisma.allocation.findMany({
      where: { income_id: income.id },
      include: { category: true, income: true },
      orderBy: { created_at: 'desc' },
    });
  }
}
