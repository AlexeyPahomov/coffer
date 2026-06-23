import type { EnvelopeForecast } from '../lib/buildEnvelopeForecast';
import {
  formatEnvelopeForecastAmount,
  type EnvelopeForecastAmountTone,
} from '../lib/formatEnvelopeForecastAmount';

import { CategoryNameWithIcon } from '@/entities/category/ui/CategoryNameWithIcon';
import { cn } from '@/shared/lib/utils';
import { InfoHint } from '@/shared/ui';
import { infoHintTitleTextClassName } from '@/shared/ui/info-hint/infoHintLayout';

type PlanningEnvelopeForecastSectionProps = {
  forecast: EnvelopeForecast;
};

function ForecastAmount({
  label,
  value,
  tone = 'default',
}: {
  label: string;
  value: number;
  tone?: EnvelopeForecastAmountTone;
}) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-zinc-500">{label}</p>
      <p
        className={cn(
          'mt-0.5 font-semibold tabular-nums',
          tone === 'forecast' && 'text-green',
          tone === 'planned' && 'text-amber-700',
          tone === 'total' && 'text-zinc-900',
          tone === 'default' && 'text-zinc-700',
        )}
      >
        {formatEnvelopeForecastAmount(value, tone)}
      </p>
    </div>
  );
}

export function PlanningEnvelopeForecastSection({
  forecast,
}: PlanningEnvelopeForecastSectionProps) {
  return (
    <section className="rounded-xl border border-zinc-200/80 bg-white shadow-sm">
      <div className="flex items-start justify-between gap-3 border-b border-zinc-100 px-4 py-3">
        <div className="min-w-0">
          <h2
            className={cn(
              'text-sm font-medium text-zinc-900 sm:text-base',
              infoHintTitleTextClassName,
            )}
          >
            Прогноз конвертов
          </h2>
        </div>
        <InfoHint label="Прогноз конвертов" align="end" className="shrink-0">
          <div className="space-y-2 text-sm text-zinc-600">
            <p>
              Это read-only прогноз: ожидаемые доходы подставляются в активные
              правила распределения, но реальные остатки конвертов не меняются.
              Планы с категорией уменьшают прогноз конверта; без категории —
              свободный пул.
            </p>
            {forecast.unmatchedIncomeCount > 0 ? (
              <p>
                Доходов без подходящего правила: {forecast.unmatchedIncomeCount}
                .
              </p>
            ) : null}
            {forecast.warnings.length > 0 ? (
              <p>
                Есть правила, сумма которых больше дохода. В прогнозе такие
                распределения пропорционально ограничены суммой дохода.
              </p>
            ) : null}
          </div>
        </InfoHint>
      </div>

      {forecast.items.length === 0 ? (
        <p className="px-4 py-3 text-sm text-zinc-500">
          Нет прогнозных распределений и планов по конвертам.
        </p>
      ) : (
        <div className="grid gap-2 p-3 sm:grid-cols-3 xl:grid-cols-5">
          {forecast.items.map((item) => (
            <article
              key={item.category.id}
              className="rounded-xl border border-zinc-100 bg-zinc-50/70 p-3"
            >
              <CategoryNameWithIcon
                category={item.category}
                className="text-sm font-semibold text-zinc-900"
              />
              <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
                <ForecastAmount label="сейчас" value={item.currentRemaining} />
                <ForecastAmount
                  label="ожидается"
                  value={item.forecastAmount}
                  tone="forecast"
                />
                {item.plannedAmount > 0 ? (
                  <ForecastAmount
                    label="планы"
                    value={item.plannedAmount}
                    tone="planned"
                  />
                ) : null}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
