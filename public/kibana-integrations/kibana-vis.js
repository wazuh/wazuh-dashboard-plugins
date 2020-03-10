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
import _ from 'lodash';
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
import { toastNotifications } from 'ui/notify';

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
      overlays: npStart.core.overlays,
    };
    this.savedObjectLoaderVisualize = createSavedVisLoader(services);
    this.factory = null;
    this.visID = this.props.visID;
    this.tab = this.props.tab;
  }

  showToast = (color, title, text, time) => {
    toastNotifications.add({
      color: color,
      title: title,
      text: text,
      toastLifeTimeMs: time,
    });
  };

  componentDidMount() {
    this._isMounted = true;
  }

  componentWillUnmount() {
    if (this._isMounted) {
      this._isMounted = false;
      this.updateVis();
      this.destroyAll();
    }
  }


  componentDidUpdate(prevProps) {
    this.visID = this.props.visID;
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
        const data = await this.visHandler.handler.dataHandler.getData();
        if (data && data.value && data.value.visData && data.value.visData.rows && this.props.state[this.visID] !== data.value.visData.rows['0']['col-0-1'])
          store.dispatch(
            this.updateMetric({ name: this.visID, value: data.value.visData.rows['0']['col-0-1'] })
          );
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

  myRender = async raw => {
    try {
     /* const isFound = raw.filter(item => item && item.id === this.visID);
      if(!isFound.length){
        this.rendered = true;
        this.destroyAll();
      }*/
      const discoverList = this.discoverPendingUpdates.getList();
      const isAgentStatus = this.visID === 'Wazuh-App-Overview-General-Agents-status';
      const timeFilterSeconds = this.calculateTimeFilterSeconds(timefilter.getTime());
      const timeRange =
        isAgentStatus && timeFilterSeconds < 900
          ? { from: 'now-15m', to: 'now', mode: 'quick' }
          : timefilter.getTime();
      const filters = isAgentStatus ? [] : discoverList[1] || [];
      const query = !isAgentStatus ? discoverList[0] : {};

      const visInput = {
        timeRange,
        filters,
        query,
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
          this.visualization = await this.savedObjectLoaderVisualize.get(this.visID, rawVis[0]);

          // Visualization doesn't need the "_source"
          this.visualization.searchSource.setField('source', false);
          // Visualization doesn't need "hits"
          this.visualization.searchSource.setField('size', 0);

          this.visHandler = await this.factory.createFromObject(this.visualization, visInput);
          this.visHandler.render($(`[id="${this.visID}"]`)[0]).then(() => {
            this.visHandler.handler.data$.subscribe(this.renderComplete);
          });
          this.visHandlers.addItem(this.visHandler);
          this.setSearchSource(discoverList);
        } else if (this.rendered && !this.deadField) {
          // There's a visualization object -> just update its filters
          this.rendered = true;
          this.props.updateRootScope('rendered', 'true');
          this.visHandler.updateInput(visInput);
          this.setSearchSource(discoverList);
        }
      }
    } catch (error) {
      console.log(error)
      if (((error || {}).message || '').includes('not locate that index-pattern-field')) {
        if (this.deadField) {
          this.tabVisualizations.addDeadVis();
          return this.renderComplete();
        }
        this.deadField = true;
        if (!this.lockFields) {
          try {
            this.lockFields = true;
            await this.genericReq.request('GET', '/elastic/known-fields/all', {});
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
    } catch (error) {
      console.log("destroy all err", error)
    } // eslint-disable-line
    try {
      this.visHandler.destroy();
    } catch (error) {
      console.log("destroy viss err", error)
    } // eslint-disable-line
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

    this.props.updateRootScope('loadingStatus', 'Fetching data...');
    
    if (totalTabVis < 1) {
      this.props.updateRootScope('resultState', 'none');
    } else {
      const currentCompleted = Math.round((currentLoaded / totalTabVis) * 100);

      const visTitle = (((this.visHandler || {}).vis || {})._state || {}).title;
      if (visTitle === 'Mitre attack count') {
        //   $scope.$emit('sendVisDataRows', {
        //     mitreRows: visHandler.dataLoader['visData'],
        //   });
      }
      if (this.props.isMetric) {
        this.callUpdateMetric();
      }
      if (currentCompleted >= 100) {
        this.props.updateRootScope('rendered', 'true');
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
        this.props.updateRootScope('rendered', 'false');
      }
    }
  };

  render() {
    return this.visID && <div id={this.visID} vis-id={this.visID} style={{ height: '100%' }}></div>;
  }
}

const mapStateToProps = state => {
  return {
    state: state.visualizationsReducers,
  };
};

export default connect(mapStateToProps, null)(KibanaVis);
