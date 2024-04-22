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
import React, { Component, Fragment } from 'react';
// Redux
import store from '../../../../redux/store';

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

class WzManagementMain extends Component {
  constructor(props) {
    super(props);
    this.state = {};
    this.store = store;
  }

  render() {
    const { section } = this.props;
    return (
      <Fragment>
        {(section === 'groups' && <WzGroups {...this.props} />) ||
          (section === 'status' && <WzStatus />) ||
          (section === 'monitoring' && <ClusterOverview />) ||
          (section === 'reporting' && <WzReporting />) ||
          (section === 'statistics' && <WzStatistics />) ||
          (section === 'logs' && <WzLogs />) ||
          (section === 'configuration' && (
            <WzConfiguration {...this.props.configurationProps} />
          )) ||
          (section === SECTION_DECODERS_SECTION && (
            <WzDecoders logtestProps={this.props.logtestProps} />
          )) ||
          (section === SECTION_CDBLIST_SECTION && (
            <WzCDBLists logtestProps={this.props.logtestProps} />
          )) ||
          (['ruleset', SECTION_RULES_SECTION].includes(section) && (
            <WzRuleset logtestProps={this.props.logtestProps} />
          ))}
      </Fragment>
    );
  }
}

export default WzManagementMain;
