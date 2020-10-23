import React from 'react';
import { Inventory } from './index';
import '../../common/modules/module.less';
import { connect } from 'react-redux';
import { PromptNoSelectedAgent } from '../prompt-no-selected-agent'; 
import { PromptNoActiveAgent } from '../prompt-no-active-agent'; 
import { compose } from 'redux';
import { withGuard } from '../../common/hocs';

const mapStateToProps = state => ({
  currentAgentData: state.appStateReducers.currentAgentData
});

export const MainFim = compose(
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
