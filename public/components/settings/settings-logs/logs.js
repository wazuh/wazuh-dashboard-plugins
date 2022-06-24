/*
 * Wazuh app - React component building the API entries table.
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
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiCodeBlock,
  EuiPanel,
  EuiPage,
  EuiButtonEmpty,
  EuiTitle,
  EuiText,
  EuiProgress,
} from '@elastic/eui';

import { formatUIDate } from '../../../react-services/time-service';
import store from '../../../redux/store';
import { updateSelectedSettingsSection } from '../../../redux/actions/appStateActions';
import { withErrorBoundary } from '../../common/hocs';
import { getPluginDataPath } from '../../../../common/plugin';

class SettingsLogs extends Component {
  constructor(props) {
    super(props);
    this.state = {
      logs: [],
      refreshingEntries: false,
    };
    this.HEIGHT_WITHOUT_CODE_EDITOR = 325;
  }

  componentDidMount() {
    store.dispatch(updateSelectedSettingsSection('logs'));
    this._isMounted = true;
    this.refresh();
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  async refresh() {
    this.setState({
      refreshingEntries: true,
    });
    const logs = await this.props.getLogs();
    this._isMounted &&
      this.setState({
        refreshingEntries: false,
        logs,
      });
  }

  formatDate(date) {
    return formatUIDate(date).replace('-', '/').replace('T', ' ').replace('Z', '').split('.')[0];
  }

  getMessage(log) {
    const data = log.data || log.message;
    return typeof data === 'object' ? data.message || JSON.stringify(data) : data.toString();
  }

  render() {
    let text = '';
    (this.state.logs || []).forEach((x) => {
      text =
        text +
        (this.formatDate(x.date) + '  ' + x.level.toUpperCase() + '  ' + this.getMessage(x) + '\n');
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
              <EuiButtonEmpty iconType="refresh" onClick={async () => await this.refresh()}>
                Refresh
              </EuiButtonEmpty>
            </EuiFlexItem>
          </EuiFlexGroup>
          <EuiText color="subdued" style={{ paddingBottom: '15px' }}>
            Log file located at {getPluginDataPath('logs/wazuhapp.log')}
          </EuiText>
          {this.state.refreshingEntries && <EuiProgress size="xs" color="primary" />}
          {!this.state.refreshingEntries && (
            <div className="code-block-log-viewer-container">
              <EuiCodeBlock
                fontSize="s"
                paddingSize="m"
                color="dark"
                overflowHeight={`calc(100vh - ${this.HEIGHT_WITHOUT_CODE_EDITOR}px)`}
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

export default withErrorBoundary(SettingsLogs);
