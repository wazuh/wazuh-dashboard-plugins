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
import { webDocumentationLink } from '../../../../../common/services/web_documentation';

interface OutdatedAgentsCardProps {
  isLoading: boolean;
  outdatedAgents: number;
  filterByOutdatedAgent: (value: boolean) => void;
}

const OutdatedAgentsCard = ({
  isLoading,
  outdatedAgents,
  filterByOutdatedAgent,
}: OutdatedAgentsCardProps) => {
  const contentType = outdatedAgents > 0 ? 'warning' : 'success';
  const contentIcon = outdatedAgents > 0 ? 'alert' : 'check';
  const [showOptions, setShowOptions] = React.useState<boolean>(false);

  const onShowOptions = () => setShowOptions(true);
  const onHideOptions = () => setShowOptions(false);

  const renderMetric = () => {
    return (
      <div className='wazuh-outdated-agents-panel' onClick={onShowOptions}>
        <EuiIcon
          type={contentIcon}
          color={contentType}
          className='wazuh-outdated-icon'
        />
        <EuiStat
          className='wazuh-outdated-metric'
          title={
            <EuiTextColor
              data-testid='wazuh-endpoints-summary-outdated-agents-number'
              color={contentType}
            >
              {outdatedAgents}
            </EuiTextColor>
          }
          description={
            <EuiTextColor color={contentType}>
              <small>{outdatedAgents === 1 ? 'Agent' : 'Agents'}</small>
            </EuiTextColor>
          }
          titleColor='subdued'
          isLoading={isLoading}
          titleSize='l'
          textAlign='center'
          reverse
        />
      </div>
    );
  };

  return (
    <EuiFlexItem>
      <EuiCard title='' betaBadgeLabel='Outdated'>
        <EuiPopover
          button={renderMetric()}
          isOpen={showOptions}
          closePopover={onHideOptions}
          anchorPosition='downLeft'
          panelStyle={{ overflowY: 'auto' }}
        >
          <EuiButtonEmpty
            iconType='filter'
            onClick={() => {
              onHideOptions();
              filterByOutdatedAgent(true);
            }}
            isDisabled={!outdatedAgents}
          >
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
                onClick={() => onHideOptions()}
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
