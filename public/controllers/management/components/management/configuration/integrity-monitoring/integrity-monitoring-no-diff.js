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
import { i18n } from '@kbn/i18n';

import { EuiBasicTable } from '@elastic/eui';

import WzConfigurationSettingsTabSelector from '../util-components/configuration-settings-tab-selector';
import WzNoConfig from '../util-components/no-config';
import helpLinks from './help-links';

const columnsPath = [
  {
    field: 'path',
    name: i18n.translate(
      'wazuh.public.controller.management.config.Nomoniterted.Path',
      {
        defaultMessage: 'Path',
      },
    ),
  },
];

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
            <WzNoConfig error='not-present' help={helpLinks} />
          )}
        {currentConfig &&
          currentConfig['syscheck-syscheck'] &&
          currentConfig['syscheck-syscheck'].syscheck &&
          currentConfig['syscheck-syscheck'].syscheck.nodiff && (
            <WzConfigurationSettingsTabSelector
              title={i18n.translate(
                'wazuh.public.controller.management.config.Nomoniterted.noDiff',
                {
                  defaultMessage: 'No diff directories',
                },
              )}
              description={i18n.translate(
                'wazuh.public.controller.management.config.Nomoniterted.diffCalculated',
                {
                  defaultMessage:
                    "These files won't have their diff calculated",
                },
              )}
              currentConfig={currentConfig['syscheck-syscheck']}
              minusHeight={this.props.agent.id === '000' ? 320 : 415}
              helpLinks={helpLinks}
            >
              <EuiBasicTable
                items={currentConfig['syscheck-syscheck'].syscheck.nodiff.map(
                  item => ({ path: item }),
                )}
                columns={columnsPath}
              />
            </WzConfigurationSettingsTabSelector>
          )}
      </Fragment>
    );
  }
}

WzConfigurationIntegrityMonitoringNoDiff.proptTypes = {
  // currentConfig: PropTypes.object.isRequired
};

export default WzConfigurationIntegrityMonitoringNoDiff;
