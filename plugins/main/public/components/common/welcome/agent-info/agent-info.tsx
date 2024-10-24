/*
 * Wazuh app - React component for showing agent fields such as IP, ID, name,
 * version, OS, registration date, last keep alive.
 *
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import React, { Component } from 'react';
import { EuiFlexGroup } from '@elastic/eui';
import { WzRequest } from '../../../../react-services/wz-request';
import { formatUIDate } from '../../../../react-services/time-service';
import './agent-info.scss';
import { Agent } from '../../../endpoints-summary/types';
import RibbonItem, { type IRibbonItem } from '../../ribbon/ribbon-item';

interface AgentInfoProps {
  agent: Agent;
  goGroups?: (agent: Agent, key: number) => void;
  isCondensed?: boolean;
}

export class AgentInfo extends Component<AgentInfoProps> {
  constructor(props: AgentInfoProps) {
    super(props);
  }

  async componentDidMount() {
    const managerVersion = await WzRequest.apiReq('GET', '/', {});
    this.setState({
      managerVersion: managerVersion?.data?.data?.api_version || {},
    });
  }

  render() {
    const { agent } = this.props;
    let arrayStats: IRibbonItem[];

    if (this.props.isCondensed) {
      arrayStats = [
        { value: agent.id, label: 'ID', style: { maxWidth: 100 } },
        {
          value: agent.status,
          label: 'Status',
          style: { maxWidth: 150 },
        },
        {
          value: agent.version,
          label: 'Version',
          style: { maxWidth: 150 },
        },
        {
          value: agent.name,
          label: 'Operating system',
          style: { minWidth: 200, maxWidth: 200 },
        },
      ];
    } else {
      arrayStats = [
        { value: agent.id, label: 'ID', style: { minWidth: 30 } },
        {
          value: agent.status,
          label: 'Status',
          style: { minWidth: 100 },
        },
        {
          value: agent.ip,
          label: 'IP address',
          style: {},
        },
        {
          value: agent.version,
          label: 'Version',
          style: { minWidth: 100 },
        },
        { value: agent.group, label: 'Groups', style: { minWidth: 150 } },
        {
          value: agent.name,
          label: 'Operating system',
          style: { minWidth: 150 },
        },
        {
          value:
            agent.node_name && agent.node_name !== 'unknown'
              ? agent.node_name
              : '-',
          label: 'Cluster node',
          style: { minWidth: 120 },
        },
        {
          value: formatUIDate(agent.dateAdd),
          label: 'Registration date',
          style: { minWidth: 180 },
        },
        {
          value: formatUIDate(agent.lastKeepAlive),
          label: 'Last keep alive',
          style: { minWidth: 180 },
        },
      ];
    }

    return (
      <EuiFlexGroup
        data-test-subj='agent-info'
        wrap
        style={{ responsive: true }}
      >
        {arrayStats.map(item => (
          <RibbonItem agent={agent} item={item} />
        ))}
      </EuiFlexGroup>
    );
  }
}
