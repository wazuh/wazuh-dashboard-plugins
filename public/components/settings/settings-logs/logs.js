/*
 * Wazuh app - React component building the API entries table.
 *
 * Copyright (C) 2015-2020 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import React, { Component } from 'react';
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiCodeBlock,
  EuiPanel,
  EuiPage,
  EuiButtonEmpty,
  EuiTitle,
  EuiText,
  EuiProgress
} from '@elastic/eui';

import { TimeService } from '../../../react-services/time-service';
import store from '../../../redux/store';
import { updateSelectedSettingsSection } from '../../../redux/actions/appStateActions';

export default class SettingsLogs extends Component {
  constructor(props) {
    super(props);
    this.offset = 275;
    this.state = {
      logs: [],
      refreshingEntries: false
    };
  }

  updateHeight = () => {
    this.height = window.innerHeight - this.offset; //eslint-disable-line
    this.forceUpdate();
  };

  componentDidMount() {
    store.dispatch(updateSelectedSettingsSection('logs'));
    this._isMounted = true;
    this.refresh();
    this.height = window.innerHeight - this.offset; //eslint-disable-line
    window.addEventListener('resize', this.updateHeight); //eslint-disable-line
  }

  componentWillUnmount() {
    this._isMounted = false;
    window.removeEventListener('resize', this.updateHeight); //eslint-disable-line
  }

  async refresh() {
    this.setState({
      refreshingEntries: true
    });
    const logs = await this.props.getLogs();
    this._isMounted && this.setState({
      refreshingEntries: false,
      logs
    });
  }

  formatDate(date) {
    const ts = TimeService;
    return ts
      .offset(date)
      .replace('-', '/')
      .replace('T', ' ')
      .replace('Z', '')
      .split('.')[0];
  }

  render() {
    let text = '';
    (this.state.logs || []).forEach(x => {
      text =
        text +
        (this.formatDate(x.date) +
          '  ' +
          x.level.toUpperCase() +
          '  ' +
          x.message +
          '\n');
    });
    return (
      <EuiPage>
        <EuiPanel paddingSize="l">
          <EuiFlexGroup>
            <EuiFlexItem>
              <EuiFlexGroup>
                <EuiFlexItem>
                  <EuiTitle>
                    <h2>App log messages</h2>
                  </EuiTitle>
                </EuiFlexItem>
              </EuiFlexGroup>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiButtonEmpty
                iconType="refresh"
                onClick={async () => await this.refresh()}
              >
                Refresh
              </EuiButtonEmpty>
            </EuiFlexItem>
          </EuiFlexGroup>
          <EuiFlexGroup>
            <EuiFlexItem>
              <EuiText color="subdued" style={{ paddingBottom: '15px' }}>
                Log file located at
                /usr/share/kibana/optimize/wazuh/logs/wazuhapp.log
              </EuiText>
            </EuiFlexItem>
          </EuiFlexGroup>
          {this.state.refreshingEntries && (
            <EuiProgress size="xs" color="primary" />
          )}
          {!this.state.refreshingEntries && (
            <div className='code-block-log-viewer-container'>
              <EuiCodeBlock
                fontSize="s"
                paddingSize="m"
                color="dark"
                overflowHeight={this.height}
              >
                {text}
              </EuiCodeBlock>
            </div>
          )}
        </EuiPanel>
      </EuiPage>
    );
  }
}
