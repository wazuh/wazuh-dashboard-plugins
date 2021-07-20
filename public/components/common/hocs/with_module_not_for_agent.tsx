

import { compose } from 'redux';
import { connect } from 'react-redux';
import { withGuard } from './withGuard';
import { PromptModuleNotForAgent } from '../../agents/prompts';
import React from 'react';

const mapStateToProps = (state) => ({
  agent: state.appStateReducers.currentAgentData,
});

export const withModuleNotForAgent = WrappedComponent => compose(
  connect(mapStateToProps),
  withGuard(
    ({agent}) => agent?.id,
    (props) => <PromptModuleNotForAgent title='Module not avaliable for agents' body='Remove the pinned agent.' {...props}/>
  )
)(WrappedComponent);
