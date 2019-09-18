/*
 * Wazuh app - React component for the adding an API entry form.
 *
 * Copyright (C) 2015-2019 Wazuh, Inc.
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
  EuiCallOut
} from '@elastic/eui';

export class AddApi extends Component {
  constructor(props) {
    super(props);
    this.state = {
      status: 'incomplete',
      fetchingData: false
    };
  }

  async checkConnection() {
    //TODO handle this
    try {
      this.setState({
        status: 'incomplete',
        fetchingData: true
      });

      await this.props.checkForNewApis();

      this.setState({
        status: 'complete',
        fetchingData: false,
        closedEnabled: true
      });
    } catch (error) {
      this.setState({
        status: error.type || 'danger',
        closedEnabled: error.closedEnabled || false,
        message: error.message || 'Wazuh API not reachable, please review your configuration',
        fetchingData: false
      });
    }
  }

  render() {
    const apiExample = `hosts:
    - <id>:
        host: "<api_url>"
        port: <api_port>
        username: "<api_user>"
        password: "<api_password>"
`;

    const checkConnectionChildren = (
      <div>
        {(this.state.status === 'warning' || this.state.status === 'danger') && (
          <EuiCallOut
            color={this.state.status}
            iconType="help"
            title={this.state.message}
          />
        )}
        {(this.state.status === 'warning' || this.state.status === 'danger') && <EuiSpacer />}
        <EuiText>
          Check that the Kibana server can reach the configured Wazuh API(s).
        </EuiText>
        <EuiSpacer />
        <EuiButton
          onClick={async () => await this.checkConnection()}
          isLoading={this.state.fetchingData}
        >
          Check connection
        </EuiButton>
        {this.state.closedEnabled && (
          <EuiButtonEmpty
            onClick={() => this.props.closeAddApi()}
          >
            Close
          </EuiButtonEmpty>
        )}
      </div>
    );

    const editConfigChildren = (
      <div>
        <EuiText>
          Modify <EuiCode>kibana/plugins/wazuh/wazuh-hosts.yml</EuiCode> to set the
          connection information.
        </EuiText>
        <EuiSpacer />
        <EuiCodeBlock language="yaml">{apiExample}</EuiCodeBlock>
        <EuiSpacer />
        <EuiText>
          Where <EuiCode>{'<id>'}</EuiCode> is an arbitrary ID,{' '}
          <EuiCode>{'<api_url>'}</EuiCode> is the URL of the Wazuh API,{' '}
          <EuiCode>{'<api_port>'}</EuiCode> is the port,{' '}
          <EuiCode>{'<api_user>'}</EuiCode> and{' '}
          <EuiCode>{'<api_password>'}</EuiCode> are the credentials to
          authenticate.
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
        <EuiFlexItem>
          <EuiText>
            <h2>Getting started</h2>
          </EuiText>
          <EuiSpacer />
          <EuiSteps firstStepNumber={1} steps={steps} />
        </EuiFlexItem>
        <EuiFlexItem />
      </EuiFlexGroup>
    );

    return view;
  }
}

AddApi.propTypes = {
  checkForNewApis: PropTypes.func,
  closeAddApi: PropTypes.func,
  apiEntries: PropTypes.array
};
