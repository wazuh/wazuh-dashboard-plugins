import React from 'react';
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiLink,
  EuiSpacer,
  EuiText,
  EuiTitle,
} from '@elastic/eui';
import { withErrorBoundary } from '../../../../hocs/error-boundary/with-error-boundary';
import { WidgetGroup, StatTile, FindingSeverityTiles } from '../common';
import { TopRulesTable } from './top-rules-table';
import { TopTechniquesTable } from './top-techniques-table';
import { VulnerabilitiesByOsTable } from './vulnerabilities-by-os-table';
import {
  useFindingsOverview,
  useVulnerabilityOverview,
} from '../../hooks/use-overview-data';
import {
  goToMitre,
  goToMitreTechnique,
  goToThreatHunting,
  goToVulnerabilityDetection,
} from '../../navigation';
import { formatUINumber } from '../../../../../../react-services/format-number';

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
      <EuiTitle size='xs'>
        <h2>Threat hunting</h2>
      </EuiTitle>
      <EuiText size='s' color='subdued'>
        Hunt for threats, map activity to MITRE ATT&amp;CK, and detect known
        vulnerabilities.
      </EuiText>
      <EuiSpacer size='s' />
      <EuiFlexGroup wrap responsive={false}>
        <EuiFlexItem>
          <WidgetGroup
            status={findings.status}
            title={
              <EuiLink onClick={goToThreatHunting}>Threat Hunting</EuiLink>
            }
            caption='Last 24 hours'
            data-test-subj='home-overview-threat-hunting-findings'
          >
            {findings.data && (
              <>
                <StatTile
                  value={
                    <span className='tab-num'>
                      {formatUINumber(findings.data.totalFindings)}
                    </span>
                  }
                  label='Total findings, last 24 hours'
                  textAlign='left'
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
            title={<EuiLink onClick={goToMitre}>MITRE ATT&amp;CK</EuiLink>}
            caption='Last 24 hours'
            data-test-subj='home-overview-techniques'
          >
            {findings.data && (
              <>
                <StatTile
                  value={
                    <span className='tab-num'>
                      {formatUINumber(findings.data.techniquesCount)}
                    </span>
                  }
                  label='Techniques observed, last 24 hours'
                  textAlign='left'
                  data-test-subj='techniques-hero'
                />
                <EuiSpacer size='s' />
                <TopTechniquesTable
                  items={findings.data.topTechniques}
                  onSelect={item =>
                    goToMitreTechnique(item.key, findings.indexPatternId)
                  }
                />
              </>
            )}
          </WidgetGroup>
        </EuiFlexItem>
        <EuiFlexItem>
          <WidgetGroup
            status={vulnerabilities.status}
            title={
              <EuiLink onClick={goToVulnerabilityDetection}>
                Vulnerability Detection
              </EuiLink>
            }
            caption='Current'
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

export const ThreatHuntingSection = withErrorBoundary(
  ThreatHuntingSectionComponent,
);
