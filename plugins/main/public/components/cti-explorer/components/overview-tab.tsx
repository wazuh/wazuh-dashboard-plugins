import React from 'react';
import { i18n } from '@osd/i18n';
import {
  EuiButtonEmpty,
  EuiFlexGroup,
  EuiFlexItem,
  EuiIcon,
  EuiLink,
  EuiPanel,
  EuiSpacer,
  EuiStat,
  EuiText,
  EuiTitle,
  EuiToolTip,
} from '@elastic/eui';
import {
  CTI_RECENT_DAYS,
  CveSeverityFilter,
  VulnerabilityRecordType,
} from '../../../../common/cti-explorer/constants';
import type { CvssSeverity } from '../../../../common/cti-explorer/cve-record';
import type {
  IocFilters,
  IocSummaryResponse,
  VulnerabilitySummaryResponse,
} from '../../../../common/cti-explorer/types';
import { CtiRequestState, useCtiRequest } from '../hooks/use-cti-request';
import {
  DetectionContentKey,
  fetchDetectionContentCounts,
} from '../services/cti-explorer-api';
import { formatNumber, getIocTypeLabel } from '../utils/labels';
import { getRulesetPageUrl } from '../utils/navigation';
import { getCore } from '../../../kibana-services';
import { RedirectAppLinks } from '../../../../../../src/plugins/opensearch_dashboards_react/public';
import { NORMAL_FONT_WEIGHT } from '../utils/styles';
import { BreakdownList } from './breakdown-list';
import { LookupPanel } from './lookup-panel';
import { RequestErrorCallout } from './request-error-callout';
import { getSeverityColor, getSeverityLabel } from './severity-badge';

interface OverviewTabProps {
  iocSummary: CtiRequestState<IocSummaryResponse>;
  vulnerabilitySummary: CtiRequestState<VulnerabilitySummaryResponse>;
  onBrowseIocs: (filters: IocFilters) => void;
  onBrowseVulnerabilities: (
    type?: VulnerabilityRecordType,
    severities?: CveSeverityFilter[],
  ) => void;
  onOpenIoc: (id: string) => void;
  onOpenVulnerability: (id: string) => void;
}

interface StatTileProps {
  value: number | undefined;
  label: string;
  caption: string;
  loading: boolean;
  tooltip: string;
  onClick: () => void;
  testSubj: string;
}

const StatTile = ({
  value,
  label,
  caption,
  loading,
  tooltip,
  onClick,
  testSubj,
}: StatTileProps) => (
  <EuiFlexItem>
    <EuiToolTip content={tooltip} display='block'>
      <EuiPanel
        paddingSize='m'
        onClick={onClick}
        aria-label={tooltip}
        data-test-subj={`ctiExplorerStat-${testSubj}`}
      >
        <EuiStat
          title={
            <span style={NORMAL_FONT_WEIGHT}>
              {value === undefined ? '-' : formatNumber(value)}
            </span>
          }
          titleSize='m'
          titleColor='primary'
          description={label}
          isLoading={loading}
          textAlign='center'
          reverse
        >
          <EuiText size='xs' color='subdued'>
            {caption}
          </EuiText>
        </EuiStat>
      </EuiPanel>
    </EuiToolTip>
  </EuiFlexItem>
);

/** Panels side by side are as tall as the tallest one. */
const FULL_HEIGHT: React.CSSProperties = { height: '100%' };

const CURRENT_STATE = i18n.translate(
  'wazuh.ctiExplorer.overview.currentState',
  {
    defaultMessage: 'Current state',
  },
);

const DETECTION_CONTENT: Array<{ key: DetectionContentKey; label: string }> = [
  {
    key: 'rules',
    label: i18n.translate('wazuh.ctiExplorer.detectionContent.rules', {
      defaultMessage: 'rules',
    }),
  },
  {
    key: 'decoders',
    label: i18n.translate('wazuh.ctiExplorer.detectionContent.decoders', {
      defaultMessage: 'decoders',
    }),
  },
  {
    key: 'integrations',
    label: i18n.translate('wazuh.ctiExplorer.detectionContent.integrations', {
      defaultMessage: 'integrations',
    }),
  },
  {
    key: 'kvdbs',
    label: i18n.translate('wazuh.ctiExplorer.detectionContent.kvdbs', {
      defaultMessage: 'KVDBs',
    }),
  },
];

