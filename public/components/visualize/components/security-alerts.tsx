/*
 * Wazuh app - React component for Visualize.
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
  useFilterManager,
  useQuery,
  useRefreshAngularDiscover,
} from '../../common/hooks';
import { Discover } from '../../common/modules/discover';
import { useAllowedAgents } from '../../common/hooks/useAllowedAgents';

import { i18n } from '@kbn/i18n';

const label1 = i18n.translate(
  'wazuh.components.visualize.components.security.alert.label1',
  {
    defaultMessage: 'Technique(s)',
  },
);
const label2 = i18n.translate(
  'wazuh.components.visualize.components.security.alert.label2',
  {
    defaultMessage: 'Tactic(s)',
  },
);
const label3 = i18n.translate(
  'wazuh.components.visualize.components.security.alert.label3',
  {
    defaultMessage: 'Description',
  },
);
const label4 = i18n.translate(
  'wazuh.components.visualize.components.security.alert.label4',
  {
    defaultMessage: 'Level',
  },
);
const label5 = i18n.translate(
  'wazuh.components.visualize.components.security.alert.label5',
  {
    defaultMessage: 'Rule ID',
  },
);
const label6 = i18n.translate(
  'wazuh.components.visualize.components.security.alert.label6',
  {
    defaultMessage: 'Agent',
  },
);
const label7 = i18n.translate(
  'wazuh.components.visualize.components.security.alert.label7',
  {
    defaultMessage: 'Agent name',
  },
);
export const SecurityAlerts = ({
  initialColumns = [
    { field: 'icon' },
    { field: 'timestamp' },
    { field: 'agent.id', label: label6 },
    { field: 'agent.name', label: label7 },
    { field: 'rule.mitre.id', label: label1 },
    { field: 'rule.mitre.tactic', label: label2 },
    { field: 'rule.description', label: label3 },
    { field: 'rule.level', label: label4 },
    { field: 'rule.id', label: label5 },
  ],
  initialAgentColumns = [
    { field: 'icon' },
    { field: 'timestamp' },
    { field: 'rule.mitre.id', label: label1 },
    { field: 'rule.mitre.tactic', label: label2 },
    { field: 'rule.description', label: label3 },
    { field: 'rule.level', label: label4 },
    { field: 'rule.id', label: label5 },
  ],
  useAgentColumns = true,
}) => {
  const [query] = useQuery();
  const { filterManager } = useFilterManager();
  const refreshAngularDiscover = useRefreshAngularDiscover();

  const customFilterWithAllowedAgents = [];
  const { filterAllowedAgents } = useAllowedAgents();
  filterAllowedAgents &&
    customFilterWithAllowedAgents.push(filterAllowedAgents);

  return (
    <Discover
      shareFilterManager={filterManager}
      shareFilterManagerWithUserAuthorized={customFilterWithAllowedAgents}
      query={query}
      initialColumns={initialColumns}
      initialAgentColumns={useAgentColumns ? initialAgentColumns : undefined}
      implicitFilters={[]}
      initialFilters={[]}
      updateTotalHits={total => {}}
      refreshAngularDiscover={refreshAngularDiscover}
    />
  );
};
