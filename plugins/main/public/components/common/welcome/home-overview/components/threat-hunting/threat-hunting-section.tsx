import React from 'react';
import { i18n } from '@osd/i18n';
import { EuiFlexGroup, EuiFlexItem, EuiLink, EuiSpacer } from '@elastic/eui';
import { withErrorBoundary } from '../../../../hocs/error-boundary/with-error-boundary';
import { getCore } from '../../../../../../kibana-services';
import { RedirectAppLinks } from '../../../../../../../../../src/plugins/opensearch_dashboards_react/public';
import {
  WidgetGroup,
  StatTile,
  TabNumber,
  BarList,
  FindingSeverityTiles,
  SectionHeader,
  WIDGET_LOADING_MIN_HEIGHT,
} from '../common';
import { TopRulesTable } from './top-rules-table';
import { TopPackagesTable } from './top-packages-table';
import {
  useFindingsOverview,
  useVulnerabilityOverview,
} from '../../hooks/use-overview-data';
import {
  getMitreFindingsByTechniqueUrl,
  getMitreUrl,
  getThreatHuntingUrl,
  getVulnerabilityDetectionBySeverityUrl,
  getVulnerabilityDetectionUrl,
} from '../../utils/navigation';

export interface ThreatHuntingSectionProps {
  /** Reuses the Overview on-mount findings search. */
  findings: ReturnType<typeof useFindingsOverview>;
  /** Lazy vulnerabilities search, fetched once this section scrolls into view. */
  vulnerabilities: ReturnType<typeof useVulnerabilityOverview>;
}

