import React from 'react';
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiLink,
  EuiSpacer,
  EuiText,
} from '@elastic/eui';
import { withErrorBoundary } from '../../../../hocs/error-boundary/with-error-boundary';
import { getCore } from '../../../../../../kibana-services';
import { RedirectAppLinks } from '../../../../../../../../../src/plugins/opensearch_dashboards_react/public';
import {
  WidgetGroup,
  StatTile,
  TabNumber,
  BarList,
  SeverityDistributionBar,
  SectionHeader,
  formatValueSafely,
  WIDGET_LOADING_MIN_HEIGHT,
} from '../common';
import { TopRulesTable } from './top-rules-table';
import {
  useFindingsOverview,
  useVulnerabilityOverview,
} from '../../hooks/use-overview-data';
import {
  getMitreUrl,
  getThreatHuntingUrl,
  getVulnerabilityDetectionUrl,
} from '../../utils/navigation';

export interface ThreatHuntingSectionProps {
  /** Reuses the Overview on-mount findings search. */
  findings: ReturnType<typeof useFindingsOverview>;
  /** Shared (lazy) vulnerabilities search, also used by the Threat Intel Feed. */
  vulnerabilities: ReturnType<typeof useVulnerabilityOverview>;
}

const ThreatHuntingSectionComponent: React.FC<ThreatHuntingSectionProps> = ({
  findings,
  vulnerabilities,
}) => {
  return (
    <div>
      <SectionHeader
        title='Threat hunting'
        description='Hunt for threats, map activity to MITRE ATT&CK, and detect known vulnerabilities.'
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
                <EuiLink href={getMitreUrl()}>MITRE ATT&amp;CK</EuiLink>
              </RedirectAppLinks>
            }
            caption='Last 24 hours'
            loadingMinHeight={WIDGET_LOADING_MIN_HEIGHT.heroAndList}
            data-test-subj='home-overview-techniques'
          >
            {findings.data && (
              <>
                <StatTile
                  textAlign='center'
                  reverse
                  value={<TabNumber value={findings.data.techniquesCount} />}
                  label='Techniques observed'
                  data-test-subj='techniques-hero'
                />
                <EuiSpacer size='s' />
                <BarList
                  title='Top 5 techniques'
                  items={findings.data.topTechniques}
                  emptyMessage='No techniques observed'
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
                <EuiLink href={getThreatHuntingUrl()}>Threat Hunting</EuiLink>
              </RedirectAppLinks>
            }
            caption='Last 24 hours'
            loadingMinHeight={WIDGET_LOADING_MIN_HEIGHT.heroAndList}
            data-test-subj='home-overview-threat-hunting-findings'
          >
            {findings.data && (
              <>
                <StatTile
                  textAlign='center'
                  reverse
                  value={<TabNumber value={findings.data.totalFindings} />}
                  label='Total findings'
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
                  Vulnerability Detection
                </EuiLink>
              </RedirectAppLinks>
            }
            caption='Current state'
            loadingMinHeight={WIDGET_LOADING_MIN_HEIGHT.heroAndList}
            data-test-subj='home-overview-vulnerabilities'
          >
            {vulnerabilities.data && (
              <>
                <SeverityDistributionBar
                  counts={vulnerabilities.data.severity}
                  headline={
                    <EuiText size='s'>
                      <strong className='tab-num'>
                        {formatValueSafely(
                          Object.values(vulnerabilities.data.severity).reduce(
                            (sum: number, count) => sum + (count ?? 0),
                            0,
                          ),
                        )}
                      </strong>{' '}
                      open vulnerabilities
                    </EuiText>
                  }
                  testSubjPrefix='vulnerability-severity'
                />
                <EuiSpacer size='s' />
                <BarList
                  title='Top 5 package name'
                  items={vulnerabilities.data.byPackage}
                  emptyMessage='No vulnerabilities found'
                  data-test-subj='vulnerabilities-by-package'
                />
              </>
            )}
          </WidgetGroup>
        </EuiFlexItem>
      </EuiFlexGroup>
    </div>
  );
};

export const ThreatHuntingSection = React.memo(
  withErrorBoundary(ThreatHuntingSectionComponent),
);
