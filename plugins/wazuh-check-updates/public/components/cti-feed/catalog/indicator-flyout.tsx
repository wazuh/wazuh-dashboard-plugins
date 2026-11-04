import React from 'react';
import { i18n } from '@osd/i18n';
import {
  EuiButtonEmpty,
  EuiCallOut,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFlyout,
  EuiFlyoutBody,
  EuiFlyoutFooter,
  EuiFlyoutHeader,
  EuiSpacer,
  EuiTitle,
} from '@elastic/eui';
import type { CatalogIndicator } from '../../../../common/cti-catalog';
import { getFamilyLabel, getProviderLabel } from './catalog-labels';
import { CopyableValue } from './catalog-shared';
import { IndicatorDetails } from './indicator-details';

const TITLE_ID = 'ctiCatalogIndicatorFlyoutTitle';

export interface IndicatorPivot {
  provider?: string;
  family?: string;
}

/**
 * One indicator record, with pivots that browse the rest of the catalog by the
 * same provider or malware family.
 */
export const IndicatorFlyout: React.FC<{
  indicator: CatalogIndicator;
  onClose: () => void;
  onPivot: (pivot: IndicatorPivot) => void;
}> = ({ indicator, onClose, onPivot }) => (
  <EuiFlyout
    onClose={onClose}
    size='m'
    ownFocus
    aria-labelledby={TITLE_ID}
    data-test-subj='ctiCatalogIndicatorFlyout'
  >
    <EuiFlyoutHeader hasBorder>
      <EuiTitle size='s'>
        <h2 id={TITLE_ID}>
          {i18n.translate(
            'wazuhCheckUpdates.ctiCatalog.indicatorFlyout.title',
            {
              defaultMessage: 'Indicator record',
            },
          )}
        </h2>
      </EuiTitle>
      <EuiSpacer size='s' />
      <CopyableValue
        value={indicator.name}
        data-test-subj='ctiCatalogIndicatorFlyoutValue'
      />
    </EuiFlyoutHeader>
    <EuiFlyoutBody>
      <EuiCallOut
        size='s'
        iconType='iInCircle'
        title={i18n.translate(
          'wazuhCheckUpdates.ctiCatalog.indicatorFlyout.feedKnowledge',
          {
            defaultMessage:
              'Feed knowledge: a provider reported this value as malicious. It is not evidence that the value was seen on your endpoints.',
          },
        )}
      />
      <EuiSpacer size='m' />
      <IndicatorDetails indicator={indicator} />
    </EuiFlyoutBody>
    <EuiFlyoutFooter>
      <EuiFlexGroup gutterSize='s' responsive={false} wrap>
        {indicator.provider ? (
          <EuiFlexItem grow={false}>
            <EuiButtonEmpty
              size='s'
              iconType='filter'
              onClick={() => onPivot({ provider: indicator.provider })}
              data-test-subj='ctiCatalogIndicatorFlyoutPivotProvider'
            >
              {i18n.translate(
                'wazuhCheckUpdates.ctiCatalog.indicatorFlyout.pivotProvider',
                {
                  defaultMessage: 'Browse indicators from {provider}',
                  values: { provider: getProviderLabel(indicator.provider) },
                },
              )}
            </EuiButtonEmpty>
          </EuiFlexItem>
        ) : null}
        {indicator.software?.name ? (
          <EuiFlexItem grow={false}>
            <EuiButtonEmpty
              size='s'
              iconType='filter'
              onClick={() => onPivot({ family: indicator.software?.name })}
              data-test-subj='ctiCatalogIndicatorFlyoutPivotFamily'
            >
              {i18n.translate(
                'wazuhCheckUpdates.ctiCatalog.indicatorFlyout.pivotFamily',
                {
                  defaultMessage: 'Browse {family} indicators',
                  values: { family: getFamilyLabel(indicator.software.name) },
                },
              )}
            </EuiButtonEmpty>
          </EuiFlexItem>
        ) : null}
      </EuiFlexGroup>
    </EuiFlyoutFooter>
  </EuiFlyout>
);
