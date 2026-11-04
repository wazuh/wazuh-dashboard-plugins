import React, { useState } from 'react';
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
  VULNERABILITY_CATALOG_INDEX,
  VulnerabilityCatalogSummary,
} from '../../../../common/cti-catalog';
import { fetchVulnerabilityCatalogSummary } from '../../../services/cti-catalog';
import { useCatalogRequest } from '../hooks/use-catalog-request';
import {
  CatalogErrorCallOut,
  RefreshButton,
  numberFormat,
} from './catalog-shared';
import { VulnerabilityBrowser } from './vulnerability-browser';
import { VulnerabilityFlyout } from './vulnerability-flyout';
import {
  VulnerabilityLookup,
  VulnerabilityLookupRequest,
} from './vulnerability-lookup';

const countOf = (summary: VulnerabilityCatalogSummary, type: string) =>
  summary.byType.find(bucket => bucket.key === type)?.count ?? 0;

const SummaryPanel: React.FC = () => {
  const { data, error, loading, reload } = useCatalogRequest(
    signal => fetchVulnerabilityCatalogSummary(signal),
    [],
  );
  const cves = data ? countOf(data, 'CVE') : 0;
  const tids = data ? countOf(data, 'TID') : 0;
  const stats = [
    {
      key: 'total',
      value: data?.total,
      label: i18n.translate(
        'wazuhCheckUpdates.ctiCatalog.vulnerabilities.stat.total',
        { defaultMessage: 'Records' },
      ),
    },
    {
      key: 'cve',
      value: data ? cves : undefined,
      label: i18n.translate(
        'wazuhCheckUpdates.ctiCatalog.vulnerabilities.stat.cve',
        { defaultMessage: 'CVE records' },
      ),
    },
    {
      key: 'tid',
      value: data ? tids : undefined,
      label: i18n.translate(
        'wazuhCheckUpdates.ctiCatalog.vulnerabilities.stat.tid',
        { defaultMessage: 'Translation rules (TID)' },
      ),
    },
    {
      key: 'metadata',
      value: data ? data.total - cves - tids : undefined,
      label: i18n.translate(
        'wazuhCheckUpdates.ctiCatalog.vulnerabilities.stat.metadata',
        { defaultMessage: 'Catalog metadata documents' },
      ),
    },
  ];

  return (
    <EuiPanel
      hasBorder
      paddingSize='l'
      data-test-subj='ctiCatalogVulnerabilitySummary'
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
                'wazuhCheckUpdates.ctiCatalog.vulnerabilities.summary.title',
                { defaultMessage: 'Vulnerability catalog' },
              )}
            </h2>
          </EuiTitle>
          <EuiText size='s' color='subdued'>
            {i18n.translate(
              'wazuhCheckUpdates.ctiCatalog.vulnerabilities.summary.description',
              {
                defaultMessage:
                  'The CVE records vulnerability detection scores installed packages against, and the rules that translate package names. It is reference knowledge: it does not say which endpoints are affected.',
              },
            )}
          </EuiText>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <RefreshButton
            onClick={reload}
            isLoading={loading}
            data-test-subj='ctiCatalogVulnerabilitySummaryRefresh'
          />
        </EuiFlexItem>
      </EuiFlexGroup>
      <EuiSpacer size='m' />
      {error ? (
        <CatalogErrorCallOut
          error={error}
          index={VULNERABILITY_CATALOG_INDEX}
          onRetry={reload}
          data-test-subj='ctiCatalogVulnerabilitySummaryError'
        />
      ) : (
        <EuiFlexGroup gutterSize='m' wrap>
          {stats.map(stat => (
            <EuiFlexItem key={stat.key}>
              <EuiPanel color='subdued' hasShadow={false} paddingSize='m'>
                <EuiStat
                  title={
                    stat.value === undefined
                      ? '-'
                      : numberFormat.format(stat.value)
                  }
                  titleSize='s'
                  description={stat.label}
                  isLoading={loading}
                  reverse
                  data-test-subj={`ctiCatalogVulnerabilitiesStat-${stat.key}`}
                />
              </EuiPanel>
            </EuiFlexItem>
          ))}
        </EuiFlexGroup>
      )}
    </EuiPanel>
  );
};

/**
 * The vulnerability catalog (`.wazuh-threatintel-vulnerabilities`): open one
 * record by its id, see what the catalog holds, and list the newest records.
 */
export const VulnerabilitiesTab: React.FC<{
  lookupRequest?: VulnerabilityLookupRequest;
}> = ({ lookupRequest }) => {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <>
      <VulnerabilityLookup request={lookupRequest} onOpen={setOpenId} />
      <EuiSpacer size='l' />
      <SummaryPanel />
      <EuiSpacer size='l' />
      <VulnerabilityBrowser onOpen={setOpenId} />
      {openId ? (
        <VulnerabilityFlyout id={openId} onClose={() => setOpenId(null)} />
      ) : null}
    </>
  );
};
