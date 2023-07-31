/*
 * Wazuh app - React component for show configuration of policy monitoring - system audit tab.
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

import { EuiBasicTable } from '@elastic/eui';

import WzNoConfig from '../util-components/no-config';
import WzConfigurationSettingsHeader from '../util-components/configuration-settings-header';
import { isString } from '../utils/utils';
import helpLinks from './help-links';

const columns = [{ field: 'path', name: 'Path' }];

class WzPolicyMonitoringSystemAudit extends Component {
  constructor(props) {
    super(props);
  }
  render() {
    const { currentConfig } = this.props;
    return (
      <Fragment>
        {currentConfig['syscheck-rootcheck'] &&
          isString(currentConfig['syscheck-rootcheck']) && (
            <WzNoConfig
              error={currentConfig['syscheck-rootcheck']}
              help={helpLinks}
            />
          )}
        {currentConfig &&
          currentConfig['syscheck-rootcheck'] &&
          currentConfig['syscheck-rootcheck'].rootcheck &&
          !currentConfig['syscheck-rootcheck'].rootcheck.system_audit && (
            <WzNoConfig error="not-present" help={helpLinks} />
          )}
        {currentConfig &&
          currentConfig['syscheck-rootcheck'] &&
          currentConfig['syscheck-rootcheck'].rootcheck &&
          currentConfig['syscheck-rootcheck'].rootcheck.system_audit && (
            <WzConfigurationSettingsHeader
              title="UNIX audit files"
              description="Specified paths to audit definition files for Unix-like systems"
              help={helpLinks}
            >
              <EuiBasicTable
                items={currentConfig[
                  'syscheck-rootcheck'
                ].rootcheck.system_audit.map(item => ({ path: item }))}
                columns={columns}
              />
            </WzConfigurationSettingsHeader>
          )}
      </Fragment>
    );
  }
}

export default WzPolicyMonitoringSystemAudit;
