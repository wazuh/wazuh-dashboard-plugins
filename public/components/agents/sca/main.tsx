/*
 * Wazuh app - Main SCA component
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import React from 'react';
import { Inventory } from './index';
import { connect } from 'react-redux';
import { compose } from 'redux';
import { PromptSelectAgent, PromptNoSelectedAgent } from '../prompts';
import { withGuard, withUserAuthorizationPrompt, withAgentSupportModule } from '../../common/hocs';
import { API_NAME_AGENT_STATUS } from '../../../../common/constants';

const mapStateToProps = (state) => ({
  currentAgentData: state.appStateReducers.currentAgentData,
});

export const MainSca = compose(
  withAgentSupportModule,
  withUserAuthorizationPrompt([
    [
      {action: 'agent:read', resource: 'agent:id:*'},
      {action: 'agent:read', resource: 'agent:group:*'}
    ],
    [
      {action: 'sca:read', resource: 'agent:id:*'},
      {action: 'sca:read', resource: 'agent:group:*'}
    ]
  ]),
  connect(mapStateToProps),
  withGuard(
    (props) => !(props.currentAgentData && props.currentAgentData.id && props.agent),
    () => (
      <PromptNoSelectedAgent body="You need to select an agent to see Security Configuration Assessment inventory." />
    )
  ),
  withGuard(
    ({ currentAgentData, agent }) => {
      const agentData = currentAgentData && currentAgentData.id ? currentAgentData : agent;
      return agentData.status === API_NAME_AGENT_STATUS.NEVER_CONNECTED;
    },
    () => (
      <PromptSelectAgent title="Agent has never connected" body="The agent has never been connected please select another" />
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
        { action: 'sca:read', resource: `agent:id:${agentData.id}` },
        ...(agentData.group || []).map(group => ({ action: 'sca:read', resource: `agent:group:${group}` }))
      ]
    ];
  })
)(function MainSca({ selectView, currentAgentData, agent, ...rest }) {
  const agentData = currentAgentData && currentAgentData.id ? currentAgentData : agent;
  return (
    <div>
      <Inventory {...rest} agent={agentData} />
    </div>
  );
});
