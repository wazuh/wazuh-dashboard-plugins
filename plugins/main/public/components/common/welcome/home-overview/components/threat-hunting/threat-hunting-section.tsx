import React from 'react';
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
  getMitreIntelligenceResourceUrl,
  getMitreUrl,
  getThreatHuntingUrl,
import {
  getVulnerabilityDetectionBySeverityUrl,
  getVulnerabilityDetectionUrl,
} from '../../utils/navigation';
import { mitreAttack, threatHunting, vulnerabilityDetection } from '../../../../../../utils/applications';
import { homeOverviewI18n } from '../../i18n';

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
        title={homeOverviewI18n.threatHunting}
        description={homeOverviewI18n.threatHuntingDescription}
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
            title={
              <RedirectAppLinks application={getCore().application}>
                <EuiLink href={getMitreUrl()}>{mitreAttack.title}</EuiLink>
              </RedirectAppLinks>
            }
            caption={homeOverviewI18n.last24Hours}
            loadingMinHeight={WIDGET_LOADING_MIN_HEIGHT.heroAndList}
            data-test-subj='home-overview-techniques'
          >
            {findings.data && (
              <>
                <StatTile
                  textAlign='center'
                  reverse
                  value={<TabNumber value={findings.data.techniquesCount} />}
                  label={homeOverviewI18n.techniquesObserved}
                  data-test-subj='techniques-hero'
                />
                <EuiSpacer size='s' />
                <BarList
                  title={homeOverviewI18n.top5Techniques}
                  items={findings.data.topTechniques}
                  emptyMessage={homeOverviewI18n.noTechniques}
                  getHref={item =>
                    getMitreIntelligenceResourceUrl('techniques', item)
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
            title={
              <RedirectAppLinks application={getCore().application}>
                <EuiLink href={getThreatHuntingUrl()}>
                  {threatHunting.title}
                </EuiLink>
              </RedirectAppLinks>
            }
            caption={homeOverviewI18n.last24Hours}
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
                  label={homeOverviewI18n.totalFindings}
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
            title={
              <RedirectAppLinks application={getCore().application}>
                <EuiLink href={getVulnerabilityDetectionUrl()}>
                  {vulnerabilityDetection.title}
                </EuiLink>
              </RedirectAppLinks>
            }
            caption={homeOverviewI18n.currentState}
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
                    homeOverviewI18n.clickToSeeField(
                      'vulnerabilities',
                      band,
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
