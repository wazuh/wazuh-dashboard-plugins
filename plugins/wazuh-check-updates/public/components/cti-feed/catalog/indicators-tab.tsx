import React, { useRef, useState } from 'react';
import { EuiSpacer } from '@elastic/eui';
import type { CatalogIndicator } from '../../../../common/cti-catalog';
import { fetchIndicatorCatalogSummary } from '../../../services/cti-catalog';
import { useCatalogRequest } from '../hooks/use-catalog-request';
import { IndicatorBrowser } from './indicator-browser';
import { IndicatorFlyout, IndicatorPivot } from './indicator-flyout';
import { IndicatorLookup } from './indicator-lookup';
import { IndicatorFilters, IndicatorSummary } from './indicator-summary';

/**
 * The indicator catalog (`wazuh-threatintel-enrichments`): check one value,
 * see what the catalog holds, and browse it.
 */
export const IndicatorsTab: React.FC<{
  onOpenVulnerability: (id: string) => void;
}> = ({ onOpenVulnerability }) => {
  const [filters, setFilters] = useState<IndicatorFilters>({});
  const [selected, setSelected] = useState<CatalogIndicator | null>(null);
  const browserRef = useRef<HTMLDivElement>(null);
  const summary = useCatalogRequest(
    signal => fetchIndicatorCatalogSummary(signal),
    [],
  );

  const showBrowser = () =>
    browserRef.current?.scrollIntoView?.({
      behavior: 'smooth',
      block: 'start',
    });

  /** Selecting the active value again clears it. */
  const toggleFilter = (filter: keyof IndicatorFilters, value: string) => {
    // Breakdown keys come from the catalog, so a type key is a known type.
    setFilters(
      current =>
        ({
          ...current,
          [filter]: current[filter] === value ? undefined : value,
        } as IndicatorFilters),
    );
    showBrowser();
  };

  const pivot = (next: IndicatorPivot) => {
    setFilters(next);
    setSelected(null);
    showBrowser();
  };

  return (
    <>
      <IndicatorLookup
        onOpen={setSelected}
        onOpenVulnerability={onOpenVulnerability}
      />
      <EuiSpacer size='l' />
      <IndicatorSummary
        summary={summary.data}
        loading={summary.loading}
        error={summary.error}
        onReload={summary.reload}
        filters={filters}
        onFilter={toggleFilter}
      />
      <EuiSpacer size='l' />
      <div ref={browserRef}>
        <IndicatorBrowser
          filters={filters}
          onFiltersChange={setFilters}
          onOpen={setSelected}
        />
      </div>
      {selected ? (
        <IndicatorFlyout
          indicator={selected}
          onClose={() => setSelected(null)}
          onPivot={pivot}
        />
      ) : null}
    </>
  );
};