/**
 * The third content of the feed, besides IOCs and CVEs: what it delivers to
 * Ruleset Management. Counted from that plugin's API; a count it cannot give
 * (plugin not installed, no permission) shows as unavailable.
 */
const DetectionContentPanel = () => {
  const counts = useCtiRequest(fetchDetectionContentCounts, []);
  return (
    <EuiPanel paddingSize='m' data-test-subj='ctiExplorerDetectionContent'>
      {/* As the Home page tiles: the links switch apps without reloading the page. */}
      <RedirectAppLinks application={getCore().application}>
        <EuiFlexGroup alignItems='center' gutterSize='m' wrap>
          <EuiFlexItem grow={false}>
            <EuiIcon type='list' color='primary' />
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiText size='s'>
              <strong>
                {i18n.translate('wazuh.ctiExplorer.detectionContent.title', {
                  defaultMessage: 'Detection content',
                })}
              </strong>
            </EuiText>
          </EuiFlexItem>
          {DETECTION_CONTENT.map(({ key, label }) => {
            const value = counts.data?.[key];
            return (
              <EuiFlexItem grow={false} key={key}>
                <EuiText size='s'>
                  {value === null || value === undefined ? (
                    <EuiToolTip
                      content={i18n.translate(
                        'wazuh.ctiExplorer.detectionContent.unavailable',
                        {
                          defaultMessage:
                            'Ruleset Management did not return this count. It may not be installed, or your user may lack access to it.',
                        },
                      )}
                    >
                      <span>
                        {counts.loading ? '…' : '-'} {label}
                      </span>
                    </EuiToolTip>
                  ) : (
                    <EuiLink
                      href={getRulesetPageUrl(key)}
                      style={NORMAL_FONT_WEIGHT}
                      data-test-subj={`ctiExplorerDetectionContent-${key}`}
                    >
                      {formatNumber(value)} {label}
                    </EuiLink>
                  )}
                </EuiText>
              </EuiFlexItem>
            );
          })}
          <EuiFlexItem />
          <EuiFlexItem grow={false}>
            <EuiButtonEmpty size='s' href={getRulesetPageUrl('integrations')}>
              {i18n.translate('wazuh.ctiExplorer.detectionContent.open', {
                defaultMessage: 'Open in Ruleset Management',
              })}
            </EuiButtonEmpty>
          </EuiFlexItem>
        </EuiFlexGroup>
      </RedirectAppLinks>
    </EuiPanel>
  );
};

