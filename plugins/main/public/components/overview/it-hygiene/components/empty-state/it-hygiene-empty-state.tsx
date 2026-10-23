import React from 'react';
import { EuiCallOut, EuiPanel, EuiText } from '@elastic/eui';
import { i18n } from '@osd/i18n';

/**
 * Replaces the generic no results callout of IT Hygiene. An empty inventory usually means that no
 * agent has reported yet or that the first inventory is still syncing, not that something broke.
 */
export const ITHygieneEmptyState = () => (
  <EuiPanel hasBorder={false} hasShadow={false} color='transparent'>
    <EuiCallOut
      title={i18n.translate('wazuh.itHygiene.emptyState.title', {
        defaultMessage: 'No inventory data for the current search',
      })}
      color='warning'
      iconType='help'
      data-test-subj='wzITHygieneEmptyState'
    >
      <EuiText size='s'>
        <p>
          {i18n.translate('wazuh.itHygiene.emptyState.reasons', {
            defaultMessage:
              'No agent has reported its inventory yet, or the first inventory is still syncing. How often agents report it depends on their configuration, so check again in a few minutes. If it never arrives, check that the Syscollector module is configured in the agents. If the data should be there, try changing the search or the time range. Use About IT Hygiene to learn what this page shows.',
          })}
        </p>
      </EuiText>
    </EuiCallOut>
  </EuiPanel>
);
