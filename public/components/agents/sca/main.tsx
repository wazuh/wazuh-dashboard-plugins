import React from 'react';
import { Inventory } from './index';
import { connect } from 'react-redux';
import { compose } from 'redux';
import { PromptNoSelectedAgent } from '../prompt-no-selected-agent';
import { withGuard, withUserAuthorizationPrompt } from '../../common/hocs';

const mapStateToProps = (state) => ({
  currentAgentData: state.appStateReducers.currentAgentData,
});

export const MainSca = compose(
  connect(mapStateToProps),
  withGuard(
    (props) => !(props.currentAgentData && props.currentAgentData.id && props.agent),
    () => (
      <PromptNoSelectedAgent body="You need to select an agent to see Security Configuration Assessment inventory." />
    )
  ),
  withUserAuthorizationPrompt((props) => {
    const agentData =
      props.currentAgentData && props.currentAgentData.id ? props.currentAgentData : props.agent;
    return [
      { action: 'agent:read', resource: `agent:id:${agentData.id}` },
      { action: 'sca:read', resource: `agent:id:${agentData.id}` },
    ];
  })
)(function MainSca({ selectView, currentAgentData, agent, ...rest }) {
  const agentData = currentAgentData && currentAgentData.id ? currentAgentData : agent;
  return (
    <div>
      {agentData.status === 'never_connected' && <PromptNoSelectedAgent title= "Agent never connected" body="The agent has never been connected please select other" />}
      {agentData.status !== 'never_connected' && <Inventory {...rest} agent={agentData} />}
    </div>
  );
});
