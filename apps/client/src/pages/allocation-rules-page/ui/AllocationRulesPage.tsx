import { getAppRoute, appRouteNavLabel } from '@/app/config/routes';
import { AllocationRuleCard } from '@/pages/allocation-rules-page/ui/AllocationRuleCard';
import { useAllocationRulesPage } from '@/pages/allocation-rules-page/model/useAllocationRulesPage';
import { useDesktopPageSectionTitle } from '@/shared/hooks/use-desktop-page-section-title';
import { getErrorMessage } from '@/shared/lib/errors';
import { AddButton, Fab, InfoHint, ItemsList, PageSection } from '@/shared/ui';

import {
  allocationRulesListClassName,
  allocationRulesListGridClassName,
  allocationRulesPageSectionClassName,
  allocationRulesPageShellClassName,
} from '../lib/allocationRulesPageLayout';
import { AllocationRuleFormDialog } from './AllocationRuleFormDialog';

const rulesRoute = getAppRoute('rules');

function AllocationRulesListHeader({
  categoriesError,
  onAdd,
}: {
  categoriesError: string | null;
  onAdd: () => void;
}) {
  return (
    <div className="flex flex-col gap-2 px-2">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <h2 className="truncate text-base font-semibold text-zinc-900">
            Шаблоны будущих распределений
          </h2>
          <InfoHint label="Шаблоны будущего распределения" align="start">
            Это ещё не деньги в конвертах. Правило создаёт реальные
            распределения только после применения к полученному доходу.
          </InfoHint>
        </div>
        <AddButton
          type="button"
          className="hidden md:inline-flex"
          onClick={onAdd}
        >
          Добавить правило
        </AddButton>
      </div>
      {categoriesError ? (
        <p className="text-sm text-destructive">{categoriesError}</p>
      ) : null}
    </div>
  );
}

export function AllocationRulesPage() {
  const pageTitle = useDesktopPageSectionTitle(appRouteNavLabel(rulesRoute));
  const page = useAllocationRulesPage();
  const { data, isPending, isError, error } = page.rulesQuery;
  const categoriesError = page.categoriesQuery.isError
    ? getErrorMessage(
        page.categoriesQuery.error,
        'Не удалось загрузить категории',
      )
    : null;

  return (
    <PageSection
      title={pageTitle}
      className={allocationRulesPageSectionClassName}
    >
      <div className={allocationRulesPageShellClassName}>
        <ItemsList
          className={allocationRulesListClassName}
          layout="fit"
          data={data}
          isPending={isPending}
          isError={isError}
          error={error}
          isFetching={page.rulesQuery.isFetching}
          showPendingLoader
          emptyMessage="Пока нет правил распределения. Добавьте первое правило."
          errorFallback="Не удалось загрузить правила"
          headerAddon={
            <AllocationRulesListHeader
              categoriesError={categoriesError}
              onAdd={page.fab.onClick}
            />
          }
          listClassName={allocationRulesListGridClassName}
          listAnimateEnter={false}
        >
          {(items) =>
            items.map((rule) => (
              <li key={rule.id} className="min-w-0">
                <AllocationRuleCard
                  rule={rule}
                  onEdit={page.onEditRule}
                  onDelete={page.onDeleteRule}
                  isDeleting={
                    page.deleteRuleMutation.isPending &&
                    page.deleteRuleMutation.variables === rule.id
                  }
                />
              </li>
            ))
          }
        </ItemsList>
      </div>

      <Fab label={page.fab.label} onClick={page.fab.onClick} />

      <AllocationRuleFormDialog {...page.formDialog} />
    </PageSection>
  );
}
