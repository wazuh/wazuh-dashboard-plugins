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
  EuiPanel,
  EuiCode,
  Fragment,
  EuiButton,
  EuiSteps,
  EuiBasicTable,
  EuiHealth
} from '@elastic/eui';

export class ApiIsDown extends Component {
  constructor(props) {
    super(props);
    this.state = {
      status: 'incomplete',
      fetchingData: false
    };
  }
  handleComplete() {
    this.setState({
      status: 'incomplete',
      fetchingData: true
    });
    setTimeout(() => {
      this.setState({
        status: 'complete',
        fetchingData: false
      });
    }, 1000);
  }

  render() {
    console.log('entries ',this.props.apiEntries)
    const apiExample = `
# Example Wazuh API configuration
hosts:
    - production:
        host: http://172.16.1.2
        port: 55000
        username: foo
        password: bar
`;

    const checkConnectionChildren = (
      <div>
        <EuiText>
          Check that the Kibana server can reach the configured Wazuh API(s).
        </EuiText>
        <EuiSpacer />
        <EuiButton
          onClick={() => this.handleComplete()}
          isLoading={this.state.fetchingData}
        >
          Check connection
        </EuiButton>
        <EuiSpacer />
        <EuiText>Already configured Wazuh API(s)</EuiText>
        <EuiSpacer />
        <EuiBasicTable
          items={this.props.apiEntries}
          columns={[
            { field: 'url', name: 'Host' },
            { field: 'port', name: 'Port' },
            {
              field: 'status',
              name: 'Status',
              render: item => {
                return item === 'online' ? (
                  <EuiHealth color="success">Online</EuiHealth>
                ) : item === 'down' ? (
                  <EuiHealth color="danger">Offline</EuiHealth>
                ) : (
                  <EuiHealth color="subdued">Unknown</EuiHealth>
                );
              }
            }
          ]}
        />
      </div>
    );

    const steps = [
      {
        title: 'Check the Wazuh API service status',
        children: (
          <div>
            <EuiText>For Systemd</EuiText>
            <EuiSpacer />
            <EuiCode>$ sudo systemctl status wazuh-api</EuiCode>
            <EuiSpacer />
            <EuiText>For SysV Init</EuiText>
            <EuiSpacer />
            <EuiCode>$ sudo service wazuh-api status</EuiCode>
          </div>
        )
      },
      {
        title: 'Check the configuration',
        children: (
          <div>
            <EuiText>
              Review the settings in the{' '}
              <EuiCode>kibana/plugins/wazuh/wazuh-hosts.yml</EuiCode> file.
            </EuiText>
            <EuiSpacer />
            <EuiCodeBlock language="yaml">{apiExample}</EuiCodeBlock>
          </div>
        )
      },
      {
        title: 'Test the configuration',
        children: checkConnectionChildren,
        status: this.state.status
      }
    ];
    return (
      <EuiFlexGroup>
        <EuiFlexItem />
        <EuiFlexItem>
          <EuiText>
            <h2>Wazuh API seems to be down</h2>
          </EuiText>
          <EuiSpacer />
          <EuiSteps firstStepNumber={1} steps={steps} />
        </EuiFlexItem>
        <EuiFlexItem />
      </EuiFlexGroup>
    );
  }
}

ApiIsDown.propTypes = {
  apiEntries: PropTypes.array,
  checkManager: PropTypes.func
};
