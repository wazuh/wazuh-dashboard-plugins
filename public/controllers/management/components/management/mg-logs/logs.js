import React, { Component, Fragment } from 'react';
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiSelect,
  EuiSwitch,
  EuiSpacer,
  EuiFieldSearch,
  EuiButton,
  EuiPage,
  EuiPageBody,
  EuiCodeBlock,
  EuiPanel,
  EuiTitle,
  EuiTextColor,
  EuiProgress,
  EuiCallOut,
  EuiIcon,
  EuiLoadingSpinner
} from '@elastic/eui';
import 'brace/mode/less';
import 'brace/theme/github';
import { ApiRequest } from '../../../../../react-services/api-request';
import { updateGlobalBreadcrumb } from '../../../../../redux/actions/globalBreadcrumbActions';
import store from '../../../../../redux/store';

export default class WzLogs extends Component {
  constructor(props) {
    super(props);
    this.offset = 377;
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

  setGlobalBreadcrumb() {
    const breadcrumb = [
      { text: '' },
      { text: 'Management', href: '/app/wazuh#/manager' },
      { text: 'Logs' }
    ];
    store.dispatch(updateGlobalBreadcrumb(breadcrumb));
  }

  async componentDidMount() {
    this.setGlobalBreadcrumb();
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
    });

    await this.setFullLogs();

    this.setState({
      isLoading: false
    });
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.updateHeight);
    clearInterval(this.realTimeInterval);
  }

  async initDaemonsList(logsPath) {
    try {
      const path = logsPath + '/summary';
      const data = await ApiRequest.request('GET', path, {});
      const formattedData = ((data || {}).data || {}).data || {};
      const daemonsList = [...['all'], ...Object.keys(formattedData)];
      this.setState({ daemonsList });
    } catch (err) {
      throw new Error('Error obtaining daemons list.');
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
      result['type_log'] = this.state.logLevelSelect;
    if (this.state.selectedDaemon !== 'all')
      result['category'] = this.state.selectedDaemon;
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
        const tmpResult = await ApiRequest.request(
          'GET',
          logsPath,
          this.buildFilters(customOffset)
        );
        const resultItems = ((tmpResult || {}).data.data || {}).items;
        totalItems = ((tmpResult || {}).data.data || {}).totalItems;
        result = this.parseLogsToText(resultItems) || '';
      } catch (err) {
        result = '';
        throw new Error('Error obtaining logs.');
      }
    } else {
      try {
        const tmpResult = await ApiRequest.request(
          'GET',
          logsPath,
          this.buildFilters(customOffset)
        );
        const resultItems = ((tmpResult || {}).data.data || {}).items;
        totalItems = ((tmpResult || {}).data.data || {}).totalItems;
        result = this.parseLogsToText(resultItems) || '';
      } catch (err) {
        result = '';
        throw new Error('Error obtaining logs');
      }
    }
    this.setState({ totalItems });
    return result;
  }

  async setFullLogs() {
    const result = await this.getFullLogs();
    this.setState({ logsList: result, offset: 0 });
  }

  /**
   * Returns an object with the path to request Wazuh logs, the list of nodes and the current selected node.
   */
  async getLogsPath() {
    try {
      const clusterStatus = await ApiRequest.request(
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
        const nodeListTmp = await ApiRequest.request(
          'GET',
          '/cluster/nodes',
          {}
        );
        if (
          Array.isArray((((nodeListTmp || {}).data || {}).data || {}).items)
        ) {
          nodeList = nodeListTmp.data.data.items;
          selectedNode = nodeListTmp.data.data.items.filter(
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
      throw new Error('Error obtaining logs path.');
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
      { value: 'INFO', text: 'Info' },
      { value: 'ERROR', text: 'Error' },
      { value: 'WARNING', text: 'Warning' },
      { value: 'CRITICAL', text: 'Critical' },
      { value: 'DEBUG', text: 'Debug' }
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
      throw new Error('Error obtaining list of nodes.');
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
      searchBarValue: e.target.value
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
        </EuiFlexGroup>
        <EuiFlexGroup>
          <EuiFlexItem>
            <EuiTextColor color="subdued">
              <p>List and filter Wazuh logs.</p>
            </EuiTextColor>
          </EuiFlexItem>
        </EuiFlexGroup>
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
        </EuiFlexGroup>
        <EuiSpacer size={'s'}></EuiSpacer>
        <EuiFlexGroup>
          <EuiFlexItem>
            <EuiFieldSearch
              fullWidth={true}
              placeholder="Filter logs..."
              value={this.state.searchBarValue}
              onChange={this.onSearchBarChange}
              onSearch={this.onSearchBarSearch}
              aria-label="Filter logs..."
            />
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiButton onClick={() => this.makeSearch()}>Search</EuiButton>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            {(!this.state.realTime && (
              <EuiButton onClick={() => this.switchRealTime()} iconType="play">
                Play realtime
              </EuiButton>
            )) || (
              <EuiButton
                onClick={() => this.switchRealTime()}
                color="danger"
                iconType="stop"
              >
                Stop realtime
              </EuiButton>
            )}
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
            <EuiCodeBlock
              fontSize="s"
              paddingSize="m"
              color="dark"
              overflowHeight={this.height}
            >
              {this.state.logsList}
            </EuiCodeBlock>
            <EuiSpacer size="m" />
            {(this.state.offset + 100 < this.state.totalItems &&
              !this.state.loadingLogs && (
                <p
                  className="wz-load-extra"
                  onClick={() => this.loadExtraLogs()}
                >
                  {' '}
                  <EuiIcon type="refresh" />
                  &nbsp; Click here to load more logs.
                </p>
              )) ||
              (this.state.loadingLogs && (
                <p className="wz-load-extra">
                  {' '}
                  <EuiLoadingSpinner size="m" />
                  &nbsp; Loading...
                </p>
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
          <EuiPanel>
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
}
