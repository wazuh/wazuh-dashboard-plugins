import React from 'react';
import { i18n } from '@osd/i18n';
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiPanel,
  EuiSpacer,
  EuiStat,
  EuiText,
  EuiTitle,
} from '@elastic/eui';
import {
  CatalogBucket,
  INDICATOR_CATALOG_INDEX,
  IndicatorCatalogSummary,
  IndicatorSearchRequest,
} from '../../../../common/cti-catalog';
import type { CatalogRequestError } from '../../../services/cti-catalog';
import {
  getFamilyLabel,
  getIndicatorTypeLabel,
  getProviderLabel,
  getRoleLabel,
} from './catalog-labels';
import {
  BreakdownList,
  CatalogErrorCallOut,
  RefreshButton,
  numberFormat,
} from './catalog-shared';
import { FirstSeenChart } from './first-seen-chart';

export type IndicatorFilters = Omit<IndicatorSearchRequest, 'page'>;
type BreakdownFilter = 'type' | 'provider' | 'role' | 'family';

const confidenceFormat = new Intl.NumberFormat(undefined, {
  maximumFractionDigits: 1,
});

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({
  title,
  children,
}) => (
  <EuiPanel color='subdued' hasShadow={false} paddingSize='m'>
    <EuiTitle size='xxs'>
      <h3>{title}</h3>
    </EuiTitle>
    <EuiSpacer size='s' />
    {children}
  </EuiPanel>
);

const Stat: React.FC<{
  value: string;
  label: string;
  loading: boolean;
  testSubj: string;
}> = ({ value, label, loading, testSubj }) => (
  <EuiFlexItem>
    <EuiPanel color='subdued' hasShadow={false} paddingSize='m'>
      <EuiStat
        title={value}
        titleSize='s'
        description={label}
        isLoading={loading}
        reverse
        data-test-subj={testSubj}
      />
    </EuiPanel>
  </EuiFlexItem>
);

/**
 * Totals and breakdowns of the indicator catalog, all aggregations computed
 * when the tab opens. Selecting a value in a breakdown filters the browser.
 */
