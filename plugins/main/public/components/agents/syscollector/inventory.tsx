/*
 * Wazuh app - React component to integrate plugin platform search bar
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
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiCallOut,
  EuiPanel,
  EuiSpacer,
  EuiPage,
} from '@elastic/eui';
import { API_NAME_AGENT_STATUS } from '../../../../common/constants';
import { compose } from 'redux';
import { withGuard } from '../../common/hocs';
import { PromptAgentNeverConnected } from '../prompts';
import { AgentInfo } from '../../common/welcome/agent-info/agent-info';
import SoftwareTab from './software';
import NetworkTab from './network';
import ProcessesTab from './processes';

export const SyscollectorInventory = compose(
  withGuard(
    props =>
      props.agent &&
      props.agent.status === API_NAME_AGENT_STATUS.NEVER_CONNECTED,
    PromptAgentNeverConnected,
  ),
)(function SyscollectorInventory(props) {
  const { agent, section } = props;
  let soPlatform;
  if (agent?.os?.uname?.includes('Linux')) {
    soPlatform = 'linux';
  } else if (agent?.os?.platform === 'windows') {
    soPlatform = 'windows';
  } else if (agent?.os?.platform === 'darwin') {
    soPlatform = 'apple';
  } else if (agent?.os?.uname?.toLowerCase().includes('freebsd')) {
    soPlatform = 'freebsd';
  } else if (agent?.os?.uname?.toLowerCase().includes('sunos')) {
    soPlatform = 'solaris';
  }

  return (
    <EuiPage paddingSize='m' direction='column' style={{ overflow: 'hidden' }}>
      {agent?.status === API_NAME_AGENT_STATUS.DISCONNECTED && (
        <EuiFlexGroup gutterSize='s'>
          <EuiFlexItem>
            <EuiCallOut
              title='This agent is currently disconnected, the data may be outdated.'
              iconType='iInCircle'
            />
          </EuiFlexItem>
        </EuiFlexGroup>
      )}

      <EuiFlexGroup gutterSize='s'>
        <EuiFlexItem>
          <EuiPanel grow paddingSize='s'>
            <AgentInfo
              agent={props.agent}
              isCondensed={false}
              hideActions={true}
              {...props}
            ></AgentInfo>
          </EuiPanel>
        </EuiFlexItem>
      </EuiFlexGroup>

      <EuiSpacer size='xxl' />

      {section === 'software' && (
        <SoftwareTab agent={agent} soPlatform={soPlatform} />
      )}
      {section === 'network' && (
        <NetworkTab agent={agent} soPlatform={soPlatform} />
      )}
      {section === 'processes' && (
        <ProcessesTab agent={agent} soPlatform={soPlatform} />
      )}
    </EuiPage>
  );
});
