import React, { useEffect, useState } from 'react';
import { i18n } from '@osd/i18n';
import {
  EuiBasicTable,
  EuiBasicTableColumn,
  EuiButtonIcon,
  Criteria,
  EuiFieldSearch,
  EuiFilterButton,
  EuiFilterGroup,
  EuiFlexGroup,
  EuiFlexItem,
  EuiPanel,
  EuiSpacer,
  EuiText,
  EuiTitle,
} from '@elastic/eui';
import {
  CATALOG_FILTER_MAX_LENGTH,
  CATALOG_MAX_FROM,
  CATALOG_PAGE_SIZE,
  CatalogIndicator,
  INDICATOR_CATALOG_INDEX,
  INDICATOR_TYPES,
  IndicatorType,
} from '../../../../common/cti-catalog';
import { searchIndicators } from '../../../services/cti-catalog';
import { formatCtiTimestamp } from '../../../services/cti-timestamp';
import { useCatalogRequest } from '../hooks/use-catalog-request';
import {
  getFamilyLabel,
  getIndicatorTypeLabel,
  getProviderLabel,
  getRoleLabel,
} from './catalog-labels';
import {
  CatalogErrorCallOut,
  FilterChip,
  PageCapNote,
  RefreshButton,
} from './catalog-shared';
import type { IndicatorFilters } from './indicator-summary';

/** Rows reachable by paging: the last page starts at the `from` cap. */
const BROWSABLE_ROWS = CATALOG_MAX_FROM + CATALOG_PAGE_SIZE;

/**
 * Newest-first list of the indicator catalog. Filters are exact values from
 * the summary breakdowns, plus a "starts with" on the indicator value: an
 * anchored prefix, not a text search.
 */
