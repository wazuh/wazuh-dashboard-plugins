/*
 * Wazuh app - React component for show configuration of policy monitoring - ignored tab.
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
import PropTypes from 'prop-types';

import { EuiBasicTable, EuiSpacer } from '@elastic/eui';

import WzNoConfig from '../util-components/no-config';
import WzConfigurationSettingsHeader from '../util-components/configuration-settings-header';
import { isString } from '../utils/utils';
import helpLinks from './help-links.js';

const columnsIgnore = [{ field: 'path', name: 'Path' }];

const columnsIgnoreSregex = [{ field: 'sreg', name: 'Sregex' }];

/* A block declared once is reported as a bare value rather than as a list of
one, so both shapes have to render. */
const toList = value => (Array.isArray(value) ? value : value ? [value] : []);

class WzConfigurationPolicyMonitoringSystemAudit extends Component {
  constructor(props) {
    super(props);
  }
  render() {
    const { currentConfig } = this.props;
    const rootcheck = currentConfig?.fim?.rootcheck;

    if (isString(currentConfig?.fim)) {
      return <WzNoConfig error={currentConfig.fim} help={helpLinks} />;
    }

    /* The report only carries the modules the agent runs, so an absent `fim`
    is a module that reported nothing, not a fetch that went wrong. */
    if (!rootcheck) {
      return <WzNoConfig error='not-present' help={helpLinks} />;
    }

    const ignore = toList(rootcheck.ignore);
    const ignoreSregex = toList(rootcheck.ignore_sregex);

    if (!ignore.length && !ignoreSregex.length) {
      return <WzNoConfig error='not-present' help={helpLinks} />;
    }

    return (
      <WzConfigurationSettingsHeader
        title='Ignored files and directories'
        description='These files and directories are ignored from the rootcheck scan'
        help={helpLinks}
      >
        {ignore.length > 0 && (
          <Fragment>
            <EuiBasicTable
              items={ignore.map(item => ({ path: item }))}
              columns={columnsIgnore}
            />
            <EuiSpacer size='m' />
          </Fragment>
        )}
        {ignoreSregex.length > 0 && (
          <EuiBasicTable
            items={ignoreSregex.map(item => ({ sreg: item }))}
            columns={columnsIgnoreSregex}
          />
        )}
      </WzConfigurationSettingsHeader>
    );
  }
}

WzConfigurationPolicyMonitoringSystemAudit.propTypes = {
  currentConfig: PropTypes.object,
};

export default WzConfigurationPolicyMonitoringSystemAudit;
