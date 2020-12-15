/*
 * Wazuh app - React component for showing stats about agents.
 *
 * Copyright (C) 2015-2020 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import React from 'react';
import { EuiStat, EuiFlexItem, EuiFlexGroup, EuiPage, EuiToolTip } from '@elastic/eui';
import { AgentsSummary } from '../../common/hooks/types';

interface IOverviewStastsProps {
  summary: AgentsSummary;
}

export const OverviewStats = (props: IOverviewStastsProps) => {
  const goToAgents = (status) => {
    if (status) {
      sessionStorage.setItem(
        'agents_preview_selected_options',
        JSON.stringify([{ field: 'q', value: `status=${status}` }])
      );
    } else if (sessionStorage.getItem('agents_preview_selected_options')) {
      sessionStorage.removeItem('agents_preview_selected_options');
    }
    window.location.href = '#/agents-preview';
  };

  return (
    <EuiPage>
      <EuiFlexGroup>
        <EuiFlexItem />
        <EuiFlexItem>
          <EuiStat
            title={
              <EuiToolTip position="top" content={`Go to all agents`}>
                <span
                  className={'statWithLink'}
                  style={{ cursor: 'pointer' }}
                  onClick={() => goToAgents(null)}                  
                  data-test-subj='spanTotalAgents'
                >
                  {props.summary.total || '-'}
                </span>
              </EuiToolTip>
            }
            description="Total agents"
            titleColor="primary"
            textAlign="center"
          />
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiStat
            title={
              <EuiToolTip position="top" content={`Go to active agents`}>
                <span
                  onClick={() => goToAgents('active')}
                  className={'statWithLink'}
                  style={{ cursor: 'pointer' }}
                  data-test-subj='spanActiveAgents'
                >
                  {props.summary.active || '-'}
                </span>
              </EuiToolTip>
            }
            description="Active agents"
            titleColor="secondary"
            textAlign="center"
          />
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiStat
            title={
              <EuiToolTip position="top" content={`Go to disconnected agents`}>
                <span
                  onClick={() => goToAgents('disconnected')}
                  className={'statWithLink'}
                  style={{ cursor: 'pointer' }}
                  data-test-subj='spanDisconnectedAgents'
                >
                  {props.summary.disconnected || '-'}
                </span>
              </EuiToolTip>
            }
            description="Disconnected agents"
            titleColor="danger"
            textAlign="center"
          />
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiStat
            title={
              <EuiToolTip position="top" content={`Go to never connected agents`}>
                <span
                  onClick={() => goToAgents('never_connected')}
                  className={'statWithLink'}
                  style={{ cursor: 'pointer' }}
                  data-test-subj='spanNeverConnectedAgents'
                >
                  {props.summary.never_connected || '-'}
                </span>
              </EuiToolTip>
            }
            description="Never connected agents"
            titleColor="subdued"
            textAlign="center"
          />
        </EuiFlexItem>
        <EuiFlexItem />
      </EuiFlexGroup>
    </EuiPage>
  );
};
