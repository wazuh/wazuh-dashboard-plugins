import React from 'react';
import { Inventory } from './index';
import '../../common/modules/module.scss';
import { connect } from 'react-redux';
import { PromptNoSelectedAgent } from '../prompt-no-selected-agent';
import { PromptNoActiveAgent } from '../prompt-no-active-agent';
import { compose } from 'redux';
import { withGuard, withUserAuthorizationPrompt } from '../../common/hocs';

const mapStateToProps = state => ({
  currentAgentData: state.appStateReducers.currentAgentData
});

export const MainFim = compose(
  withUserAuthorizationPrompt([
    { action: 'agent:read', resource: 'agent:id:*' },
    { action: 'syscheck:read', resource: 'agent:id:*' },
  ]),
  connect(mapStateToProps),
  withGuard(props => !(props.currentAgentData && props.currentAgentData.id) && !props.agent, () => <PromptNoSelectedAgent body='You need to select an agent to see Integrity Monitoring inventory.'/>),
  withGuard(props => {
    const agentData = (props.currentAgentData && props.currentAgentData.id) ? props.currentAgentData : props.agent;
    return agentData.status !== 'active'
  }, () => <PromptNoActiveAgent />)
  )(function MainFim({ currentAgentData, agent, ...rest}) {
    const agentData = (currentAgentData && currentAgentData.id) ? currentAgentData : agent;
    return (
      <div>
        <Inventory {...rest} agent={agentData}/>
      </div>
    );
  }
);
