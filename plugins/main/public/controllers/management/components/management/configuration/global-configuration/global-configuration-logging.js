/*
 * Wazuh app - React component for show configuration of global configuration - logging section.
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

import WzConfigurationSettingsGroup from '../util-components/configuration-settings-group';
import WzConfigurationSettingsHeader from '../util-components/configuration-settings-header';
import WzNoConfig from '../util-components/no-config';
import withWzConfig from '../util-hocs/wz-config';
import { isString } from '../utils/utils';

import { connect } from 'react-redux';
import { compose } from 'redux';

import { webDocumentationLink } from '../../../../../../../common/services/web_documentation';

const loggingSettings = [{ field: 'log_format', label: 'Log format' }];

const helpLinks = [
  {
    text: 'Logging reference',
    href: webDocumentationLink('user-manual/reference/ossec-conf/logging.html'),
  },
];

export class WzConfigurationGlobalConfigurationLogging extends Component {
  constructor(props) {
    super(props);
  }
  render() {
    const { currentConfig, wazuhNotReadyYet } = this.props;
    const loggingConfig = currentConfig?.['logging'];

    if (loggingConfig && isString(loggingConfig)) {
      return <WzNoConfig error={loggingConfig} help={helpLinks} />;
    }

    if (wazuhNotReadyYet && (!currentConfig || !loggingConfig)) {
      return <WzNoConfig error='Server not ready yet' help={helpLinks} />;
    }

    if (!loggingConfig || !Object.keys(loggingConfig).length) {
      return <WzNoConfig error='not-present' help={helpLinks} />;
    }

    return (
      <Fragment>
        <WzConfigurationSettingsHeader
          title='Logging settings'
          description='Internal logging configuration for the manager'
          help={helpLinks}
        >
          <WzConfigurationSettingsGroup
            config={loggingConfig}
            items={loggingSettings}
          />
        </WzConfigurationSettingsHeader>
      </Fragment>
    );
  }
}

const sections = [{ useFullEndpoint: true, key: 'logging' }];

const mapStateToProps = state => ({
  wazuhNotReadyYet: state.appStateReducers.wazuhNotReadyYet,
});

WzConfigurationGlobalConfigurationLogging.propTypes = {
  wazuhNotReadyYet: PropTypes.oneOfType([PropTypes.bool, PropTypes.string]),
};

export default compose(
  withWzConfig(sections),
  connect(mapStateToProps),
)(WzConfigurationGlobalConfigurationLogging);
