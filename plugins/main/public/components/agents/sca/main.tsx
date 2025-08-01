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
import { SCAInventory } from './index';
import { compose } from 'redux';
import { withAgent, withUserAuthorizationPrompt } from '../../common/hocs';
import { DashboardSCA } from './components/dashboard/sca-dashboard';
import { withSCADataSource } from './hocs/validate-sca-states-index-pattern';

export const MainSca = compose(
  withUserAuthorizationPrompt([
    [
      { action: 'agent:read', resource: 'agent:id:*' },
      { action: 'agent:read', resource: 'agent:group:*' },
    ],
    [
      { action: 'sca:read', resource: 'agent:id:*' },
      { action: 'sca:read', resource: 'agent:group:*' },
    ],
  ]),
  withAgent,
  withUserAuthorizationPrompt(props => {
    const agentData =
      props.currentAgentData && props.currentAgentData.id
        ? props.currentAgentData
        : props.agent;
    return [
      [
        { action: 'agent:read', resource: `agent:id:${agentData.id}` },
        ...(agentData.group || []).map(group => ({
          action: 'agent:read',
          resource: `agent:group:${group}`,
        })),
      ],
      [
        { action: 'sca:read', resource: `agent:id:${agentData.id}` },
        ...(agentData.group || []).map(group => ({
          action: 'sca:read',
          resource: `agent:group:${group}`,
        })),
      ],
    ];
  }),
  withSCADataSource,
)(function MainSca({ selectView, ...rest }) {
  return (
    <>
      {selectView === 'inventory' ? (
        // @ts-ignore
        <SCAInventory {...rest} />
      ) : (
        <DashboardSCA {...rest} />
      )}
    </>
  );
});
