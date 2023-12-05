/*
 * Wazuh app - React component for show configuration of integrity monitoring - nodiff tab.
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

import WzConfigurationSettingsHeader from '../util-components/configuration-settings-header';
import WzNoConfig from '../util-components/no-config';
import helpLinks from './help-links';

const columnsPath = [{ field: 'path', name: 'Path' }];

class WzConfigurationIntegrityMonitoringNoDiff extends Component {
  constructor(props) {
    super(props);
  }
  render() {
    const { currentConfig } = this.props;
    return (
      <Fragment>
        {currentConfig &&
          currentConfig['syscheck-syscheck'] &&
          currentConfig['syscheck-syscheck'].syscheck &&
          !currentConfig['syscheck-syscheck'].syscheck.nodiff && (
            <WzNoConfig error="not-present" help={helpLinks} />
          )}
        {currentConfig &&
          currentConfig['syscheck-syscheck'] &&
          currentConfig['syscheck-syscheck'].syscheck &&
          currentConfig['syscheck-syscheck'].syscheck.nodiff && (
            <WzConfigurationSettingsHeader
              title="No diff directories"
              description="These files won't have their diff calculated"
              help={helpLinks}
            >
              <EuiBasicTable
                items={currentConfig['syscheck-syscheck'].syscheck.nodiff.map(
                  item => ({ path: item })
                )}
                columns={columnsPath}
              />
            </WzConfigurationSettingsHeader>
          )}
      </Fragment>
    );
  }
}

export default WzConfigurationIntegrityMonitoringNoDiff;
