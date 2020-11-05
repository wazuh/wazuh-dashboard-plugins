/*
 * Wazuh app - Component what renders Management/Logs
 * Copyright (C) 2015-2020 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import React, { Component, Fragment } from 'react';
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiSelect,
  EuiSwitch,
  EuiSpacer,
  EuiPage,
  EuiPageBody,
  EuiCodeBlock,
  EuiPanel,
  EuiTitle,
  EuiTextColor,
  EuiProgress,
  EuiCallOut,
  EuiButtonEmpty
} from '@elastic/eui';
import 'brace/mode/less';	
import 'brace/theme/github';	
import exportCsv from '../../../../../react-services/wz-csv';
import { toastNotifications } from 'ui/notify';
import { WzRequest } from '../../../../../react-services/wz-request';
import { withUserAuthorizationPrompt, withGlobalBreadcrumb } from '../../../../../components/common/hocs';
import { compose } from 'redux';
import { WzFieldSearch } from '../../../../../components/wz-field-search-bar/wz-field-search-bar';

export default compose(
  withGlobalBreadcrumb([
    { text: '' },
    { text: 'Management', href: '/app/wazuh#/manager' },
    { text: 'Logs' }
  ]),
  withUserAuthorizationPrompt([{action: 'cluster:status', resource: '*:*:*'}, {action: 'cluster:read', resource: 'node:id:*'}])
)
(class WzLogs extends Component {
  constructor(props) {
    super(props);
    this.offset = 350;
    this.state = {
      isCluster: false,
      selectedDaemon: '',
      logLevelSelect: '',
      descendingSort: false,
      searchBarValue: '',
      appliedSearch: '',
      logsList: '',
      isLoading: false,
      offset: 0,
      selectedNode: '',
      logsPath: '',
      nodeList: [],
      totalItems: 0,
      daemonsList: [],
      loadingLogs: false,
      realTime: false
    };
    this.ITEM_STYLE = { width: '300px' };
  }

  updateHeight = () => {
    this.height = window.innerHeight - this.offset;
    this.forceUpdate();
  };

  async componentDidMount() {
    this.height = window.innerHeight - this.offset;
    window.addEventListener('resize', this.updateHeight);
    this.setState({ isLoading: true });

    const { nodeList, logsPath, selectedNode } = await this.getLogsPath();
    await this.initDaemonsList(logsPath);

    this.setState({
      selectedNode,
      selectedDaemon: 'all',
      logLevelSelect: 'all',
      realTime: false,
      descendingSort: false,
      offset: 0,
      totalItems: 0,
      logsPath,
      loadingLogs: false,
      nodeList
    }, async () => {
      await this.setFullLogs();
      this.setState({
        isLoading: false
      });
    });


  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.updateHeight);
    clearInterval(this.realTimeInterval);
  }

  async initDaemonsList(logsPath) {
    try {
      const path = logsPath + '/summary';
      const data = await WzRequest.apiReq('GET', path, {});
      const formattedData = (((data || {}).data || {}).data || {}).affected_items;
      const daemonsList = [...['all']];
      for (const daemon of formattedData) {
        daemonsList.push(Object.keys(daemon)[0]);
      }
      this.setState({ daemonsList });
    } catch (err) {
      return Promise.reject('Error obtaining daemons list.');
    } // eslint-disable-line
  }

  parseLogsToText(logs) {
    let result = '';
    logs.forEach(item => {
      result +=
        item.timestamp +
        ' ' +
        item.tag +
        ' ' +
        item.level.toUpperCase() +
        ' ' +
        item.description +
        '\n';
    });
    return result;
  }

  buildFilters(customOffset = 0) {
    let result = { limit: 100 };
    if (customOffset) {
      result['offset'] = customOffset;
    }
    if (this.state.logLevelSelect !== 'all')
      result['level'] = this.state.logLevelSelect;
    if (this.state.selectedDaemon !== 'all')
      result['tag'] = this.state.selectedDaemon;
    if (this.state.appliedSearch) result['search'] = this.state.appliedSearch;
    if (this.state.descendingSort) result['sort'] = '+timestamp';
    else result['sort'] = '-timestamp';

    return result;
  }

  async getFullLogs(customOffset = 0) {
    const { logsPath } = this.state;
    let result = '';
    let totalItems = 0;
    if (this.state.selectedNode) {
      try {
        const tmpResult = await WzRequest.apiReq(
          'GET',
          logsPath,
          { params: this.buildFilters(customOffset) }
        );
        const resultItems = ((tmpResult || {}).data.data || {}).affected_items;
        totalItems = ((tmpResult || {}).data.data || {}).total_affected_items;
        result = this.parseLogsToText(resultItems) || '';
      } catch (err) {
        result = '';
        return Promise.reject('Error obtaining logs.');
      }
    } else {
      try {
        const tmpResult = await WzRequest.apiReq(
          'GET',
          logsPath,
          { params: this.buildFilters(customOffset) }
        );
        const resultItems = ((tmpResult || {}).data.data || {}).affected_items;
        totalItems = ((tmpResult || {}).data.data || {}).total_affected_items;
        result = this.parseLogsToText(resultItems) || '';
      } catch (err) {
        result = '';
        return Promise.reject('Error obtaining logs');
      }
    }
    this.setState({ totalItems });
    return result;
  }

  async setFullLogs() {
    try{
      const result = await this.getFullLogs();
      this.setState({ logsList: result, offset: 0 });
    }catch(error){
      
    }
  }

  /**
   * Returns an object with the path to request Wazuh logs, the list of nodes and the current selected node.
   */
  async getLogsPath() {
    try {
      const clusterStatus = await WzRequest.apiReq(
        'GET',
        '/cluster/status',
        {}
      );
      const clusterEnabled =
        (((clusterStatus || {}).data || {}).data || {}).running === 'yes' &&
        (((clusterStatus || {}).data || {}).data || {}).enabled === 'yes';

      if (clusterEnabled) {
        let nodeList = '';
        let selectedNode = '';
        const nodeListTmp = await WzRequest.apiReq(
          'GET',
          '/cluster/nodes',
          {}
        );
        if (
          Array.isArray((((nodeListTmp || {}).data || {}).data || {}).affected_items)
        ) {
          nodeList = nodeListTmp.data.data.affected_items;
          selectedNode = nodeListTmp.data.data.affected_items.filter(
            item => item.type === 'master'
          )[0].name;
        }
        return {
          nodeList,
          logsPath: `/cluster/${selectedNode}/logs`,
          selectedNode: selectedNode
        };
      }
    } catch (error) {
      return Promise.reject('Error obtaining logs path.');
    }

    return { nodeList: '', logsPath: '/manager/logs', selectedNode: '' };
  }

  getDaemonsOptions() {
    const daemonsList =
      this.state.daemonsList.length > 0
        ? this.state.daemonsList.map(item => {
            return { value: item, text: item === 'all' ? 'All daemons' : item };
          })
        : [{ value: 'all', text: 'All daemons' }];

    return daemonsList;
  }

  getLogLevelOptions() {
    return [
      { value: 'all', text: 'All log levels' },
      { value: 'info', text: 'Info' },
      { value: 'error', text: 'Error' },
      { value: 'warning', text: 'Warning' },
      { value: 'critical', text: 'Critical' },
      { value: 'debug', text: 'Debug' },
      { value: 'debug2', text: 'Debug2'}
    ];
  }

  getnodeList() {
    try {
      if (this.state.nodeList && Array.isArray(this.state.nodeList)) {
        const nodeList = this.state.nodeList.map(item => {
          return { value: item.name, text: `${item.name} (${item.type})` };
        });
        return nodeList;
      } else {
        return false;
      }
    } catch (err) {
      return Promise.reject('Error obtaining list of nodes.');
    }
  }

  onDaemonChange = e => {
    this.setState(
      {
        selectedDaemon: e.target.value
      },
      this.setFullLogs
    );
  };

  onLogLevelChange = e => {
    this.setState(
      {
        logLevelSelect: e.target.value
      },
      this.setFullLogs
    );
  };

  onSortSwitchChange = e => {
    this.setState(
      {
        descendingSort: e.target.checked
      },
      this.setFullLogs
    );
  };

  onSelectNode = e => {
    this.setState(
      {
        selectedNode: e.target.value,
        logsPath: `/cluster/${e.target.value}/logs`
      },
      this.setFullLogs
    );
  };

  onSearchBarChange = e => {
    this.setState({
      searchBarValue: e
    });
  };

  onSearchBarSearch = e => {
    this.setState(
      {
        appliedSearch: e
      },
      this.setFullLogs
    );
  };

  makeSearch() {
    this.setState(
      { appliedSearch: this.state.searchBarValue },
      this.setFullLogs
    );
  }

  setRealTimeInterval() {
    if (this.state.realTime)
      this.realTimeInterval = setInterval(() => this.setFullLogs(), 5000);
    else clearInterval(this.realTimeInterval);
  }

  switchRealTime() {
    this.setState({ realTime: !this.state.realTime }, this.setRealTimeInterval);
  }

  showToast = (color, title, time) => {
    toastNotifications.add({
      color: color,
      title: title,
      toastLifeTimeMs: time,
    });
  }

  exportFormatted = async () => {
    try {
      this.showToast('success', 'Your download should begin automatically...', 3000);
      const filters = this.buildFilters();
      await exportCsv(
        this.state.selectedNode ? `/cluster/${this.state.selectedNode}/logs` : '/manager/logs',
        Object.keys(filters).map(filter => ({name: filter, value: filters[filter]})),
        `wazuh-${this.state.selectedNode ? `${this.state.selectedNode}-` : ''}ossec-log`
        );
        return;
    } catch (error) {
      this.showToast('danger', error, 3000);
    }
  }

  header() {
    const daemonsOptions = this.getDaemonsOptions();
    const logLevelOptions = this.getLogLevelOptions();
    const nodeList = this.getnodeList();

    return (
      <div>
        <EuiFlexGroup>
          <EuiFlexItem>
            <EuiTitle size={'m'}>
              <h2>Logs</h2>
            </EuiTitle>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiFlexGroup>
              <EuiFlexItem grow={false}>
                <EuiButtonEmpty iconType="importAction" onClick={this.exportFormatted}>
                  Export formatted
                </EuiButtonEmpty>
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiFlexItem>
        </EuiFlexGroup>
        <EuiFlexGroup>
          <EuiFlexItem>
            <EuiTextColor color="subdued">
              <p>List and filter Wazuh logs.</p>
            </EuiTextColor>
          </EuiFlexItem>
        </EuiFlexGroup>
        <EuiFlexGroup>
          <EuiFlexItem>
            <EuiFlexGroup>
              <EuiFlexItem grow={false}>
                <EuiSelect
                  id="filterDaemon"
                  options={daemonsOptions}
                  value={this.state.selectedDaemon}
                  onChange={this.onDaemonChange}
                  aria-label="Filter by daemon"
                />
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiSelect
                  id="filterLogLevel"
                  options={logLevelOptions}
                  value={this.state.logLevelSelect}
                  onChange={this.onLogLevelChange}
                  aria-label="Filter by log level"
                />
              </EuiFlexItem>
              {this.state.selectedNode && (
                <EuiFlexItem grow={false}>
                  <EuiSelect
                    id="selectNode"
                    options={nodeList}
                    value={this.state.selectedNode}
                    onChange={this.onSelectNode}
                    aria-label="Select node"
                  />
                </EuiFlexItem>
              )}
              <EuiFlexItem grow={false} style={{ paddingTop: '10px' }}>
                <EuiSwitch
                  label="Descending sort"
                  checked={this.state.descendingSort}
                  onChange={this.onSortSwitchChange}
                />
              </EuiFlexItem>
              <EuiFlexItem grow={false} style={{ paddingTop: '10px' }}>
                <EuiSwitch
                  label="Realtime"
                  checked={this.state.realTime}
                  onChange={() => this.switchRealTime()}
                />
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiFlexItem>
        </EuiFlexGroup>
        <EuiSpacer size={'s'}></EuiSpacer>
        <EuiFlexGroup>
          <EuiFlexItem>
            <WzFieldSearch
              searchDelay={500}
              onChange={this.onSearchBarChange}
              onSearch={this.onSearchBarSearch}
              placeholder="Filter logs"
              aria-label="Filter logs"
              fullWidth
            />
          </EuiFlexItem>
        </EuiFlexGroup>
      </div>
    );
  }

  async loadExtraLogs() {
    this.setState({ loadingLogs: true });
    const customOffset = this.state.offset + 100;
    const result = await this.getFullLogs(customOffset);
    this.setState({
      offset: customOffset,
      logsList: this.state.logsList.concat(result),
      loadingLogs: false
    });
  }

  logsTable() {
    return (
      <div>
        {(this.state.logsList && (
          <Fragment>
            <div className='code-block-log-viewer-container'>
              <EuiCodeBlock
                fontSize="s"
                paddingSize="m"
                color="dark"
                overflowHeight={this.height}
              >
                {this.state.logsList}
              </EuiCodeBlock>
            </div>
            <EuiSpacer size="m" />
            {(this.state.offset + 100 < this.state.totalItems && (
              <EuiFlexGroup justifyContent='center'>
                <EuiFlexItem grow={false} style={{marginTop: 0, marginBottom: 0}}>
                  <EuiButtonEmpty
                    iconType='refresh'
                    isLoading={this.state.loadingLogs}
                    isDisabled={this.state.loadingLogs}
                    onClick={!this.state.loadingLogs ? () => this.loadExtraLogs() : undefined}
                  >
                    Load more logs
                  </EuiButtonEmpty>
                </EuiFlexItem>
              </EuiFlexGroup>
            ))}
          </Fragment>
        )) || (
          <EuiCallOut
            color="warning"
            title="No results match your search criteria."
            iconType="alert"
          ></EuiCallOut>
        )}
      </div>
    );
  }

  render() {
    return (
      <EuiPage>
        <EuiPageBody>
          <EuiPanel paddingSize="l">
            {this.header()}
            <EuiSpacer size={'m'}></EuiSpacer>
            {(!this.state.isLoading && this.logsTable()) || (
              <EuiFlexGroup alignItems="center" justifyContent="center">
                <EuiFlexItem>
                  <EuiSpacer></EuiSpacer>
                  <EuiProgress size="xs" color="primary" />
                </EuiFlexItem>
              </EuiFlexGroup>
            )}
          </EuiPanel>
        </EuiPageBody>
      </EuiPage>
    );
  }
})
