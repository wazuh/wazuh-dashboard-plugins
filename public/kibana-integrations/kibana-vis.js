/*
 * Wazuh app - React component for custom kibana visualizations.
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

import $ from 'jquery';
import dateMath from '@elastic/datemath';
import { DiscoverPendingUpdates } from '../factories/discover-pending-updates';
import { connect } from 'react-redux';
import { LoadedVisualizations } from '../factories/loaded-visualizations';
import { RawVisualizations } from '../factories/raw-visualizations';
import { VisHandlers } from '../factories/vis-handlers';
import { AppState } from '../react-services';
import { TabVisualizations } from '../factories/tab-visualizations';
import store from '../redux/store';
import { updateMetric } from '../redux/actions/visualizationsActions';
import { GenericRequest } from '../react-services/generic-request';
import { createSavedVisLoader } from './visualizations/saved_visualizations';
import { WzDatePicker } from '../components/wz-date-picker/wz-date-picker';
import { PersistedState } from '../../../../src/plugins/visualizations/public';
import {
  EuiLoadingChart,
  EuiLoadingSpinner,
  EuiToolTip,
  EuiIcon,
  EuiFlexItem,
  EuiFlexGroup,
  EuiEmptyPrompt
} from '@elastic/eui';
import {
  getAngularModule,
  getToasts,
  getVisualizationsPlugin,
  getSavedObjects,
  getDataPlugin,
  getChrome,
  getOverlays,
  getPlugins,
} from '../kibana-services';
import { KnownFields } from '../utils/known-fields';
import { union } from 'lodash';
import { getFilterWithAuthorizedAgents } from '../react-services/filter-authorization-agents';
import { AUTHORIZED_AGENTS } from '../../common/constants';

class KibanaVis extends Component {
  _isMounted = false;

  constructor(props) {
    super(props);
    this.lockFields = false;
    this.implicitFilter = '';
    this.rawFilters = [];
    this.rendered = false;
    this.visualization = null;
    this.visHandler = null;
    this.renderInProgress = false;
    this.deadField = false;
    this.mapClicked = false;
    this.updateMetric = updateMetric;
    this.genericReq = GenericRequest;
    this.discoverPendingUpdates = new DiscoverPendingUpdates();
    this.loadedVisualizations = new LoadedVisualizations();
    this.rawVisualizations = new RawVisualizations();
    this.visHandlers = new VisHandlers();
    this.tabVisualizations = new TabVisualizations();
    this.state = {
      visRefreshingIndex: false,
    };
    const services = {
      savedObjectsClient: getSavedObjects().client,
      indexPatterns: getDataPlugin().indexPatterns,
      search: getDataPlugin().search,
      chrome: getChrome(),
      overlays: getOverlays(),
      savedObjects: getPlugins().savedObjects,
    };
    const servicesForVisualizations = {
      ...services,
      ...{ visualizationTypes: getVisualizationsPlugin() },
    };
    this.savedObjectLoaderVisualize = createSavedVisLoader(servicesForVisualizations);
    this.visID = this.props.visID;
    this.tab = this.props.tab;
  }

  showToast = (color, title, text, time) => {
    getToasts().add({
      color: color,
      title: title,
      text: text,
      toastLifeTimeMs: time,
    });
  };

  componentDidMount() {
    this._isMounted = true;
    const app = getAngularModule();
    this.$rootScope = app.$injector.get('$rootScope');
  }

  componentWillUnmount() {
    if (this._isMounted) {
      this._isMounted = false;
      // It would be good to continue investigating if it is
      // necessary for the renderComplete() to be in the
      // componentWillUnmount.
      // In the renderComplete() the value of the $rootScope
      // is changed, which affects the entire application.
      // 
      // Related issue:
      // https://github.com/wazuh/wazuh-kibana-app/issues/4158
      if (this.deadField) {
        return this.renderComplete();
      }
      this.destroyAll();
    }
  }

  componentDidUpdate() {
    if (this.props.state.shouldUpdate && !this.state.visRefreshingIndex) {
      this.updateVis();
    }
  }

  updateVis() {
    if (this.deadField) {
      return this.renderComplete();
    }
    const rawVis = this.rawVisualizations.getList();
    if (Array.isArray(rawVis) && rawVis.length) {
      this.myRender(rawVis);
    }
  }

  async callUpdateMetric() {
    try {
      if (this.visHandler) {
        const data = await this.visHandler.handler.execution.getData();
        if (
          data &&
          data.value &&
          data.value.visData &&
          data.value.visData.rows &&
          this.props.state[this.visID] !== data.value.visData.rows['0']['col-0-1']
        ) {
          store.dispatch(
            this.updateMetric({
              name: this.visID,
              value: data.value.visData.rows['0']['col-0-1'],
            })
          );
        }
        // This check if data.value.visData.tables exists and dispatch that value as stat
        // FIXME: this is correct?
        if (
          data &&
          data.value &&
          data.value.visData &&
          data.value.visData.tables &&
          data.value.visData.tables.length &&
          data.value.visData.tables['0'] &&
          data.value.visData.tables['0'].rows &&
          data.value.visData.tables['0'].rows['0'] &&
          this.props.state[this.visID] !== data.value.visData.tables['0'].rows['0']['col-0-2']
        ) {
          store.dispatch(
            this.updateMetric({
              name: this.visID,
              value: data.value.visData.tables['0'].rows['0']['col-0-2'],
            })
          );
        }
      }
    } catch (error) {
      this.showToast('danger', 'Error', error.message || error, 4000);
    }
  }

  calculateTimeFilterSeconds = ({ from, to }) => {
    try {
      const fromParsed = dateMath.parse(from);
      const toParsed = dateMath.parse(to);
      const totalSeconds = (toParsed - fromParsed) / 1000;
      return totalSeconds;
    } catch (error) {
      return 0;
    }
  };

  setSearchSource = (discoverList) => {
    try {
      const isCluster = this.visID.includes('Cluster');
      if (isCluster) {
        // Checks for cluster.name or cluster.node filter existence
        const monitoringFilter = discoverList[1].filter(
          (item) =>
            item &&
            item.meta &&
            item.meta.key &&
            (item.meta.key.includes('cluster.name') || item.meta.key.includes('cluster.node'))
        );

        // Applying specific filter to cluster monitoring vis
        if (Array.isArray(monitoringFilter) && monitoringFilter.length) {
          this.visualization.searchSource.setField('filter', monitoringFilter);
        }
      }
    } catch (error) {
      this.showToast('danger', 'Error', error.message || error, 4000);
    }
  };

  myRender = async (raw) => {
    const timefilter = getDataPlugin().query.timefilter.timefilter;
    try {
      const discoverList = this.discoverPendingUpdates.getList();
      const isAgentStatus = this.visID === 'Wazuh-App-Overview-General-Agents-status';
      const timeFilterSeconds = this.calculateTimeFilterSeconds(timefilter.getTime());
      const timeRange =
        isAgentStatus && timeFilterSeconds < 900
          ? { from: 'now-15m', to: 'now', mode: 'quick' }
          : timefilter.getTime();
      let filters = isAgentStatus
        ? [
            {
              meta: {
                index: 'wazuh-monitoring-*',
                alias: null,
                negate: false,
                disabled: false,
              },
              query: {
                bool: {
                  should: [
                    {
                      term:
                        AppState.getClusterInfo().status === 'enabled'
                          ? { 'cluster.name': AppState.getClusterInfo().cluster }
                          : { 'manager.keyword': AppState.getClusterInfo().manager },
                    },
                  ],
                },
              },
              $state: {
                store: 'appState',
              },
            },
          ]
        : discoverList[1] || [];
      const query = !isAgentStatus ? discoverList[0] : {};

      const rawVis = raw ? raw.filter((item) => item && item.id === this.visID) : [];

      if (rawVis.length && discoverList.length) {
        let vizPattern;
        try {
          vizPattern = JSON.parse(rawVis[0].attributes.kibanaSavedObjectMeta.searchSourceJSON)
            .index;
        } catch (ex) {
          console.warn(`plugin platform-vis exception: ${ex.message || ex}`);
        }

        if (!filters.find((filter) => filter.meta.controlledBy === AUTHORIZED_AGENTS)) {
          const agentsFilters = getFilterWithAuthorizedAgents(this.props.allowedAgents, vizPattern);
          filters = agentsFilters ? union(filters, [agentsFilters]) : filters;
        }

        const visInput = {
          timeRange,
          filters,
          query,
        };

        // There are pending updates from the discover (which is the one who owns the true app state)

        if (!this.visualization && !this.rendered && !this.renderInProgress) {
          // There's no visualization object -> create it with proper filters
          this.renderInProgress = true;
          this.visualization = await this.savedObjectLoaderVisualize.get(this.visID, rawVis[0]);
          this.visualization.searchSource = await getDataPlugin().search.searchSource.create();
          // Visualization doesn't need the "_source"
          this.visualization.searchSource.setField('source', false);
          // Visualization doesn't need "hits"
          this.visualization.searchSource.setField('size', 0);
          const visState = await getVisualizationsPlugin().convertToSerializedVis(
            this.visualization
          );
          
          // In Kibana 7.10.2, there is a bug when creating the visualization with `createVis` method of the Visualization plugin that doesn't pass the `visState` parameter to the `Vis` class constructor.
          // This does the `.params`, `.uiState` and `.id` properties of the visualization are not set correctly in the `Vis` class constructor. This bug causes
          // that the visualization, for example, doesn't use the defined colors in the `.uiStateJSON` property.
          // `createVis` method of Visualizations plugin: https://github.com/elastic/kibana/blob/v7.10.2/src/plugins/visualizations/public/plugin.ts#L207-L211
          // `Vis` class constructor: https://github.com/elastic/kibana/blob/v7.10.2/src/plugins/visualizations/public/vis.ts#L99-L104
          // This problem would be fixed replicating the logic of Visualization plugin's `createVis` method and passing the expected parameters to the `Vis` class constructor
          // but there is an error in the generated plugin package in production related to `Types was not set`.
          // The remediation is creating the visualization with `.createVis` and set the `.params` and `.uiState` and `.id` properties
          // as is done in the `Vis` class constructor https://github.com/elastic/kibana/blob/v7.10.2/src/plugins/visualizations/public/vis.ts#L99-L104
          const vis = await getVisualizationsPlugin().createVis(
            this.visualization.visState.type,
            visState
          );
          vis.params = vis.getParams(visState.params);
          vis.uiState = new PersistedState(visState.uiState);
          vis.id = visState.id;
          
          this.visHandler = await getVisualizationsPlugin().__LEGACY.createVisEmbeddableFromObject(
            vis,
            visInput
          );
          await this.visHandler.render($(`[id="${this.visID}"]`)[0]);
          this.visHandler.handler.data$.subscribe(this.renderComplete());
          this.visHandlers.addItem(this.visHandler);
          this.setSearchSource(discoverList);
        } else if (this.rendered && !this.deadField) {
          // There's a visualization object -> just update its filters

          if (this.props.isMetric) {
            this.callUpdateMetric();
          }

          this.rendered = true;
          this.$rootScope.rendered = 'true';
          this.visHandler.updateInput(visInput);
          this.setSearchSource(discoverList);
        }
        if (this.state.visRefreshingIndex) this.setState({ visRefreshingIndex: false });
      }
    } catch (error) {
      if (((error || {}).message || '').includes('not locate that index-pattern-field')) {
        if (this.deadField) {
          this.tabVisualizations.addDeadVis();
          return this.renderComplete();
        }
        const match = error.message.match(/id:(.*)\)/);
        this.deadField = match[1] || true;
        if (this.props.refreshKnownFields && !this.hasRefreshed) {
          this.hasRefreshed = true;
          this.setState({ visRefreshingIndex: true });
          this.deadField = false;
          this.visualization = null;
          this.renderInProgress = false;
          this.rendered = false;

          // if there's a field name it looks for known fields structures
          const foundField =
            match[1] && KnownFields.find((field) => field.name === match[1].trim());

          await this.props.refreshKnownFields(foundField);
        }
        this.renderInProgress = false;
        return this.myRender(raw);
      } else {
        console.error(error);
      }
    }

    return;
  };

  destroyAll = () => {
    try {
      this.visualization.destroy();
    } catch (error) {} // eslint-disable-line
    try {
      this.visHandler.destroy();
      this.visHandler = null;
    } catch (error) {} // eslint-disable-line
  };

  renderComplete = async () => {
    const visId = this.visID.toLowerCase();

    if (!visId.includes(this.props.tab)) {
      this.destroyAll();
      return;
    }

    this.rendered = true;
    this.loadedVisualizations.addItem(true);

    const currentLoaded = this.loadedVisualizations.getList().length;
    const deadVis = this.props.tab === 'ciscat' ? 0 : this.tabVisualizations.getDeadVis();
    const totalTabVis = this.tabVisualizations.getItem(this.props.tab) - deadVis;
    this.$rootScope.loadingStatus = 'Fetching data...';

    if (totalTabVis < 1) {
      this.$rootScope.resultState = 'none';
    } else {
      const currentCompleted = Math.round((currentLoaded / totalTabVis) * 100);
      if (currentCompleted >= 100) {
        this.$rootScope.rendered = 'true';
        if (visId.includes('AWS-geo')) {
          const canvas = $('.visChart.leaflet-container .leaflet-control-zoom-in');
          setTimeout(() => {
            if (!this.mapClicked) {
              this.mapClicked = true;
              canvas[0].click();
            }
          }, 1000);
        }
      } else if (this.visID !== 'Wazuh-App-Overview-General-Agents-status') {
        this.$rootScope.rendered = 'false';
      }
    }
    if (typeof this.props.onRenderComplete === 'function') this.props.onRenderComplete();
  };

  showDateRangePicker = () => {
    return !this.deadField && !this.state.visRefreshingIndex && this.visID === 'Wazuh-App-Overview-General-Agents-status'
  }

  DateRangePickerComponent = () => {
    return (
      <EuiFlexItem className="agents-evolutions-dpicker">
        <WzDatePicker
          condensed={true} 
          onTimeChange={() => {}} 
        />
      </EuiFlexItem>
    )
  }

  render() {
    const isLoading = this.props.resultState === 'loading';
    return (
      this.visID && (
        <span>
          <div
            style={{
              display: this.state.visRefreshingIndex ? 'block' : 'none',
              textAlign: 'center',
              paddingTop: 100,
            }}
          >
            <EuiFlexGroup style={{ placeItems: 'center' }}>
              <EuiFlexItem></EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiLoadingSpinner size="xl" />
              </EuiFlexItem>
              <EuiFlexItem grow={false}>Refreshing Index Pattern.</EuiFlexItem>

              <EuiFlexItem></EuiFlexItem>
            </EuiFlexGroup>
          </div>
          <div
            style={{
              display: isLoading && !this.state.visRefreshingIndex ? 'block' : 'none',
              textAlign: 'center',
              paddingTop: 100,
            }}
          >
            <EuiLoadingChart size="xl" />
          </div>
          <div
            style={{
              display:
                this.deadField && !isLoading && !this.state.visRefreshingIndex ? 'block' : 'none',
              textAlign: 'center',
              paddingTop: 100,
            }}
          >
            No results found &nbsp;
            <EuiToolTip
              position="top"
              content={
                <span>
                  No alerts were found with the field: <strong>{this.deadField}</strong>
                </span>
              }
            >
              <EuiIcon type="iInCircle" />
            </EuiToolTip>
          </div>
          {   
            !this.isLoading && this.showDateRangePicker() &&
            this.DateRangePickerComponent()
          }
          <div
            id={this.visID}
            vis-id={this.visID}
            style={{ 
              display: isLoading ? 'none' : 'block', 
              height: '100%',
              paddingTop: '2%' 
            }}
          ></div>
          <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
              }}>
                {(isLoading && <div><EuiLoadingChart size="xl" /></div>)
                  || (this.deadField && !isLoading && !this.state.visRefreshingIndex && (
                    <div>
                      No results found &nbsp;
                      <EuiToolTip
                        position="top"
                        content={
                          <span>
                            No alerts were found with the field: <strong>{this.deadField}</strong>
                          </span>
                        }
                      >
                        <EuiIcon type="iInCircle" />
                      </EuiToolTip>
                    </div>
                  ))
                  || (this.state.visRefreshingIndex && (
                    <EuiFlexGroup justifyContent="center" alignItems="center">
                      <EuiFlexItem grow={false}>
                        <EuiLoadingSpinner size="xl" />
                      </EuiFlexItem>
                      <EuiFlexItem grow={false}>Refreshing Index Pattern.</EuiFlexItem>
                    </EuiFlexGroup>
                  ))
                }
          </div>
        </span>
      )
    );
  }
}

const mapStateToProps = (state) => {
  return {
    state: state.visualizationsReducers,
    allowedAgents: state.appStateReducers.allowedAgents,
  };
};

export default connect(mapStateToProps, null)(KibanaVis);
