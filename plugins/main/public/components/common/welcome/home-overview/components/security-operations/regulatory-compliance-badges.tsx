import React from 'react';
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiNotificationBadge,
  EuiPanel,
  EuiText,
  EuiToolTip,
} from '@elastic/eui';
import { WAZUH_MODULES_ID } from '../../../../../../../common/constants';
import { WAZUH_MODULES } from '../../../../../../../common/wazuh-modules';
import { COMPLIANCE_FRAMEWORK_FIELDS } from '../../lib/fields';
import { getRegulatoryComplianceUrl } from '../../utils/navigation';
import { getCore } from '../../../../../../kibana-services';
import { RedirectAppLinks } from '../../../../../../../../../src/plugins/opensearch_dashboards_react/public';
import { formatValueSafely } from '../common';
import { useFindingsOverview } from '../../hooks/use-overview-data';

const FRAMEWORK_IDS = Object.keys(
  COMPLIANCE_FRAMEWORK_FIELDS,
) as WAZUH_MODULES_ID[];

export interface RegulatoryComplianceBadgesProps {
  findings: ReturnType<typeof useFindingsOverview>;
}

/**
 * Every framework reports the same total findings count (one finding can
 * implicate several frameworks at once), so tiles are instead ranked by
 * distinct controls implicated — the number that actually varies. Each tile
 * is a plain `<a href>` around an `EuiPanel` (EuiPanel has no native link
 * support) so all 10 frameworks stay reachable in one click regardless of
 * the count's load state.
 */
export const RegulatoryComplianceBadges: React.FC<
  RegulatoryComplianceBadgesProps
> = ({ findings }) => {
  const counts =
    findings.status === 'available'
      ? findings.data.complianceControlsByFramework
      : undefined;

  const rankedFrameworkIds = [...FRAMEWORK_IDS].sort(
    (a, b) => (counts?.[b] ?? -1) - (counts?.[a] ?? -1),
  );

  return (
    <RedirectAppLinks application={getCore().application}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          rowGap: '8px',
          columnGap: '8px',
        }}
      >
        {rankedFrameworkIds.map(id => {
          const label = WAZUH_MODULES[id].title;
          const count = counts?.[id];
          return (
            <div key={id}>
              <a
                href={getRegulatoryComplianceUrl(id)}
                title={label}
                style={{ textDecoration: 'none', color: 'inherit' }}
                data-test-subj={`regulatory-compliance-badge-${id}`}
              >
                <EuiPanel paddingSize='s' hasBorder>
                  <EuiFlexGroup
                    gutterSize='s'
                    alignItems='center'
                    responsive={false}
                  >
                    <EuiFlexItem style={{ minWidth: 0 }}>
                      <EuiText
                        size='xs'
                        style={{
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        <strong>{label}</strong>
                      </EuiText>
                    </EuiFlexItem>
                    <EuiFlexItem grow={false}>
                      <EuiToolTip
                        position='top'
                        content='Distinct controls implicated, last 24 hours'
                      >
                        <EuiNotificationBadge
                          color={count ? 'accent' : 'subdued'}
                          data-test-subj={`regulatory-compliance-badge-${id}-controls`}
                        >
                          {formatValueSafely(count)}
                        </EuiNotificationBadge>
                      </EuiToolTip>
                    </EuiFlexItem>
                  </EuiFlexGroup>
                </EuiPanel>
              </a>
            </div>
          );
        })}
      </div>
    </RedirectAppLinks>
  );
};
