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
  EuiSteps,
  EuiCallOut
} from '@elastic/eui';

import needle from 'needle';

export class AddApi extends Component {
  constructor(props) {
    super(props);
    this.state = {
      status: 'incomplete',
      fetchingData: false
    };
    this.statuses = ['complete', 'warning'];
  }

  handleComplete() {
    this.setState({
      status: 'incomplete',
      fetchingData: true
    });

    needle(
      'GET',
      'http://172.16.1.2:55000',
      {},
      {
        headers: {
          'wazuh-app-version': '3.10.0'
        },
        username: 'foo',
        password: 'bar'
      }
    ).then(result => {
      console.log(result);

      this.setState({
        status: this.statuses[Math.floor(Math.random() * 2)],
        fetchingData: false
      });
    });
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
        {this.state.status === 'warning' && (
          <EuiCallOut
            color="warning"
            iconType="help"
            title="Wazuh API not reachable, please review your configuration."
          />
        )}
        {this.state.status === 'warning' && <EuiSpacer />}
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
