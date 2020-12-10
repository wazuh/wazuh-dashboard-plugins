/*
 * Wazuh app - React component for main overview
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

import React, { useEffect, useState } from 'react';
import { compose } from 'redux';
import AppState from '../../../react-services/app-state';
import { withGlobalBreadcrumb } from '../../common/hocs/withGlobalBreadcrumb';
import { OverviewWelcome } from '../components/overview-welcome';
import { OverviewStats } from '../components/overview-stats';
import { useHistory } from 'react-router-dom';
import { useAgentsSummary } from '../../common/hooks/agents/use-agents-summary';
import { EuiFlexGroup, EuiFlexItem } from '@elastic/eui';

export const MainOverview = compose(withGlobalBreadcrumb([{ text: '' }, { text: 'Modules' }]))(
  () => {
    const [extensions, setExtensions] = useState({});
    const [agentsSummaryLoading, agentsSummary, agentsSummaryError] = useAgentsSummary();
    const history = useHistory();

    useEffect(() => {
      const currentApi = JSON.parse(AppState.getCurrentAPI() || '{}');
      if (!currentApi.id) {
        history.push('/health-check');
      }
      AppState.getExtensions(currentApi.id).then((_extensions) => {
        setExtensions(_extensions);
      });
    }, []);

    return (
      <EuiFlexGroup direction="column">
        <EuiFlexItem grow={false}>
          <OverviewStats summary={agentsSummary} />
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <OverviewWelcome extensions={extensions} />
        </EuiFlexItem>
      </EuiFlexGroup>
    );
  }
);