export const OverviewTab = ({
  iocSummary,
  vulnerabilitySummary,
  onBrowseIocs,
  onBrowseVulnerabilities,
  onOpenIoc,
  onOpenVulnerability,
}: OverviewTabProps) => {
  const iocs = iocSummary.data;
  const countOf = (type: string) =>
    vulnerabilitySummary.data?.byType.find(bucket => bucket.key === type)
      ?.count;
  const bySeverity = vulnerabilitySummary.data?.byHighestSeverity ?? [];
  const scoredCves = bySeverity.reduce((sum, bucket) => sum + bucket.count, 0);
  // Records with no CNA score, or only 0.0 (no severity), are in no band.
  const unscoredCves = Math.max((countOf('CVE') ?? scoredCves) - scoredCves, 0);

  return (
    <>
      <LookupPanel
        onOpenIoc={onOpenIoc}
        onOpenVulnerability={onOpenVulnerability}
      />
      <EuiSpacer size='m' />
      {iocSummary.error ? (
        <>
          <RequestErrorCallout
            error={iocSummary.error}
            onRetry={iocSummary.reload}
          />
          <EuiSpacer size='m' />
        </>
      ) : null}
      {vulnerabilitySummary.error ? (
        <>
          <RequestErrorCallout
            error={vulnerabilitySummary.error}
            onRetry={vulnerabilitySummary.reload}
          />
          <EuiSpacer size='m' />
        </>
      ) : null}
      <EuiFlexGroup gutterSize='m' wrap>
        {!iocSummary.error ? (
          <>
            <StatTile
              value={iocs?.total}
              label={i18n.translate('wazuh.ctiExplorer.overview.iocRecords', {
                defaultMessage: 'IOC records',
              })}
              caption={CURRENT_STATE}
              loading={iocSummary.loading && !iocs}
              tooltip={i18n.translate(
                'wazuh.ctiExplorer.overview.iocRecordsTooltip',
                { defaultMessage: 'Browse the IOCs' },
              )}
              onClick={() => onBrowseIocs({})}
              testSubj='iocs'
            />
            <StatTile
              value={iocs?.addedRecently}
              label={i18n.translate('wazuh.ctiExplorer.overview.iocsAdded', {
                defaultMessage: 'IOCs added',
              })}
              caption={i18n.translate(
                'wazuh.ctiExplorer.overview.iocsAddedCaption',
                {
                  defaultMessage: 'First seen in the last {days} days',
                  values: { days: CTI_RECENT_DAYS },
                },
              )}
              loading={iocSummary.loading && !iocs}
              tooltip={i18n.translate(
                'wazuh.ctiExplorer.overview.iocsAddedTooltip',
                {
                  defaultMessage:
                    'Browse the IOCs first seen in the last {days} days',
                  values: { days: CTI_RECENT_DAYS },
                },
              )}
              onClick={() => onBrowseIocs({ recent: true })}
              testSubj='recent'
            />
            <StatTile
              value={iocs?.providers}
              label={i18n.translate('wazuh.ctiExplorer.overview.providers', {
                defaultMessage: 'Providers',
              })}
              caption={CURRENT_STATE}
              loading={iocSummary.loading && !iocs}
              tooltip={i18n.translate(
                'wazuh.ctiExplorer.overview.providersTooltip',
                { defaultMessage: 'See the IOCs by provider' },
              )}
              onClick={() => onBrowseIocs({})}
              testSubj='providers'
            />
          </>
        ) : null}
        {!vulnerabilitySummary.error ? (
          <>
            <StatTile
              value={countOf('CVE')}
              label={i18n.translate('wazuh.ctiExplorer.overview.cveRecords', {
                defaultMessage: 'CVE records',
              })}
              caption={CURRENT_STATE}
              loading={
                vulnerabilitySummary.loading && !vulnerabilitySummary.data
              }
              tooltip={i18n.translate(
                'wazuh.ctiExplorer.overview.cveRecordsTooltip',
                { defaultMessage: 'Browse the newest CVE records' },
              )}
              onClick={() => onBrowseVulnerabilities('CVE')}
              testSubj='cve'
            />
            <StatTile
              value={countOf('TID')}
              label={i18n.translate('wazuh.ctiExplorer.overview.tidRecords', {
                defaultMessage: 'Translation rules (TID)',
              })}
              caption={CURRENT_STATE}
              loading={
                vulnerabilitySummary.loading && !vulnerabilitySummary.data
              }
              tooltip={i18n.translate(
                'wazuh.ctiExplorer.overview.tidRecordsTooltip',
                { defaultMessage: 'Browse the translation rules' },
              )}
              onClick={() => onBrowseVulnerabilities('TID')}
              testSubj='tid'
            />
          </>
        ) : null}
      </EuiFlexGroup>
      <EuiSpacer size='m' />
      {iocs || vulnerabilitySummary.data ? (
        <EuiFlexGroup gutterSize='m'>
          {iocs ? (
            <EuiFlexItem>
              <EuiPanel
                paddingSize='m'
                style={FULL_HEIGHT}
                data-test-subj='ctiExplorerIocsByType'
              >
                <EuiFlexGroup
                  justifyContent='spaceBetween'
                  alignItems='center'
                  responsive={false}
                >
                  <EuiFlexItem grow={false}>
                    <EuiTitle size='xs'>
                      <h2>
                        {i18n.translate(
                          'wazuh.ctiExplorer.overview.byTypeTitle',
                          {
                            defaultMessage: 'IOC catalog by type',
                          },
                        )}
                      </h2>
                    </EuiTitle>
                  </EuiFlexItem>
                  <EuiFlexItem grow={false}>
                    <EuiButtonEmpty size='s' onClick={() => onBrowseIocs({})}>
                      {i18n.translate('wazuh.ctiExplorer.overview.browseIocs', {
                        defaultMessage: 'Browse IOCs',
                      })}
                    </EuiButtonEmpty>
                  </EuiFlexItem>
                </EuiFlexGroup>
                <EuiSpacer size='s' />
                <BreakdownList
                  buckets={iocs.byType}
                  total={iocs.total}
                  getLabel={getIocTypeLabel}
                  onSelect={type => onBrowseIocs({ type })}
                  data-test-subj='ctiExplorerOverviewByType'
                />
              </EuiPanel>
            </EuiFlexItem>
          ) : null}
          {vulnerabilitySummary.data ? (
            <EuiFlexItem>
              <EuiPanel
                paddingSize='m'
                style={FULL_HEIGHT}
                data-test-subj='ctiExplorerCvesBySeverity'
              >
                <EuiFlexGroup
                  justifyContent='spaceBetween'
                  alignItems='center'
                  responsive={false}
                >
                  <EuiFlexItem grow={false}>
                    <EuiTitle size='xs'>
                      <h2>
                        {i18n.translate(
                          'wazuh.ctiExplorer.overview.bySeverityTitle',
                          { defaultMessage: 'CVE records by severity' },
                        )}
                      </h2>
                    </EuiTitle>
                  </EuiFlexItem>
                  <EuiFlexItem grow={false}>
                    <EuiButtonEmpty
                      size='s'
                      onClick={() => onBrowseVulnerabilities('CVE')}
                    >
                      {i18n.translate('wazuh.ctiExplorer.overview.browseCves', {
                        defaultMessage: 'Browse CVE records',
                      })}
                    </EuiButtonEmpty>
                  </EuiFlexItem>
                </EuiFlexGroup>
                <EuiText size='xs' color='subdued'>
                  <p>
                    {i18n.translate(
                      'wazuh.ctiExplorer.overview.bySeverityCaption',
                      {
                        defaultMessage:
                          'Severity of the highest base score the CNA assigned to each record, in any CVSS version.',
                      },
                    )}
                  </p>
                </EuiText>
                <EuiSpacer size='s' />
                <BreakdownList
                  // Most severe first.
                  buckets={[...bySeverity].reverse()}
                  total={scoredCves}
                  getLabel={key => getSeverityLabel(key as CvssSeverity)}
                  getColor={key => getSeverityColor(key as CvssSeverity)}
                  // The list filtered by that severity: it also lists the
                  // records with a higher score besides one in the band.
                  onSelect={severity =>
                    onBrowseVulnerabilities('CVE', [
                      severity as CveSeverityFilter,
                    ])
                  }
                  data-test-subj='ctiExplorerOverviewBySeverity'
                />
                {unscoredCves ? (
                  <>
                    <EuiSpacer size='s' />
                    <EuiText
                      size='xs'
                      color='subdued'
                      data-test-subj='ctiExplorerOverviewUnscored'
                    >
                      <p>
                        {i18n.translate(
                          'wazuh.ctiExplorer.overview.unscoredCves',
                          {
                            defaultMessage:
                              '{count} CVE records without a CNA score, or scored 0.0, are not counted.',
                            values: { count: formatNumber(unscoredCves) },
                          },
                        )}
                      </p>
                    </EuiText>
                  </>
                ) : null}
              </EuiPanel>
            </EuiFlexItem>
          ) : null}
        </EuiFlexGroup>
      ) : null}
      <EuiSpacer size='m' />
      <DetectionContentPanel />
    </>
  );
};