export const IndicatorBrowser: React.FC<{
  filters: IndicatorFilters;
  onFiltersChange: (filters: IndicatorFilters) => void;
  onOpen: (indicator: CatalogIndicator) => void;
}> = ({ filters, onFiltersChange, onOpen }) => {
  const [prefixInput, setPrefixInput] = useState(filters.prefix ?? '');
  const filtersKey = JSON.stringify(filters);
  // The page belongs to one set of filters: a new filter starts again from the
  // newest records, without first fetching the old page.
  const [paging, setPaging] = useState({ filtersKey, page: 0 });
  const page = paging.filtersKey === filtersKey ? paging.page : 0;
  const setPage = (next: number) => setPaging({ filtersKey, page: next });

  useEffect(() => setPrefixInput(filters.prefix ?? ''), [filters.prefix]);

  const { data, error, loading, reload } = useCatalogRequest(
    signal => searchIndicators({ ...filters, page }, signal),
    [filtersKey, page],
  );

  const setFilter = (patch: Partial<IndicatorFilters>) =>
    onFiltersChange({ ...filters, ...patch });

  const columns: Array<EuiBasicTableColumn<CatalogIndicator>> = [
    {
      width: '40px',
      render: (indicator: CatalogIndicator) => (
        <EuiButtonIcon
          iconType='inspect'
          onClick={() => onOpen(indicator)}
          aria-label={i18n.translate(
            'wazuhCheckUpdates.ctiCatalog.browse.open',
            {
              defaultMessage: 'View the record of {value}',
              values: { value: indicator.name },
            },
          )}
          data-test-subj='ctiCatalogIndicatorRowOpen'
        />
      ),
    },
    {
      field: 'name',
      name: i18n.translate('wazuhCheckUpdates.ctiCatalog.browse.indicator', {
        defaultMessage: 'Indicator',
      }),
      width: '36%',
      // Plain text: a malicious URL must not look like something to click.
      render: (name: string) => (
        <span
          className='ctiCatalog__value ctiCatalog__value--truncate'
          title={name}
        >
          {name}
        </span>
      ),
    },
    {
      field: 'type',
      name: i18n.translate('wazuhCheckUpdates.ctiCatalog.browse.type', {
        defaultMessage: 'Type',
      }),
      render: (type: string) => getIndicatorTypeLabel(type),
    },
    {
      field: 'provider',
      name: i18n.translate('wazuhCheckUpdates.ctiCatalog.browse.provider', {
        defaultMessage: 'Provider',
      }),
      render: (provider: string) => getProviderLabel(provider),
    },
    {
      field: 'software',
      name: i18n.translate('wazuhCheckUpdates.ctiCatalog.browse.malware', {
        defaultMessage: 'Malware',
      }),
      render: (software: CatalogIndicator['software']) =>
        software?.name ? (
          <span>
            {getFamilyLabel(software.name)}
            {software.type ? (
              <EuiText size='xs' color='subdued'>
                {getRoleLabel(software.type)}
              </EuiText>
            ) : null}
          </span>
        ) : (
          '-'
        ),
    },
    {
      field: 'confidence',
      name: i18n.translate('wazuhCheckUpdates.ctiCatalog.browse.confidence', {
        defaultMessage: 'Confidence',
      }),
      width: '96px',
      align: 'right',
      render: (confidence?: number) => confidence ?? '-',
    },
    {
      field: 'firstSeen',
      name: i18n.translate('wazuhCheckUpdates.ctiCatalog.browse.firstSeen', {
        defaultMessage: 'First seen',
      }),
      render: (firstSeen?: string) => formatCtiTimestamp(firstSeen),
    },
  ];

  const typeButton = (type: IndicatorType | undefined, label: string) => (
    <EuiFilterButton
      key={type ?? 'all'}
      hasActiveFilters={filters.type === type}
      onClick={() => setFilter({ type })}
      data-test-subj={`ctiCatalogIndicatorTypeFilter-${type ?? 'all'}`}
    >
      {label}
    </EuiFilterButton>
  );

  const chips = [
    filters.provider && {
      key: 'provider',
      label: i18n.translate(
        'wazuhCheckUpdates.ctiCatalog.browse.chip.provider',
        {
          defaultMessage: 'Provider: {value}',
          values: { value: getProviderLabel(filters.provider) },
        },
      ),
      onRemove: () => setFilter({ provider: undefined }),
    },
    filters.role && {
      key: 'role',
      label: i18n.translate('wazuhCheckUpdates.ctiCatalog.browse.chip.role', {
        defaultMessage: 'Role: {value}',
        values: { value: getRoleLabel(filters.role) },
      }),
      onRemove: () => setFilter({ role: undefined }),
    },
    filters.family && {
      key: 'family',
      label: i18n.translate('wazuhCheckUpdates.ctiCatalog.browse.chip.family', {
        defaultMessage: 'Malware: {value}',
        values: { value: getFamilyLabel(filters.family) },
      }),
      onRemove: () => setFilter({ family: undefined }),
    },
  ].filter(Boolean) as Array<{
    key: string;
    label: string;
    onRemove: () => void;
  }>;

  const total = data?.total ?? 0;

  return (
    <EuiPanel
      hasBorder
      paddingSize='l'
      data-test-subj='ctiCatalogIndicatorBrowser'
    >
      <EuiFlexGroup
        justifyContent='spaceBetween'
        alignItems='center'
        responsive={false}
      >
        <EuiFlexItem>
          <EuiTitle size='xs'>
            <h2>
              {i18n.translate('wazuhCheckUpdates.ctiCatalog.browse.title', {
                defaultMessage: 'Browse indicators',
              })}
            </h2>
          </EuiTitle>
          <EuiText size='s' color='subdued'>
            {i18n.translate('wazuhCheckUpdates.ctiCatalog.browse.description', {
              defaultMessage: 'Newest first by first-seen date.',
            })}
          </EuiText>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <RefreshButton
            onClick={reload}
            isLoading={loading}
            data-test-subj='ctiCatalogIndicatorBrowserRefresh'
          />
        </EuiFlexItem>
      </EuiFlexGroup>
      <EuiSpacer size='m' />
      <EuiFlexGroup gutterSize='m' alignItems='center' wrap>
        <EuiFlexItem grow={false}>
          <EuiFilterGroup>
            {typeButton(
              undefined,
              i18n.translate('wazuhCheckUpdates.ctiCatalog.browse.allTypes', {
                defaultMessage: 'All',
              }),
            )}
            {INDICATOR_TYPES.map(type =>
              typeButton(type, getIndicatorTypeLabel(type)),
            )}
          </EuiFilterGroup>
        </EuiFlexItem>
        <EuiFlexItem style={{ minWidth: 240 }}>
          <EuiFieldSearch
            fullWidth
            value={prefixInput}
            maxLength={CATALOG_FILTER_MAX_LENGTH}
            onChange={event => setPrefixInput(event.target.value)}
            onSearch={text =>
              setFilter({ prefix: text.trim() ? text.trim() : undefined })
            }
            isClearable
            placeholder={i18n.translate(
              'wazuhCheckUpdates.ctiCatalog.browse.prefixPlaceholder',
              { defaultMessage: 'Starts with… (press Enter)' },
            )}
            aria-label={i18n.translate(
              'wazuhCheckUpdates.ctiCatalog.browse.prefixAriaLabel',
              {
                defaultMessage:
                  'Show indicators whose value starts with this text',
              },
            )}
            data-test-subj='ctiCatalogIndicatorPrefix'
          />
        </EuiFlexItem>
      </EuiFlexGroup>
      {chips.length > 0 ? (
        <>
          <EuiSpacer size='s' />
          <EuiFlexGroup gutterSize='xs' wrap responsive={false}>
            {chips.map(chip => (
              <EuiFlexItem grow={false} key={chip.key}>
                <FilterChip
                  label={chip.label}
                  onRemove={chip.onRemove}
                  data-test-subj={`ctiCatalogIndicatorChip-${chip.key}`}
                />
              </EuiFlexItem>
            ))}
          </EuiFlexGroup>
        </>
      ) : null}
      <EuiSpacer size='m' />
      {error ? (
        <CatalogErrorCallOut
          error={error}
          index={INDICATOR_CATALOG_INDEX}
          onRetry={reload}
          data-test-subj='ctiCatalogIndicatorBrowserError'
        />
      ) : (
        <>
          <EuiBasicTable<CatalogIndicator>
            items={data?.items ?? []}
            itemId='id'
            columns={columns}
            loading={loading}
            tableLayout='auto'
            noItemsMessage={
              loading
                ? i18n.translate(
                    'wazuhCheckUpdates.ctiCatalog.browse.loading',
                    {
                      defaultMessage: 'Loading indicators…',
                    },
                  )
                : i18n.translate('wazuhCheckUpdates.ctiCatalog.browse.empty', {
                    defaultMessage: 'No indicator matches these filters.',
                  })
            }
            pagination={{
              pageIndex: page,
              pageSize: CATALOG_PAGE_SIZE,
              totalItemCount: Math.min(total, BROWSABLE_ROWS),
              hidePerPageOptions: true,
            }}
            onChange={({ page: next }: Criteria<CatalogIndicator>) =>
              next && setPage(next.index)
            }
            data-test-subj='ctiCatalogIndicatorTable'
          />
          <PageCapNote total={total} shown={BROWSABLE_ROWS} />
        </>
      )}
    </EuiPanel>
  );
};
