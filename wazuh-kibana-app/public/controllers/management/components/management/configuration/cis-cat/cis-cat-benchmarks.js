/*
 * Wazuh app - React component for show configuration of CIS-CAT - benchmark tab.
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
import WzConfigurationSettingsTabSelector from '../util-components/configuration-settings-tab-selector';
import { isString } from '../utils/utils';
import helpLinks from './help-links';

const columns = [
  { field: 'path', name: 'Path' },
  { field: 'profile', name: 'Profile' },
  { field: 'timeout', name: 'Timeout' },
  { field: 'type', name: 'Type' }
];
class WzConfigurationCisCatBenchmarks extends Component {
  constructor(props) {
    super(props);
  }
  render() {
    const { currentConfig, wodleConfig } = this.props;
    return (
      <Fragment>
        {currentConfig['wmodules-wmodules'] &&
          isString(currentConfig['wmodules-wmodules']) && (
            <WzNoConfig
              error={currentConfig['wmodules-wmodules']}
              help={helpLinks}
            />
          )}
        {currentConfig &&
          wodleConfig['cis-cat'] &&
          !wodleConfig['cis-cat'].content && (
            <WzNoConfig error="not-present" help={helpLinks} />
          )}
        {wodleConfig['cis-cat'] && wodleConfig['cis-cat'].content && (
          <Fragment>
            <WzConfigurationSettingsTabSelector
              title="Benchmarks"
              description="List of CIS-CAT benchmark templates to perform scans"
              currentConfig={wodleConfig}
              minusHeight={this.props.agent.id === '000' ? 320 : 415}
              helpLinks={helpLinks}
            >
              <EuiBasicTable
                items={wodleConfig['cis-cat'].content}
                columns={columns}
              />
            </WzConfigurationSettingsTabSelector>
          </Fragment>
        )}
      </Fragment>
    );
  }
}

WzConfigurationCisCatBenchmarks.propTypes = {
  // currentConfig: PropTypes.object.isRequired
};

export default WzConfigurationCisCatBenchmarks;
