import React from 'react';
import {
  EuiFlexItem,
  EuiCard,
  EuiIcon,
  EuiStat,
  EuiTextColor,
} from '@elastic/eui';
import './outdated-agents-card.scss';
import { getOutdatedAgents } from '../services/get-outdated-agents';
import { useApiService } from '../../common/hooks/useApiService';

const OutdatedAgentsCard = () => {
  const [loading, data] = useApiService<any>(getOutdatedAgents, undefined);
  const outdatedAgents = data?.length;
  const contentType = outdatedAgents > 0 ? 'warning' : 'success';
  const contentIcon = outdatedAgents > 0 ? 'alert' : 'check';
  return (
    <EuiFlexItem>
      <EuiCard title='' betaBadgeLabel='Outdated agents' className='eui-panel'>
        <div className='wazuh-outdated-agents-panel'>
          <EuiStat
            className='wazuh-outdated-metric'
            title={
              <EuiTextColor color={contentType}>
                <span>
                  <EuiIcon
                    type={contentIcon}
                    color={contentType}
                    className='wazuh-outdated-icon'
                  />{' '}
                  {outdatedAgents}
                </span>
              </EuiTextColor>
            }
            description='Agents that need to be updated'
            titleColor='danger'
            isLoading={loading}
            titleSize='l'
            textAlign='center'
          />
        </div>
      </EuiCard>
    </EuiFlexItem>
  );
};

export default OutdatedAgentsCard;
