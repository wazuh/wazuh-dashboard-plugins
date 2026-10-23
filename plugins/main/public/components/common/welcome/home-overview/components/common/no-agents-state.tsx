import React from 'react';
import { i18n } from '@osd/i18n';
import { EuiEmptyPrompt } from '@elastic/eui';
import { WzButtonPermissions } from '../../../../permissions/button';

export interface NoAgentsStateProps {
  /** Deploy-agent wizard href; passed in so this stays presentational. */
  deployAgentUrl: string;
  ['data-test-subj']?: string;
}

/**
 * Body of a card fed only by agents, when the instance has none registered.
 * Styled like the "Agents by status" empty prompt.
 */
export const NoAgentsState: React.FC<NoAgentsStateProps> = ({
  deployAgentUrl,
  ...rest
}) => (
  <EuiEmptyPrompt
    data-test-subj={rest['data-test-subj']}
    body={
      <p>
        {i18n.translate('wazuh.common.homeOverviewNoAgentsState.message', {
          defaultMessage: 'No data yet. Deploy an agent to see results here.',
        })}
      </p>
    }
    actions={
      <WzButtonPermissions
        color='primary'
        fill
        permissions={[{ action: 'agent:create', resource: '*:*:*' }]}
        iconType='plusInCircle'
        href={deployAgentUrl}
      >
        {i18n.translate('wazuh.common.homeOverviewNoAgentsState.deployButton', {
          defaultMessage: 'Deploy new agent',
        })}
      </WzButtonPermissions>
    }
  />
);
