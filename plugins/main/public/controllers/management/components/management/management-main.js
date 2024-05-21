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
import { withGuardAsync } from '../../../../components/common/hocs';
import { compose } from 'redux';
import { ClusterOverview } from './cluster/cluster-overview';

class WzManagementMain extends Component {
  constructor(props) {
    super(props);
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
            <WzConfiguration
              agent={{
                id: '000',
              }}
            />
          )) ||
          (section === SECTION_DECODERS_SECTION && <WzDecoders />) ||
          (section === SECTION_CDBLIST_SECTION && <WzCDBLists />) ||
          (['ruleset', SECTION_RULES_SECTION].includes(section) && (
            <WzRuleset />
          ))}
      </Fragment>
    );
  }
}

const availableViews = [
  'groups',
  'status',
  'reporting',
  'statistics',
  'logs',
  'configuration',
  'decoders',
  'lists',
  'ruleset',
  'rules',
  'monitoring',
];

export const ManagementRouter = compose(
  withGuardAsync(
    ({ location }) => {
      // TODO: Test if URLSearchParams works correctly with location.search,
      // location.href may have to be used instead
      const section = new URLSearchParams(location.search).get('tab');

      if (availableViews.includes(section)) {
        return { ok: false, data: { section } };
      }
      return { ok: true, data: { section } };
    },
    () => null,
  ),
)(({ section }) => <WzManagementMain section={section} />);

export default ManagementRouter;
