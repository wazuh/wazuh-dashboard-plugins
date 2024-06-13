/*
 * Wazuh app - React component for all management section.
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
import WzRuleset from './ruleset/main-ruleset';
import WzCDBLists from './cdblists/main-cdblists';
import WzDecoders from './decoders/main-decoders';
import WzGroups from './groups/groups-main';
import WzStatus from './status/status-main';
import WzLogs from './mg-logs/logs';
import WzReporting from './reporting/reporting-main';
import WzConfiguration from './configuration/configuration-main';
import WzStatistics from './statistics/statistics-main';
import {
  SECTION_CDBLIST_SECTION,
  SECTION_DECODERS_SECTION,
  SECTION_RULES_SECTION,
} from './common/constants';
import { ClusterOverview } from './cluster/cluster-overview';
import { Switch, Route } from '../../../../components/router-search';

const WzManagementMain = props => (
  <Switch>
    <Route path='?tab=groups'>
      <WzGroups {...props} />
    </Route>
    <Route path='?tab=status'>
      <WzStatus />
    </Route>
    <Route path='?tab=monitoring'>
      <ClusterOverview />
    </Route>
    <Route path='?tab=reporting'>
      <WzReporting />
    </Route>
    <Route path='?tab=statistics'>
      <WzStatistics />
    </Route>
    <Route path='?tab=logs'>
      <WzLogs />
    </Route>
    <Route path='?tab=configuration'>
      <WzConfiguration
        agent={{
          id: '000',
        }}
      />
    </Route>
    <Route path={`?tab=${SECTION_DECODERS_SECTION}`}>
      <WzDecoders />
    </Route>
    <Route path={`?tab=${SECTION_CDBLIST_SECTION}`}>
      <WzCDBLists />
    </Route>
    <Route path={`?tab=ruleset`}>
      <WzRuleset />
    </Route>
    <Route path={`?tab=${SECTION_RULES_SECTION}`}>
      <WzRuleset />
    </Route>
  </Switch>
);

export default WzManagementMain;
