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
import { ScaTiles } from './sca-tiles';
import { ScaBenchmarksTable } from './sca-benchmarks-table';
import { StatTile } from './stat-tile';
import { FimPlatformsTable } from './fim-platforms-table';
import { MalwareDetectionPanel } from './malware-detection-panel';
import { useInViewport } from '../../../hooks';
import {
  useFIMOverview,
  useMalwareOverview,
  useSCAOverview,
} from '../services/use-overview-data';
import {
  goToConfigurationAssessment,
  goToFileIntegrityMonitoring,
} from '../services/navigation';
import { formatUINumber } from '../../../../../react-services/format-number';

/**
 * The Endpoint Security section: Configuration Assessment, File Integrity
 * Monitoring, and Malware Detection. Loads its data lazily, once the section
 * approaches the viewport.
 */
export const EndpointSecuritySection: React.FC = () => {
  const [sectionRef, visible] = useInViewport<HTMLDivElement>();
  const sca = useSCAOverview(visible);
  const fim = useFIMOverview(visible);
  const malware = useMalwareOverview(visible);

  return (
    <div ref={sectionRef}>
      <EuiTitle size='xs'>
        <h2>Endpoint security</h2>
      </EuiTitle>
      <EuiText size='s' color='subdued'>
        Harden configurations, detect malware, and monitor file integrity
        across your fleet.
      </EuiText>
      <EuiSpacer size='s' />
      <EuiFlexGroup>
        <EuiFlexItem>
          <WidgetGroup
            status={sca.status}
            title={
              <EuiLink onClick={goToConfigurationAssessment}>
                Configuration Assessment
              </EuiLink>
            }
            caption='Current'
            data-test-subj='home-overview-sca'
          >
            {sca.data && (
              <>
                <ScaTiles tiles={sca.data.tiles} />
                <EuiSpacer size='s' />
                <ScaBenchmarksTable items={sca.data.benchmarks} />
              </>
            )}
          </WidgetGroup>
        </EuiFlexItem>
        <EuiFlexItem>
          <WidgetGroup
            status={fim.status}
            title={
              <EuiLink onClick={goToFileIntegrityMonitoring}>
                File Integrity Monitoring
              </EuiLink>
            }
            caption='Current'
            data-test-subj='home-overview-fim'
          >
            {fim.data && (
              <>
                <StatTile
                  value={
                    <span className='tab-num'>
                      {formatUINumber(fim.data.total)}
                    </span>
                  }
                  label='Files & registry objects baselined fleet-wide'
                  textAlign='left'
                  data-test-subj='fim-hero'
                />
                <EuiSpacer size='s' />
                <FimPlatformsTable items={fim.data.platforms} />
              </>
            )}
          </WidgetGroup>
        </EuiFlexItem>
        <EuiFlexItem>
          <MalwareDetectionPanel malware={malware} />
        </EuiFlexItem>
      </EuiFlexGroup>
    </div>
  );
};
