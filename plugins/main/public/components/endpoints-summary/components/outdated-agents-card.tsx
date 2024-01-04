import React from 'react';
import {
  EuiFlexItem,
  EuiCard,
  EuiIcon,
  EuiStat,
  EuiTextColor,
  EuiPopover,
  EuiPopoverFooter,
  EuiLink,
  EuiButtonEmpty,
} from '@elastic/eui';
import './outdated-agents-card.scss';
import { getOutdatedAgents } from '../services/get-outdated-agents';
import { useApiService } from '../../common/hooks/useApiService';
import { webDocumentationLink } from '../../../../common/services/web_documentation';

interface OutdatedAgentsCardProps {
  onClick?: (status: any) => void;
}

const OutdatedAgentsCard = ({ onClick }: OutdatedAgentsCardProps) => {
  const [loading, data] = useApiService<any>(getOutdatedAgents, undefined);
  const outdatedAgents = data?.length;
  const contentType = outdatedAgents > 0 ? 'warning' : 'success';
  const contentIcon = outdatedAgents > 0 ? 'alert' : 'check';
  const [showOutdatedAgents, setShowOutdatedAgents] =
    React.useState<boolean>(false);

  const onShowOutdatedAgents = () => setShowOutdatedAgents(!showOutdatedAgents);
  const onHideOutdatedAgents = () => setShowOutdatedAgents(false);

  const handleClick = () => {
    if (onClick) {
      onClick(data);
    }
  };

  const renderMetric = () => {
    return (
      <div
        className='wazuh-outdated-agents-panel'
        onClick={onShowOutdatedAgents}
      >
        <EuiStat
          className='wazuh-outdated-metric'
          title={
            <EuiTextColor color={contentType}>
              <EuiIcon
                type={contentIcon}
                color={contentType}
                className='wazuh-outdated-icon'
              />{' '}
              {outdatedAgents}
            </EuiTextColor>
          }
          description=''
          titleColor='danger'
          isLoading={loading}
          titleSize='l'
          textAlign='center'
        />
      </div>
    );
  };

  return (
    <EuiFlexItem>
      <EuiCard title='' betaBadgeLabel='Outdated agents' className='eui-panel'>
        <EuiPopover
          button={renderMetric()}
          isOpen={showOutdatedAgents}
          closePopover={onHideOutdatedAgents}
          anchorPosition='downLeft'
        >
          <EuiButtonEmpty iconType='filter' onClick={handleClick}>
            Filter outdated agents
          </EuiButtonEmpty>
          <EuiPopoverFooter>
            <EuiTextColor color='subdued'>
              <EuiLink
                href={webDocumentationLink(
                  'upgrade-guide/wazuh-agent/index.html',
                )}
                target='_blank'
                external
                rel='noopener noreferrer'
              >
                How to update agents
              </EuiLink>
            </EuiTextColor>
          </EuiPopoverFooter>
        </EuiPopover>
      </EuiCard>
    </EuiFlexItem>
  );
};

export default OutdatedAgentsCard;
