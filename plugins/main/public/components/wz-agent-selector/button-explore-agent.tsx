import React from 'react';
import { WzButton } from '../common/buttons';
import { PinnedAgentManager } from './wz-agent-selector-service';
import { WzButtonType } from '../common/buttons/button';
import { connect } from 'react-redux';
import { showExploreAgentModalGlobal } from '../../redux/actions/appStateActions';
import './button-explore-agent.scss';

const ButtonPinnedAgent = ({ showExploreAgentModalGlobal, module }) => {
  const pinnedAgentManager = new PinnedAgentManager();
  const agent = pinnedAgentManager.isPinnedAgent()
    ? pinnedAgentManager.getPinnedAgent()
    : null;
  const avaliableForAgent = module
    ? module?.availableFor && module?.availableFor.includes('agent')
    : true;
  return (
    <div style={{ display: 'inline-flex' }}>
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
        style={agent ? { background: 'rgba(0, 107, 180, 0.1)' } : undefined}
        iconType='watchesApp'
        onClick={() => showExploreAgentModalGlobal(true)}
      >
        {agent ? `${agent.name} (${agent.id})` : 'Explore agent'}
      </WzButton>
      {agent ? (
        <WzButton
          buttonType={WzButtonType.icon}
          className='wz-unpin-agent'
          iconType='pinFilled'
          onClick={() => {
            pinnedAgentManager.unPinAgent();
          }}
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
  showExploreAgentModalGlobal: data =>
    dispatch(showExploreAgentModalGlobal(data)),
});

export const ButtonExploreAgent = connect(
  mapStateToProps,
  mapDispatchToProps,
)(ButtonPinnedAgent);
