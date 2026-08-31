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
import { DataGroupResult } from '../../interfaces/data-group';
import { CountsByKey } from '../../interfaces/types';

const FRAMEWORK_IDS = Object.keys(
  COMPLIANCE_FRAMEWORK_FIELDS,
) as WAZUH_MODULES_ID[];

export interface RegulatoryComplianceBadgesProps {
  /** Distinct controls implicated per framework; chips navigate regardless. */
  controls: DataGroupResult<CountsByKey>;
}

/**
 * Chips show distinct controls implicated, not findings: one finding can
 * implicate several frameworks, so every framework's finding count ties.
 * `EuiPanel` has no link support, hence the wrapping `<a href>`.
 *
 * The grid reflows on the card's own width, so the chips repack (2 to 6 per
 * row) as the card shares or takes a row. The 130px floor fits the longest
 * framework name next to its badge; below it the label truncates, with the full
 * name in `title`, rather than overflowing the chip.
 */
export const RegulatoryComplianceBadges: React.FC<
  RegulatoryComplianceBadgesProps
> = ({ controls }) => {
  const counts = controls.data;

  return (
    <RedirectAppLinks application={getCore().application}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
          rowGap: '8px',
          columnGap: '8px',
        }}
      >
        {FRAMEWORK_IDS.map(id => {
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
