/*
 * Wazuh app - React component for show configuration of active response - agent tab.
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import React, { Component } from 'react';
import PropTypes from 'prop-types';

import WzNoConfig from '../util-components/no-config';
import WzConfigurationSettingsHeader from '../util-components/configuration-settings-header';
import WzConfigurationSettingsGroup from '../util-components/configuration-settings-group';
import withWzConfig from '../util-hocs/wz-config';

import { compose } from 'redux';
import { connect } from 'react-redux';

import { isString, renderValueNoThenEnabled } from '../utils/utils';
import { webDocumentationLink } from '../../../../../../../common/services/web_documentation';

const helpLinks = [
  {
    text: 'Active response documentation',
    href: webDocumentationLink(
      'user-manual/capabilities/active-response/index.html',
    ),
  },
  {
    text: 'Active response reference',
    href: webDocumentationLink(
      'user-manual/reference/ossec-conf/active-response.html',
    ),
  },
];

const mainSettings = [
  {
    field: 'disabled',
    label: 'Active response status',
    render: renderValueNoThenEnabled,
  },
  {
    field: 'repeated_offenders',
    label: 'List of timeouts (in minutes) for repeated offenders',
  },
  {
    field: 'ca_store',
    label: 'Use the following list of root CA certificates',
  },
  {
    field: 'ca_verification',
    label: 'Validate WPKs using root CA certificate',
  },
];

class WzConfigurationActiveResponseAgent extends Component {
  constructor(props) {
    super(props);
  }
  render() {
    const { currentConfig, wazuhNotReadyYet } = this.props;
    const activeResponse = currentConfig?.execd?.['active-response'];

    if (isString(currentConfig?.execd)) {
      return <WzNoConfig error={currentConfig.execd} help={helpLinks} />;
    }

    if (wazuhNotReadyYet && !currentConfig?.execd) {
      return <WzNoConfig error='Server not ready yet' help={helpLinks} />;
    }

    /* The report only carries the modules the agent runs, so an absent `execd`
    is a module that reported nothing, not a fetch that went wrong. */
    if (!activeResponse) {
      return <WzNoConfig error='not-present' help={helpLinks} />;
    }

    return (
      <WzConfigurationSettingsHeader
        title='Active response settings'
        description='Find here all the Active response settings for this agent'
        help={helpLinks}
      >
        <WzConfigurationSettingsGroup
          config={activeResponse}
          items={mainSettings}
        />
      </WzConfigurationSettingsHeader>
    );
  }
}

const mapStateToProps = state => ({
  wazuhNotReadyYet: state.appStateReducers.wazuhNotReadyYet,
});

WzConfigurationActiveResponseAgent.propTypes = {
  wazuhNotReadyYet: PropTypes.oneOfType([PropTypes.bool, PropTypes.string]),
  currentConfig: PropTypes.object,
};

export default compose(
  connect(mapStateToProps),
  withWzConfig(),
)(WzConfigurationActiveResponseAgent);
