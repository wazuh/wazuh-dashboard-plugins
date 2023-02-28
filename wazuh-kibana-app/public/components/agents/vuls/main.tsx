import React from 'react';
import { Inventory } from './index';
import '../../common/modules/module.scss';
import { connect } from 'react-redux';
import { PromptNoSelectedAgent, PromptNoActiveAgent } from '../prompts';
import { compose } from 'redux';
import { withGuard, withUserAuthorizationPrompt, withAgentSupportModule } from '../../common/hocs';

const mapStateToProps = (state) => ({
  currentAgentData: state.appStateReducers.currentAgentData,
});

export const MainVuls = compose(
  withAgentSupportModule,
  connect(mapStateToProps),
  withGuard(
    (props) => !((props.currentAgentData && props.currentAgentData.id) && props.agent),
    () => (
      <PromptNoSelectedAgent body="You need to select an agent to see it's vulnerabilities." />
    )
  ),
  withUserAuthorizationPrompt((props) => {
    const agentData =
      props.currentAgentData && props.currentAgentData.id ? props.currentAgentData : props.agent;
    return [
      [
        { action: 'agent:read', resource: `agent:id:${agentData.id}` },
        ...(agentData.group || []).map(group => ({ action: 'agent:read', resource: `agent:group:${group}` }))
      ],
      [
        { action: 'vulnerability:read', resource: `agent:id:${agentData.id}` },
        ...(agentData.group || []).map(group => ({ action: 'vulnerability:read', resource: `agent:group:${group}` }))
      ]
    ];
  })
)(function MainVuls({ currentAgentData, agent, ...rest }) {
  const agentData = currentAgentData && currentAgentData.id ? currentAgentData : agent;
  return (
    <div>
      <Inventory {...rest} agent={agentData} />
    </div>
  );
});