const ThreatHuntingSectionComponent: React.FC<ThreatHuntingSectionProps> = ({
  findings,
  vulnerabilities,
}) => {
  return (
    <div>
      <SectionHeader
        title={i18n.translate('wazuh.common.homeOverviewThreatHunting.title', {
          defaultMessage: 'Threat hunting',
        })}
        description={i18n.translate(
          'wazuh.common.homeOverviewThreatHunting.description',
          {
            defaultMessage:
              'Hunt for threats, map activity to MITRE ATT&CK, and detect known vulnerabilities.',
          },
        )}
      />
      <EuiFlexGroup wrap responsive={false}>
        <EuiFlexItem>
          <WidgetGroup
            status={findings.status}
            errorLabel={findings.error?.message}
            showManageIndexPatternsLink={
              findings.error?.kind === 'index-pattern-missing'
            }
            isPermissionDenied={findings.error?.kind === 'permission-denied'}
            title={i18n.translate(
              'wazuh.common.homeOverviewThreatHunting.mitreTitle',
              { defaultMessage: 'MITRE ATT&CK' },
            )}
            titleLink={{ href: getMitreUrl() }}
            caption={i18n.translate(
              'wazuh.common.homeOverviewWidget.captionLast24Hours',
              { defaultMessage: 'Last 24 hours' },
            )}
            loadingMinHeight={WIDGET_LOADING_MIN_HEIGHT.heroAndList}
            data-test-subj='home-overview-techniques'
          >
            {findings.data && (
              <>
                <StatTile
                  textAlign='center'
                  reverse
                  value={<TabNumber value={findings.data.techniquesCount} />}
                  label={i18n.translate(
                    'wazuh.common.homeOverviewThreatHunting.techniquesObserved',
                    { defaultMessage: 'Techniques observed' },
                  )}
                  data-test-subj='techniques-hero'
                />
                <EuiSpacer size='s' />
                <BarList
                  title={i18n.translate(
                    'wazuh.common.homeOverviewThreatHunting.topTechniques',
                    { defaultMessage: 'Top 5 techniques' },
                  )}
                  items={findings.data.topTechniques}
                  emptyMessage={i18n.translate(
                    'wazuh.common.homeOverviewThreatHunting.noTechniques',
                    { defaultMessage: 'No techniques observed' },
                  )}
                  getHref={item =>
                    getMitreFindingsByTechniqueUrl(
                      item,
                      findings.indexPatternId,
                    )
                  }
                  data-test-subj='top-techniques'
                />
              </>
            )}
          </WidgetGroup>
        </EuiFlexItem>
        <EuiFlexItem>
          <WidgetGroup
            status={findings.status}
            errorLabel={findings.error?.message}
            showManageIndexPatternsLink={
              findings.error?.kind === 'index-pattern-missing'
            }
            isPermissionDenied={findings.error?.kind === 'permission-denied'}
            title={i18n.translate(
              'wazuh.common.homeOverviewThreatHunting.findingsTitle',
              { defaultMessage: 'Threat Hunting' },
            )}
            titleLink={{ href: getThreatHuntingUrl() }}
            caption={i18n.translate(
              'wazuh.common.homeOverviewWidget.captionLast24Hours',
              { defaultMessage: 'Last 24 hours' },
            )}
            loadingMinHeight={WIDGET_LOADING_MIN_HEIGHT.heroAndList}
            data-test-subj='home-overview-threat-hunting-findings'
          >
            {findings.data && (
              <>
                <StatTile
                  textAlign='center'
                  reverse
                  value={
                    <RedirectAppLinks application={getCore().application}>
                      <EuiLink
                        style={{ fontWeight: 'inherit' }}
                        color='text'
                        href={getThreatHuntingUrl()}
                        data-test-subj='total-findings-hero-link'
                      >
                        <TabNumber value={findings.data.totalFindings} />
                      </EuiLink>
                    </RedirectAppLinks>
                  }
                  label={i18n.translate(
                    'wazuh.common.homeOverviewThreatHunting.totalFindings',
                    { defaultMessage: 'Total findings' },
                  )}
                  data-test-subj='total-findings-hero'
                />
                <EuiSpacer size='s' />
                <TopRulesTable items={findings.data.topRules} />
              </>
            )}
          </WidgetGroup>
        </EuiFlexItem>
        <EuiFlexItem>
          <WidgetGroup
            status={vulnerabilities.status}
            errorLabel={vulnerabilities.error?.message}
            showManageIndexPatternsLink={
              vulnerabilities.error?.kind === 'index-pattern-missing'
            }
            isPermissionDenied={
              vulnerabilities.error?.kind === 'permission-denied'
            }
            title={i18n.translate(
              'wazuh.common.homeOverviewThreatHunting.vulnerabilitiesTitle',
              { defaultMessage: 'Vulnerability Detection' },
            )}
            titleLink={{ href: getVulnerabilityDetectionUrl() }}
            caption={i18n.translate(
              'wazuh.common.homeOverviewWidget.captionCurrentState',
              { defaultMessage: 'Current state' },
            )}
            loadingMinHeight={WIDGET_LOADING_MIN_HEIGHT.heroAndList}
            data-test-subj='home-overview-vulnerabilities'
          >
            {vulnerabilities.data && (
              <>
                <FindingSeverityTiles
                  counts={vulnerabilities.data.severity}
                  testSubjPrefix='vulnerability-severity'
                  onSelect={band =>
                    getVulnerabilityDetectionBySeverityUrl(
                      band,
                      vulnerabilities.indexPatternId,
                    )
                  }
                  getTooltip={band =>
                    i18n.translate(
                      'wazuh.common.homeOverviewThreatHunting.vulnerabilitySeverityTooltip',
                      {
                        defaultMessage: 'Click to see vulnerabilities: {band}',
                        values: { band },
                      },
                    )
                  }
                />
                <EuiSpacer size='s' />
                <TopPackagesTable items={vulnerabilities.data.byPackage} />
              </>
            )}
          </WidgetGroup>
        </EuiFlexItem>
      </EuiFlexGroup>
    </div>
  );
};

// Annotated: `withErrorBoundary` is untyped, so without this the props
// would reach every call site as `any`.
export const ThreatHuntingSection: React.FC<ThreatHuntingSectionProps> =
  React.memo(withErrorBoundary(ThreatHuntingSectionComponent));
