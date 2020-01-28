/*
 * Wazuh app - React component for custom kibana visualizations.
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

import $ from 'jquery';
import { getVisualizeLoader } from 'ui/visualize/loader';
import { timefilter } from 'ui/timefilter';
import dateMath from '@elastic/datemath';

import { DiscoverPendingUpdates } from '../../factories/discover-pending-updates';
import chrome from 'ui/chrome';
import { LoadedVisualizations } from '../../factories/loaded-visualizations';
import { RawVisualizations } from '../../factories/raw-visualizations';
import { VisHandlers } from '../../factories/vis-handlers';
import { TabVisualizations } from '../../factories/tab-visualizations';
import store from '../../redux/store';
import { updateMetric } from '../../redux/actions/visualizationsActions'
export class KibanaVis extends Component {
  _isMounted = false;

  constructor(props) {
    super(props);
    this.state = {};

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

    this.discoverPendingUpdates = new DiscoverPendingUpdates();
    this.loadedVisualizations = new LoadedVisualizations();
    this.rawVisualizations = new RawVisualizations();
    this.visHandlers = new VisHandlers();
    this.tabVisualizations = new TabVisualizations();

    this.loadSaveVisualization();

    this.loader = null;

    this.visID = this.props.visID;
    this.tab = this.props.tab;
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    if (nextProps.updateVis) {
      this.updateVis();
    }
  }

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

  async loadSaveVisualization() {
    this.$injector = await chrome.dangerouslyGetActiveInjector();
    this.wzSavedVisualizations = this.$injector.get('wzSavedVisualizations');
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
      const isAgentStatus = this.visID === 'Wazuh-App-Overview-General-Agents-status';
      const isCluster = this.visID.includes('Cluster');
      if (!isAgentStatus && !isCluster) {
        this.visualization.searchSource
          .setField('query', {
            language: discoverList[0].language || 'lucene',
            query: this.implicitFilter,
          })
          .setField(
            'filter',
            discoverList.length > 1 ? [...discoverList[1], ...this.rawFilters] : this.rawFilters
          );
      } else if (!isAgentStatus) {
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
      // errorHandler.handle(error, 'Visualize - setSearchSource');
    }
  };

  myRender = async raw => {
    try {
      if (!this.loader) {
        this.loader = await getVisualizeLoader();
      }

      const discoverList = this.discoverPendingUpdates.getList();

      const isAgentStatus = this.visID === 'Wazuh-App-Overview-General-Agents-status';
      if (raw && discoverList.length) {
        // There are pending updates from the discover (which is the one who owns the true app state)

        if (!this.visualization && !this.rendered && !this.renderInProgress) {
          // There's no visualization object -> create it with proper filters
          this.renderInProgress = true;
          const rawVis = raw.filter(item => item && item.id === this.visID);
          this.visualization = await this.wzSavedVisualizations.get(this.visID, rawVis[0]);

          // Visualization doesn't need the "_source"
          this.visualization.searchSource.setField('source', false);
          // Visualization doesn't need "hits"
          this.visualization.searchSource.setField('size', 0);

          this.rawFilters = this.visualization.searchSource.getField('filter');

          // Other case, use the pending one, if it is empty, it won't matter
          this.implicitFilter = discoverList ? discoverList[0].query : '';

          this.setSearchSource(discoverList);
          this.visHandler = this.loader.embedVisualizationWithSavedObject(
            $(`[id="${this.visID}"]`)[0],
            this.visualization,
            {}
          );

          const timeFilterSeconds = this.calculateTimeFilterSeconds(timefilter.getTime());

          this.visHandler.update({
            timeRange:
              isAgentStatus && timeFilterSeconds < 900
                ? { from: 'now-15m', to: 'now', mode: 'quick' }
                : timefilter.getTime(),
          });
          this.visHandlers.addItem(this.visHandler);
          this.visHandler.addRenderCompleteListener(this.renderComplete);
        } else if (this.rendered && !this.deadField) {
          // There's a visualization object -> just update its filters

          // Use the pending one, if it is empty, it won't matter
          this.implicitFilter = discoverList ? discoverList[0].query : '';

          const timeFilterSeconds = this.calculateTimeFilterSeconds(timefilter.getTime());

          this.visHandler.update({
            timeRange:
              isAgentStatus && timeFilterSeconds < 900
                ? { from: 'now-15m', to: 'now', mode: 'quick' }
                : timefilter.getTime(),
            filters: isAgentStatus ? [] : discoverList[1] || [],
          });

          if (!isAgentStatus) {
            this.visHandler.update({
              query: discoverList[0],
            });
          }
          this.setSearchSource(discoverList);
        }
      }
    } catch (error) {
      console.log('ERRORRRRR ', error);
      if (((error || {}).message || '').includes('not locate that index-pattern-field')) {
        if (this.deadField) {
          this.tabVisualizations.addDeadVis();
          return this.renderComplete();
        }
        this.deadField = true;
        if (!this.lockFields) {
          try {
            this.lockFields = true;
            await genericReq.request('GET', '/elastic/known-fields/all', {});
            this.lockFields = false;
          } catch (error) {
            this.lockFields = false;
            console.log(error.message || error);
            // errorHandler.handle('An error occurred fetching new index pattern fields.');
          }
        }

        this.renderInProgress = false;
        return this.myRender(raw);
      } else {
        // errorHandler.handle(error, 'Visualize');
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
    } catch (error) { } // eslint-disable-line
  };

  renderComplete = async () => {
    const visId = this.visID.toLowerCase();
    this.props.finishUpdateVis();

    if (!visId.includes(this.props.tab)) {
      this.destroyAll();
      return;
    }

    this.rendered = true;
    this.loadedVisualizations.addItem(true);

    const currentLoaded = this.loadedVisualizations.getList().length;
    const deadVis = this.props.tab === 'ciscat' ? 0 : this.tabVisualizations.getDeadVis();
    const totalTabVis = this.tabVisualizations.getItem(this.props.tab) - deadVis;

    if (totalTabVis < 1) {
      this.props.updateRootScope('resultState', 'none');
    } else {
      const currentCompleted = Math.round((currentLoaded / totalTabVis) * 100);

      this.props.updateRootScope(
        'loadingStatus',
        `Rendering visualizations... ${currentCompleted > 100 ? 100 : currentCompleted} %`
      );

      const visTitle = (((this.visHandler || {}).vis || {})._state || {}).title;
      if (this.props.type === 'metric') {
        const data = await this.visHandler.fetch();
        const updateMetric = this.updateMetric({ name: visId, value: data.value.visData.rows['0']['col-0-1'] });
        store.dispatch(updateMetric)
      }
      if (visTitle === 'Mitre attack count') {
        //   $scope.$emit('sendVisDataRows', {
        //     mitreRows: visHandler.dataLoader['visData'],
        //   });
      }
      if (currentCompleted >= 100) {
        this.props.updateRootScope('rendered', 'true');
        this.props.updateRootScope('loadingStatus', 'Fetching data...');
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
    return this.visID && (
      <div id={this.visID} vis-id={this.visID} style={{ height: '100%' }}></div>
    )
  }
}
