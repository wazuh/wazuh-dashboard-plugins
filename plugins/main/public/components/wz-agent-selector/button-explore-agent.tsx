import React from 'react';
import { WzButton } from '../common/buttons';
import { PinnedAgentManager } from './wz-agent-selector-service';
import { WzButtonType } from '../common/buttons/button';
import { connect } from 'react-redux';
import { showExploreAgentModalGlobal } from '../../redux/actions/appStateActions';
import './button-explore-agent.scss';
import clsx from 'clsx';

interface ButtonPinnedAgentProps {
  showExploreAgentModalGlobal: (shouldShow: boolean) => void;
  module?: {
    availableFor?: string[];
  };
  onUnpinAgent?: () => void;
}

const ButtonPinnedAgent = ({
  showExploreAgentModalGlobal,
  module,
  onUnpinAgent,
}: ButtonPinnedAgentProps) => {
  const pinnedAgentManager = new PinnedAgentManager();
  const agent = pinnedAgentManager.isPinnedAgent()
    ? pinnedAgentManager.getPinnedAgent()
    : null;
  const avaliableForAgent = module
    ? module?.availableFor && module?.availableFor.includes('agent')
    : true;

  const unPinAgentHandler = () => {
    pinnedAgentManager.unPinAgent();
    onUnpinAgent?.();
  };

  return (
    <div
      data-test-subj='explore-agent-button'
      style={{ display: 'inline-flex' }}
    >
      <WzButton
        buttonType={WzButtonType.empty}
        color='primary'
        isDisabled={!avaliableForAgent}
        tooltip={{
          position: 'bottom',
          content: !avaliableForAgent
            ? 'This module is not supported for agents.'
            : agent
            ? 'Change agent selected'
            : 'Select an agent to explore its modules',
        }}
        className={clsx({ 'wz-unpin-agent-bg': agent })}
        iconType='watchesApp'
        onClick={() => showExploreAgentModalGlobal(true)}
      >
        {agent ? `${agent.name} (${agent.id})` : 'Explore agent'}
      </WzButton>
      {agent ? (
        <WzButton
          buttonType={WzButtonType.icon}
          className='wz-unpin-agent wz-unpin-agent-bg'
          iconType='pinFilled'
          onClick={unPinAgentHandler}
          tooltip={{ position: 'bottom', content: 'Unpin agent' }}
          aria-label='Unpin agent'
        />
      ) : null}
    </div>
  );
};

const mapStateToProps = state => {
  return {
    state: state.appStateReducers,
  };
};

const mapDispatchToProps = dispatch => ({
  showExploreAgentModalGlobal: (shouldShow: boolean) =>
    dispatch(showExploreAgentModalGlobal(shouldShow)),
});

export const ButtonExploreAgent = connect(
  mapStateToProps,
  mapDispatchToProps,
)(ButtonPinnedAgent);
