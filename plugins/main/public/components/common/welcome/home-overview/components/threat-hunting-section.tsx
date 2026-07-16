import React from 'react';
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiLink,
  EuiSpacer,
  EuiText,
  EuiTitle,
} from '@elastic/eui';
import { WidgetGroup } from './widget-group';
import { StatTile } from './stat-tile';
import { TopRulesTable } from './top-rules-table';
import { TopTechniquesTable } from './top-techniques-table';
import { FindingSeverityTiles } from './finding-severity-tiles';
import { VulnerabilitiesByOsTable } from './vulnerabilities-by-os-table';
import { useInViewport } from '../../../hooks';
import {
  useFindingsOverview,
  useVulnerabilityOverview,
} from '../services/use-overview-data';
import {
  goToMitre,
  goToMitreTechnique,
  goToThreatHunting,
  goToVulnerabilityDetection,
} from '../services/navigation';
import { formatUINumber } from '../../../../../react-services/format-number';

export interface ThreatHuntingSectionProps {
  /** Piggybacks on the OVERVIEW section's on-mount findings search rather
   * than issuing a second scan. */
  findings: ReturnType<typeof useFindingsOverview>;
}

/**
 * The Threat Hunting section: Findings, MITRE ATT&CK techniques, and
 * Vulnerability Detection. Findings/techniques reuse the shared findings
 * search; Vulnerability Detection loads lazily once the section approaches
 * the viewport.
 */
export const ThreatHuntingSection: React.FC<ThreatHuntingSectionProps> = ({
  findings,
}) => {
  const [sectionRef, visible] = useInViewport<HTMLDivElement>();
  const vulnerabilities = useVulnerabilityOverview(visible);

  return (
    <div ref={sectionRef}>
      <EuiTitle size='xs'>
        <h2>Threat hunting</h2>
      </EuiTitle>
      <EuiText size='s' color='subdued'>
        Hunt for threats, map activity to MITRE ATT&amp;CK, and detect known
        vulnerabilities.
      </EuiText>
      <EuiSpacer size='s' />
      <EuiFlexGroup wrap responsive={false}>
        <EuiFlexItem style={{ minWidth: 0 }}>
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
        <EuiFlexItem style={{ minWidth: 0 }}>
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
        <EuiFlexItem style={{ minWidth: 0 }}>
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
