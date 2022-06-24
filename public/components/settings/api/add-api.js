/*
 * Wazuh app - React component for the adding an API entry form.
 *
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
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiCodeBlock,
  EuiText,
  EuiSpacer,
  EuiCode,
  EuiButton,
  EuiButtonEmpty,
  EuiSteps,
  EuiCallOut,
  EuiPanel
} from '@elastic/eui';
import { withErrorBoundary } from '../../common/hocs';
import { UI_LOGGER_LEVELS, PLUGIN_PLATFORM_NAME } from '../../../../common/constants';
import { UI_ERROR_SEVERITIES } from '../../../react-services/error-orchestrator/types';
import { getErrorOrchestrator } from '../../../react-services/common-services';
import { getPluginDataPath } from '../../../../common/plugin';

export const AddApi = withErrorBoundary (class AddApi extends Component {
  constructor(props) {
    super(props);
    this.state = {
      status: 'incomplete',
      fetchingData: false,
      blockClose: false
    };
  }

  componentDidMount() {
    this.setState({ enableClose: this.props.enableClose });
    this.checkErrorsAtInit();
  }

  /**
   * Checks if the component was initialized with some error in order to show it
   */
  checkErrorsAtInit() {
    if (this.props.errorsAtInit) {
      const error = this.props.errorsAtInit;
      this.setState({
        status: error.type || 'danger',
        blockClose: true,
        message:
          (error.data || error).message ||
          'Wazuh API not reachable, please review your configuration',
        fetchingData: false
      });
    }
  }

  /**
   * Check the APIs connections
   */
  async checkConnection() {
    //TODO handle this
    try {
      this.setState({
        status: 'incomplete',
        fetchingData: true,
        blockClose: false
      });

      await this.props.checkForNewApis();

      this.setState({
        status: 'complete',
        fetchingData: false,
        closedEnabled: true
      });
    } catch (error) {
      const close =
        error.data && error.data.code && error.data.code === 2001
          ? false
          : error.closedEnabled || false;
      this.setState({
        status: error.type || 'danger',
        closedEnabled: close,
        blockClose: !close,
        enableClose: false,
        message:
          (error.data || error).message || error ||
          'Wazuh API not reachable, please review your configuration',
        fetchingData: false
      });

      const options = {
        context: `${AddApi.name}.checkConnection`,
        level: UI_LOGGER_LEVELS.ERROR,
        severity: UI_ERROR_SEVERITIES.UI,
        store: true,
        error: {
          error: error,
          message: error.message || error,
          title: `Wazuh API not reachable, please review your configuration: ${error.message || error}`,
        },
      };

      getErrorOrchestrator().handleError(options);
    }
  }

  render() {
    const apiExample = `hosts:
  - <id>:
     url: <api_url>
     port: <api_port>
     username: <api_username>
     password: <api_password>
     run_as: <run_as>`;

    const checkConnectionChildren = (
      <div>
        {(this.state.status === 'warning' ||
          this.state.status === 'danger') && (
          <EuiCallOut
            color={this.state.status}
            iconType="help"
            title={this.state.message}
          />
        )}
        {(this.state.status === 'warning' ||
          this.state.status === 'danger') && <EuiSpacer />}
        <EuiText>
          Check that the {PLUGIN_PLATFORM_NAME} server can reach the configured Wazuh API(s).
        </EuiText>
        <EuiSpacer />
        <EuiButton
          onClick={async () => await this.checkConnection()}
          isLoading={this.state.fetchingData}
        >
          Check connection
        </EuiButton>
        {(this.state.closedEnabled || this.state.enableClose) &&
          !this.state.blockClose && (
            <EuiButtonEmpty onClick={() => this.props.closeAddApi()}>
              Close
            </EuiButtonEmpty>
          )}
      </div>
    );

    const editConfigChildren = (
      <div>
        <EuiText>
          Modify{' '}
          <EuiCode>{getPluginDataPath('config/wazuh.yml')}</EuiCode>{' '}
          to set the connection information.
        </EuiText>
        <EuiSpacer />
        <EuiCodeBlock language="yaml">{apiExample}</EuiCodeBlock>
        <EuiSpacer />
        <EuiText>
          Where <EuiCode>{'<id>'}</EuiCode> is an arbitrary ID,{' '}
          <EuiCode>{'<api_url>'}</EuiCode> is the URL of the Wazuh API,{' '}
          <EuiCode>{'<api_port>'}</EuiCode> is the port,{' '}
          <EuiCode>{'<api_username>'}</EuiCode> and{' '}
          <EuiCode>{'<api_password>'}</EuiCode> are the credentials to
          authenticate,{' '}
          <EuiCode>{'<run_as>'}</EuiCode> defines if the app user's permissions depends on the authentication context (<EuiCode>{'true'}</EuiCode> / <EuiCode>{'false'}</EuiCode>).
        </EuiText>
      </div>
    );

    const steps = [
      {
        title: 'Edit the configuration',
        children: editConfigChildren
      },
      {
        title: 'Test the configuration',
        children: checkConnectionChildren,
        status: this.state.status
      }
    ];

    const view = (
      <EuiFlexGroup>
        <EuiFlexItem />
        <EuiFlexItem className="min-guide-width">
          <EuiPanel>
            <EuiFlexGroup>
              <EuiFlexItem grow={false}>
                <EuiText>
                  <h2>Getting started</h2>
                </EuiText>
              </EuiFlexItem>
              <EuiFlexItem />
              <EuiFlexItem grow={false}>
                {this.state.enableClose && !this.state.blockClose && (
                  <EuiButtonEmpty
                    size="s"
                    onClick={() => this.props.closeAddApi()}
                    iconType="cross"
                  >
                    close
                  </EuiButtonEmpty>
                )}
              </EuiFlexItem>
            </EuiFlexGroup>
            <EuiSpacer />
            <EuiSteps firstStepNumber={1} steps={steps} />
          </EuiPanel>
        </EuiFlexItem>
        <EuiFlexItem />
      </EuiFlexGroup>
    );

    return view;
  }
})

AddApi.propTypes = {
  checkForNewApis: PropTypes.func,
  closeAddApi: PropTypes.func,
  enableClose: PropTypes.bool
};
