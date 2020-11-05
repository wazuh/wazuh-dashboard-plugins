import React from 'react';
import { Inventory } from './index';
import { connect } from 'react-redux';
import { compose } from 'redux';
import { PromptNoSelectedAgent } from '../prompt-no-selected-agent'; 
import { withGuard } from '../../common/hocs';

const mapStateToProps = state => ({
  currentAgentData: state.appStateReducers.currentAgentData
});

export const MainSca = compose(
  connect(mapStateToProps),
  withGuard(props => !(props.currentAgentData && props.currentAgentData.id) && !props.agent, () => <PromptNoSelectedAgent body='You need to select an agent to see Security Configuration Assessment inventory.'/>)
  )(function MainSca({ selectView, currentAgentData, agent, ...rest}) {
    const agentData = (currentAgentData && currentAgentData.id) ? currentAgentData : agent;
    return (
      <div>
        <Inventory {...rest} agent={agentData}/>
      </div>
    );
  }
);