export const IndicatorSummary: React.FC<{
  summary: IndicatorCatalogSummary | null;
  loading: boolean;
  error: CatalogRequestError | null;
  onReload: () => void;
  filters: IndicatorFilters;
  onFilter: (filter: BreakdownFilter, value: string) => void;
}> = ({ summary, loading, error, onReload, filters, onFilter }) => {
  const toItems = (
    buckets: CatalogBucket[] | undefined,
    label: (key: string) => string,
  ) =>
    (buckets ?? []).map(bucket => ({
      key: bucket.key,
      label: label(bucket.key),
      count: bucket.count,
    }));
  const selectLabel = (label: string) =>
    i18n.translate('wazuhCheckUpdates.ctiCatalog.indicators.filterBy', {
      defaultMessage: 'Browse indicators: {label}',
      values: { label },
    });

  const breakdown = (
    filter: BreakdownFilter,
    buckets: CatalogBucket[] | undefined,
    label: (key: string) => string,
  ) => (
    <BreakdownList
      items={toItems(buckets, label)}
      selected={filters[filter]}
      onSelect={key => onFilter(filter, key)}
      selectLabel={selectLabel}
      data-test-subj={`ctiCatalogIndicatorsBy-${filter}`}
    />
  );

  const format = (value: number | undefined) =>
    summary && value !== undefined ? numberFormat.format(value) : '-';

  return (
    <EuiPanel
      hasBorder
      paddingSize='l'
      data-test-subj='ctiCatalogIndicatorSummary'
    >
      <EuiFlexGroup
        justifyContent='spaceBetween'
        alignItems='flexStart'
        responsive={false}
      >
        <EuiFlexItem>
          <EuiTitle size='xs'>
            <h2>
              {i18n.translate(
                'wazuhCheckUpdates.ctiCatalog.indicators.summary.title',
                { defaultMessage: 'Indicator catalog' },
              )}
            </h2>
          </EuiTitle>
          <EuiText size='s' color='subdued'>
            {i18n.translate(
              'wazuhCheckUpdates.ctiCatalog.indicators.summary.description',
              {
                defaultMessage:
                  'Known-malicious domains, URLs, host:port pairs and file hashes, each published by a named provider. A record is feed knowledge: it is not evidence that the value was seen on your endpoints.',
              },
            )}
          </EuiText>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <RefreshButton
            onClick={onReload}
            isLoading={loading}
            data-test-subj='ctiCatalogIndicatorSummaryRefresh'
          />
        </EuiFlexItem>
      </EuiFlexGroup>
      <EuiSpacer size='m' />
      {error ? (
        <CatalogErrorCallOut
          error={error}
          index={INDICATOR_CATALOG_INDEX}
          onRetry={onReload}
          data-test-subj='ctiCatalogIndicatorSummaryError'
        />
      ) : (
        <>
          <EuiFlexGroup gutterSize='m' wrap>
            <Stat
              value={format(summary?.total)}
              label={i18n.translate(
                'wazuhCheckUpdates.ctiCatalog.indicators.stat.total',
                { defaultMessage: 'Records' },
              )}
              loading={loading}
              testSubj='ctiCatalogIndicatorsStat-total'
            />
            <Stat
              value={format(summary?.firstSeenLast30Days)}
              label={i18n.translate(
                'wazuhCheckUpdates.ctiCatalog.indicators.stat.last30Days',
                { defaultMessage: 'First seen in the last 30 days' },
              )}
              loading={loading}
              testSubj='ctiCatalogIndicatorsStat-last30Days'
            />
            <Stat
              value={format(summary?.providers)}
              label={i18n.translate(
                'wazuhCheckUpdates.ctiCatalog.indicators.stat.providers',
                { defaultMessage: 'Providers' },
              )}
              loading={loading}
              testSubj='ctiCatalogIndicatorsStat-providers'
            />
            <Stat
              value={format(summary?.families)}
              label={i18n.translate(
                'wazuhCheckUpdates.ctiCatalog.indicators.stat.families',
                { defaultMessage: 'Malware families' },
              )}
              loading={loading}
              testSubj='ctiCatalogIndicatorsStat-families'
            />
            <Stat
              value={
                summary?.averageConfidence === null ||
                summary?.averageConfidence === undefined
                  ? '-'
                  : confidenceFormat.format(summary.averageConfidence)
              }
              label={i18n.translate(
                'wazuhCheckUpdates.ctiCatalog.indicators.stat.confidence',
                { defaultMessage: 'Average confidence (0-100)' },
              )}
              loading={loading}
              testSubj='ctiCatalogIndicatorsStat-confidence'
            />
          </EuiFlexGroup>
          {summary ? (
            <>
              <EuiSpacer size='m' />
              <EuiFlexGroup gutterSize='m'>
                <EuiFlexItem grow={2}>
                  <Section
                    title={i18n.translate(
                      'wazuhCheckUpdates.ctiCatalog.indicators.histogram.title',
                      {
                        defaultMessage:
                          'Records first seen per month, last 18 months',
                      },
                    )}
                  >
                    <FirstSeenChart buckets={summary.firstSeenByMonth} />
                  </Section>
                </EuiFlexItem>
                <EuiFlexItem grow={1}>
                  <Section
                    title={i18n.translate(
                      'wazuhCheckUpdates.ctiCatalog.indicators.byType',
                      { defaultMessage: 'By type' },
                    )}
                  >
                    {breakdown('type', summary.byType, getIndicatorTypeLabel)}
                  </Section>
                </EuiFlexItem>
              </EuiFlexGroup>
              <EuiSpacer size='m' />
              <EuiFlexGroup gutterSize='m'>
                <EuiFlexItem>
                  <Section
                    title={i18n.translate(
                      'wazuhCheckUpdates.ctiCatalog.indicators.byProvider',
                      { defaultMessage: 'By provider' },
                    )}
                  >
                    {breakdown(
                      'provider',
                      summary.byProvider,
                      getProviderLabel,
                    )}
                  </Section>
                </EuiFlexItem>
                <EuiFlexItem>
                  <Section
                    title={i18n.translate(
                      'wazuhCheckUpdates.ctiCatalog.indicators.byRole',
                      { defaultMessage: 'By malware role' },
                    )}
                  >
                    {breakdown('role', summary.byRole, getRoleLabel)}
                  </Section>
                </EuiFlexItem>
                <EuiFlexItem>
                  <Section
                    title={i18n.translate(
                      'wazuhCheckUpdates.ctiCatalog.indicators.topFamilies',
                      { defaultMessage: 'Top malware families' },
                    )}
                  >
                    {breakdown('family', summary.topFamilies, getFamilyLabel)}
                  </Section>
                </EuiFlexItem>
              </EuiFlexGroup>
              <EuiSpacer size='s' />
              <EuiText size='xs' color='subdued'>
                {i18n.translate(
                  'wazuhCheckUpdates.ctiCatalog.indicators.breakdownHint',
                  {
                    defaultMessage:
                      'Select a value in a breakdown to browse its records below.',
                  },
                )}
              </EuiText>
            </>
          ) : null}
        </>
      )}
    </EuiPanel>
  );
};
