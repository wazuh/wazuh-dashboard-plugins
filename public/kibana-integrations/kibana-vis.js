/*
 * Wazuh app - React component for custom kibana visualizations.
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

import $ from 'jquery';
import { start as embeddables } from 'plugins/embeddable_api/np_ready/public/legacy';
import { timefilter } from 'ui/timefilter';
import dateMath from '@elastic/datemath';
import { DiscoverPendingUpdates } from '../factories/discover-pending-updates';
import { connect } from 'react-redux';
import { LoadedVisualizations } from '../factories/loaded-visualizations';
import { RawVisualizations } from '../factories/raw-visualizations';
import { VisHandlers } from '../factories/vis-handlers';
import { TabVisualizations } from '../factories/tab-visualizations';
import store from '../redux/store';
import { updateMetric } from '../redux/actions/visualizationsActions';
import { GenericRequest } from '../react-services/generic-request';
import { npStart } from 'ui/new_platform';
import { createSavedVisLoader } from './saved_visualizations';
import { TypesService } from '../../../../src/legacy/core_plugins/visualizations/public';
import { Vis } from '../../../../src/legacy/core_plugins/visualizations/public/np_ready/public/types';
import { convertToSerializedVis } from '../../../../src/legacy/core_plugins/visualizations/public/np_ready/public/saved_visualizations/_saved_vis';
import { toastNotifications } from 'ui/notify';
import { getAngularModule } from 'plugins/kibana/discover/kibana_services';

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
    const services = {
      savedObjectsClient: npStart.core.savedObjects.client,
      indexPatterns: npStart.plugins.data.indexPatterns,
      chrome: npStart.core.chrome,
      overlays: npStart.core.overlays
    };
    const servicesForVisualizations = {
      ...services,
      ...{ visualizationTypes: new TypesService().start() },
    }
    this.savedObjectLoaderVisualize = createSavedVisLoader(servicesForVisualizations);
    this.factory = null;
    this.visID = this.props.visID;
    this.tab = this.props.tab;
  }

  showToast = (color, title, text, time) => {
    toastNotifications.add({
      color: color,
      title: title,
      text: text,
      toastLifeTimeMs: time
    });
  };

  componentDidMount() {
    this._isMounted = true;
    const app = getAngularModule('app/wazuh');
    this.$rootScope = app.$injector.get('$rootScope');
  }

  componentWillUnmount() {
    if (this._isMounted) {
      this._isMounted = false;
      this.updateVis();
      this.destroyAll();
    }
  }

  componentDidUpdate() {
    if (this.props.state.shouldUpdate) {
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
          this.props.state[this.visID] !==
          data.value.visData.rows['0']['col-0-1']
        ) {
          store.dispatch(
            this.updateMetric({
              name: this.visID,
              value: data.value.visData.rows['0']['col-0-1']
            })
          );
        }
        // This check if data.value.visData.tables exists and dispatch that value as stat
        // FIXME: this is correct?
        if (data && data.value && data.value.visData && data.value.visData.tables && data.value.visData.tables.length && data.value.visData.tables['0'] && data.value.visData.tables['0'].rows && data.value.visData.tables['0'].rows['0'] && this.props.state[this.visID] !== data.value.visData.tables['0'].rows['0']['col-0-2']) {
          store.dispatch(
            this.updateMetric({ name: this.visID, value: data.value.visData.tables['0'].rows['0']['col-0-2'] })
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

  setSearchSource = discoverList => {
    try {
      const isCluster = this.visID.includes('Cluster');
      if (isCluster) {
        // Checks for cluster.name or cluster.node filter existence
        const monitoringFilter = discoverList[1].filter(
          item =>
            item &&
            item.meta &&
            item.meta.key &&
            (item.meta.key.includes('cluster.name') ||
              item.meta.key.includes('cluster.node'))
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

  myRender = async raw => {
    try {
      const discoverList = this.discoverPendingUpdates.getList();
      const isAgentStatus =
        this.visID === 'Wazuh-App-Overview-General-Agents-status';
      const timeFilterSeconds = this.calculateTimeFilterSeconds(
        timefilter.getTime()
      );
      const timeRange = this.visID === 'Wazuh-App-Overview-General-Agents-Evolution'
        ? { from: 'now-7d', to: 'now', mode: 'quick' }
        : isAgentStatus && timeFilterSeconds < 900
        ? { from: 'now-15m', to: 'now', mode: 'quick' }
        : timefilter.getTime();
      const filters = isAgentStatus ? [] : discoverList[1] || [];
      const query = !isAgentStatus ? discoverList[0] : {};

      const visInput = {
        timeRange,
        filters,
        query
      };

      if (!this.factory) {
        this.factory = embeddables.getEmbeddableFactory('visualization');
      }

      if (raw && discoverList.length) {
        // There are pending updates from the discover (which is the one who owns the true app state)

        if (!this.visualization && !this.rendered && !this.renderInProgress) {
          // There's no visualization object -> create it with proper filters
          this.renderInProgress = true;
          const rawVis = raw.filter(item => item && item.id === this.visID);
          this.visualization = await this.savedObjectLoaderVisualize.get(
            this.visID,
            rawVis[0]
          );

          // Visualization doesn't need the "_source"
          this.visualization.searchSource.setField('source', false);
          // Visualization doesn't need "hits"
          this.visualization.searchSource.setField('size', 0);
          const vis = new Vis(this.visualization.visState.type, await convertToSerializedVis(this.visualization));
          this.visHandler = await this.factory.createFromObject(
            vis,
            visInput
          );
          setTimeout(async () => {
            await this.visHandler.render($(`[id="${this.visID}"]`)[0]);
            this.visHandler.handler.data$.subscribe(this.renderComplete());
          });
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
      }
    } catch (error) {
      if (
        ((error || {}).message || '').includes(
          'not locate that index-pattern-field'
        )
      ) {
        if (this.deadField) {
          this.tabVisualizations.addDeadVis();
          return this.renderComplete();
        }
        this.deadField = true;
        if (!this.lockFields) {
          try {
            this.lockFields = true;
            await this.genericReq.request(
              'GET',
              '/elastic/known-fields/all',
              {}
            );
            this.lockFields = false;
          } catch (error) {
            this.lockFields = false;
            this.showToast(
              'danger',
              'An error occurred fetching new index pattern fields',
              error.message || error,
              4000
            );
          }
        }

        this.renderInProgress = false;
        return this.myRender(raw);
      } else {
      }
    }

    return;
  };

  destroyAll = () => {
    try {
      this.visualization.destroy();
    } catch (error) { } // eslint-disable-line
    try {
      this.visHandler.destroy();
      this.visHandler = null;
    } catch (error) { } // eslint-disable-line
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
    const deadVis =
      this.props.tab === 'ciscat' ? 0 : this.tabVisualizations.getDeadVis();
    const totalTabVis =
      this.tabVisualizations.getItem(this.props.tab) - deadVis;

    this.$rootScope.loadingStatus = 'Fetching data...';

    if (totalTabVis < 1) {
      this.$rootScope.resultState = 'none';
    } else {
      const currentCompleted = Math.round((currentLoaded / totalTabVis) * 100);
      if (currentCompleted >= 100) {
        this.$rootScope.rendered = 'true';
        if (visId.includes('AWS-geo')) {
          const canvas = $(
            '.visChart.leaflet-container .leaflet-control-zoom-in'
          );
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
  };

  render() {
    return (
      this.visID && (
        <div
          id={this.visID}
          vis-id={this.visID}
          style={{ height: '100%' }}
        ></div>
      )
    );
  }
}

const mapStateToProps = state => {
  return {
    state: state.visualizationsReducers
  };
};

export default connect(
  mapStateToProps,
  null
)(KibanaVis);
