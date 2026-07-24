import React from 'react';
import { EuiFlexGroup, EuiFlexItem, EuiLink, EuiSpacer } from '@elastic/eui';
import { withErrorBoundary } from '../../../../hocs/error-boundary/with-error-boundary';
import { getCore } from '../../../../../../kibana-services';
import { RedirectAppLinks } from '../../../../../../../../../src/plugins/opensearch_dashboards_react/public';
import {
  WidgetGroup,
  StatTile,
  TabNumber,
  FindingSeverityTiles,
  SectionHeader,
  WIDGET_LOADING_MIN_HEIGHT,
} from '../common';
import { TopRulesTable } from './top-rules-table';
import { TopTechniquesTable } from './top-techniques-table';
import { VulnerabilitiesByOsTable } from './vulnerabilities-by-os-table';
import {
  useFindingsOverview,
  useVulnerabilityOverview,
} from '../../hooks/use-overview-data';
import {
  getMitreUrl,
  getMitreTechniqueUrl,
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
                <RedirectAppLinks application={getCore().application}>
                  <TopTechniquesTable
                    items={findings.data.topTechniques}
                    onSelect={item =>
                      getMitreTechniqueUrl(item.id, findings.indexPatternId)
                    }
                  />
                </RedirectAppLinks>
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
                <FindingSeverityTiles
                  counts={vulnerabilities.data.severity}
                  testSubjPrefix='vulnerability-severity'
                />
                <EuiSpacer size='s' />
                <VulnerabilitiesByOsTable items={vulnerabilities.data.byOs} />
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
