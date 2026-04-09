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
import WzLoading from '../util-components/loading';
import { isString } from '../utils/utils';

import { connect } from 'react-redux';

import { webDocumentationLink } from '../../../../../../../common/services/web_documentation';
import { WzRequest } from '../../../../../../react-services/wz-request';

const loggingSettings = [
  { field: 'log_format', label: 'Log format' },
];

const helpLinks = [
  {
    text: 'Logging reference',
    href: webDocumentationLink(
      'user-manual/reference/ossec-conf/logging.html',
    ),
  },
];

export class WzConfigurationGlobalConfigurationLogging extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loggingConfig: null,
      isLoading: true,
      errorFetching: null,
    };
  }

  async componentDidMount() {
    await this.fetchLoggingConfig();
  }

  async componentDidUpdate(prevProps) {
    if (
      prevProps.clusterNodeSelected !== this.props.clusterNodeSelected ||
      prevProps.refreshTime !== this.props.refreshTime
    ) {
      await this.fetchLoggingConfig();
    }
  }

  fetchLoggingConfig = async () => {
    try {
      this.setState({ isLoading: true, errorFetching: null });
      const node = this.props.clusterNodeSelected;
      if (!node) {
        this.setState({
          isLoading: false,
          errorFetching: 'No cluster node selected',
        });
        return;
      }
      const result = await WzRequest.apiReq(
        'GET',
        `/cluster/${node}/configuration`,
        {},
      );
      const loggingConfig =
        result?.data?.data?.affected_items?.[0]?.logging || null;
      if (loggingConfig) {
        this.setState({ loggingConfig, isLoading: false });
      } else {
        this.setState({ isLoading: false, errorFetching: 'not-present' });
      }
    } catch (error) {
      this.setState({
        isLoading: false,
        errorFetching:
          error.message || 'Error fetching logging configuration',
      });
    }
  };

  render() {
    const { loggingConfig, isLoading, errorFetching } = this.state;
    const { wazuhNotReadyYet } = this.props;

    if (isLoading) {
      return <WzLoading />;
    }

    if (errorFetching && isString(errorFetching)) {
      return <WzNoConfig error={errorFetching} help={helpLinks} />;
    }

    if (wazuhNotReadyYet && !loggingConfig) {
      return <WzNoConfig error='Server not ready yet' help={helpLinks} />;
    }

    if (!loggingConfig) {
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

const mapStateToProps = state => ({
  wazuhNotReadyYet: state.appStateReducers.wazuhNotReadyYet,
  clusterNodeSelected: state.configurationReducers.clusterNodeSelected,
  refreshTime: state.configurationReducers.refreshTime,
});

WzConfigurationGlobalConfigurationLogging.propTypes = {
  wazuhNotReadyYet: PropTypes.oneOfType([PropTypes.bool, PropTypes.string]),
  clusterNodeSelected: PropTypes.string,
  refreshTime: PropTypes.number,
};

export default connect(mapStateToProps)(
  WzConfigurationGlobalConfigurationLogging,
);
