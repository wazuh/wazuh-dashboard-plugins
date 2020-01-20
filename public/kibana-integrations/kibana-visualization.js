/*
 * Wazuh app - Custom visualization directive
 * Copyright (C) 2015-2019 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import $ from 'jquery';
import { uiModules } from 'ui/modules';
import { getVisualizeLoader } from 'ui/visualize/loader';
import { timefilter } from 'ui/timefilter';
import dateMath from '@elastic/datemath';

const app = uiModules.get('app/wazuh', []);
let lockFields = false;

app.directive('kbnVis', function () {
  return {
    restrict: 'E',
    scope: {
      visID: '=visId',
      specificTimeRange: '=specificTimeRange'
    },
    controller(
      $scope,
      $rootScope,
      wzsavedVisualizations,
      errorHandler,
      rawVisualizations,
      loadedVisualizations,
      tabVisualizations,
      discoverPendingUpdates,
      visHandlers,
      genericReq
    ) {
      let implicitFilter = '';
      let rawFilters = [];
      let rendered = false;
      let visualization = null;
      let visHandler = null;
      let renderInProgress = false;
      let deadField = false;
      let mapClicked = false;
      const calculateTimeFilterSeconds = ({ from, to }) => {
        try {
          const fromParsed = dateMath.parse(from);
          const toParsed = dateMath.parse(to);
          const totalSeconds = (toParsed - fromParsed) / 1000;
          return totalSeconds;
        } catch (error) {
          return 0;
        }
      };

      const setSearchSource = discoverList => {
        try {
          const isAgentStatus =
            $scope.visID === 'Wazuh-App-Overview-General-Agents-status';
          const isCluster = $scope.visID.includes('Cluster');
          if (!isAgentStatus && !isCluster) {
            visualization.searchSource
              .setField('query', {
                language: discoverList[0].language || 'lucene',
                query: implicitFilter
              })
              .setField(
                'filter',
                discoverList.length > 1
                  ? [...discoverList[1], ...rawFilters]
                  : rawFilters
              );
          } else if (!isAgentStatus) {
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
              visualization.searchSource.setField('filter', monitoringFilter);
            }
          }
        } catch (error) {
          errorHandler.handle(error, 'Visualize - setSearchSource');
        }
      };

      const myRender = async raw => {
        try {
          if (!loader) {
            loader = await getVisualizeLoader();
          }

          const discoverList = discoverPendingUpdates.getList();
          const isAgentStatus =
            $scope.visID === 'Wazuh-App-Overview-General-Agents-status';
          if (raw && discoverList.length) {
            // There are pending updates from the discover (which is the one who owns the true app state)

            if (!visualization && !rendered && !renderInProgress) {
              // There's no visualization object -> create it with proper filters
              renderInProgress = true;
              const rawVis = raw.filter(
                item => item && item.id === $scope.visID
              );
              visualization = await wzsavedVisualizations.get(
                $scope.visID,
                rawVis[0]
              );

              // Visualization doesn't need the "_source"
              visualization.searchSource.setField('source', false);
              // Visualization doesn't need "hits"
              visualization.searchSource.setField('size', 0);

              rawFilters = visualization.searchSource.getField('filter');

              // Other case, use the pending one, if it is empty, it won't matter
              implicitFilter = discoverList ? discoverList[0].query : '';

              setSearchSource(discoverList);

              visHandler = loader.embedVisualizationWithSavedObject(
                $(`[vis-id="'${$scope.visID}'"]`)[0],
                visualization,
                {}
              );

              const timeFilterSeconds = calculateTimeFilterSeconds(
                timefilter.getTime()
              );

              visHandler.update({
                timeRange:
                  isAgentStatus && timeFilterSeconds < 900
                    ? { from: 'now-15m', to: 'now', mode: 'quick' }
                    : timefilter.getTime()
              });
              visHandlers.addItem(visHandler);
              visHandler.addRenderCompleteListener(renderComplete);
            } else if (rendered && !deadField) {
              // There's a visualization object -> just update its filters

              // Use the pending one, if it is empty, it won't matter
              implicitFilter = discoverList ? discoverList[0].query : '';

              const timeFilterSeconds = calculateTimeFilterSeconds(
                timefilter.getTime()
              );

              visHandler.update({
                timeRange:
                  isAgentStatus && timeFilterSeconds < 900
                    ? { from: 'now-15m', to: 'now', mode: 'quick' }
                    : timefilter.getTime(),
                filters: isAgentStatus ? [] : discoverList[1] || []
              });

              if (!isAgentStatus) {
                visHandler.update({
                  query: discoverList[0]

                });
              }
              setSearchSource(discoverList);
            }
          }
        } catch (error) {
          if (
            ((error || {}).message || '').includes(
              'not locate that index-pattern-field'
            )
          ) {
            if (deadField) {
              tabVisualizations.addDeadVis();
              return renderComplete();
            }
            deadField = true;
            if (!lockFields) {
              try {
                lockFields = true;
                await genericReq.request(
                  'GET',
                  '/elastic/known-fields/all',
                  {}
                );
                lockFields = false;
              } catch (error) {
                lockFields = false;
                console.log(error.message || error);
                errorHandler.handle(
                  'An error occurred fetching new index pattern fields.'
                );
              }
            }

            renderInProgress = false;
            return myRender(raw);
          } else {
            errorHandler.handle(error, 'Visualize');
          }
        }

        return;
      };

      // Listen for changes
      const updateVisWatcher = $scope.$on('updateVis', () => {
        if (deadField) {
          return renderComplete();
        }
        $scope.$applyAsync();
        const rawVis = rawVisualizations.getList();
        if (Array.isArray(rawVis) && rawVis.length) {
          myRender(rawVis);
        }
      });

      const destroyAll = () => {
        try {
          visualization.destroy();
        } catch (error) { } // eslint-disable-line
        try {
          visHandler.destroy();
        } catch (error) { } // eslint-disable-line
      };

      $scope.$on('$destroy', () => {
        updateVisWatcher();
        destroyAll();
      });

      const renderComplete = () => {
        const visId = $scope.visID.toLowerCase();
        const tab = tabVisualizations.getTab();

        if (!visId.includes(tab)) {
          destroyAll();
          return;
        }

        rendered = true;
        loadedVisualizations.addItem(true);

        const currentLoaded = loadedVisualizations.getList().length;
        const deadVis = tab === 'ciscat' ? 0 : tabVisualizations.getDeadVis();
        const totalTabVis = tabVisualizations.getItem(tab) - deadVis;

        if (totalTabVis < 1) {
          $rootScope.resultState = 'none';
        } else {
          const currentCompleted = Math.round(
            (currentLoaded / totalTabVis) * 100
          );

          $rootScope.loadingStatus = `Rendering visualizations... ${
            currentCompleted > 100 ? 100 : currentCompleted
            } %`;

            const visTitle = (((visHandler || {}).vis || {})._state || {}).title
            if(visTitle === 'Mitre attack count'){
              $scope.$emit('sendVisDataRows', {
                "mitreRows" : visHandler.dataLoader["visData"]
              });
            }            
          if (currentCompleted >= 100) {
            $rootScope.rendered = true;
            $rootScope.loadingStatus = 'Fetching data...';

            if ($scope.visID.includes('AWS-geo')) {
              const canvas = $('.visChart.leaflet-container .leaflet-control-zoom-in');
              setTimeout(function () {
                if (!mapClicked) {
                  mapClicked = true;
                  canvas[0].click();
                }
              }, 1000);
            }
          } else if (
            $scope.visID !== 'Wazuh-App-Overview-General-Agents-status'
          ) {
            $rootScope.rendered = false;
          }
        }

        // Forcing a digest cycle
        $rootScope.$applyAsync();
      };

      // Initializing the visualization
      let loader = null;
    }
  };
});