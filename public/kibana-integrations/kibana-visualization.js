/*
 * Wazuh app - Custom visualization directive
 * Copyright (C) 2015-2020 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import $ from 'jquery';
import { timefilter } from 'ui/timefilter';
import dateMath from '@elastic/datemath';
import { npStart } from 'ui/new_platform';
import { createSavedVisLoader } from './saved_visualizations';
import { TypesService } from '../../../../src/plugins/visualizations/public/vis_types';
import { getAngularModule } from 'plugins/kibana/discover/kibana_services';
import { GenericRequest } from '../react-services/generic-request';
import { ErrorHandler } from '../react-services/error-handler';
import { TabVisualizations } from '../factories/tab-visualizations';
const app = getAngularModule('app/wazuh');
let lockFields = false;

app.directive('kbnVis', function() {
  return {
    restrict: 'E',
    scope: {
      visID: '=visId',
      specificTimeRange: '=specificTimeRange'
    },
    controller(
      $scope,
      $rootScope,
      errorHandler,
      rawVisualizations,
      loadedVisualizations,
      discoverPendingUpdates,
      visHandlers
    ) {
      const tabVisualizations = new TabVisualizations();
      let rendered = false;
      let visualization = null;
      let visHandler = null;
      let renderInProgress = false;
      let deadField = false;
      let mapClicked = false;
      const services = {
        savedObjectsClient: npStart.core.savedObjects.client,
        indexPatterns: npStart.plugins.data.indexPatterns,
        search: npStart.plugins.data.search,
        chrome: npStart.core.chrome,
        overlays: npStart.core.overlays
      };
      const servicesForVisualizations = {
        ...services,
        ...{ visualizationTypes: new TypesService().start() },
      }
      const savedObjectLoaderVisualize = createSavedVisLoader(servicesForVisualizations);

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
          const isCluster = $scope.visID.includes('Cluster');
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
              visualization.searchSource.setField('filter', monitoringFilter);
            }
          }
        } catch (error) {
          ErrorHandler.handle(error, 'Visualize - setSearchSource');
        }
      };

      const myRender = async raw => {
        try {
          const discoverList = discoverPendingUpdates.getList();
          const isAgentStatus =
            $scope.visID === 'Wazuh-App-Overview-General-Agents-status';
          const timeFilterSeconds = calculateTimeFilterSeconds(
            timefilter.getTime()
          );
          const timeRange =
            isAgentStatus && timeFilterSeconds < 900
              ? { from: 'now-15m', to: 'now', mode: 'quick' }
              : timefilter.getTime();
          const filters = isAgentStatus ? [] : discoverList[1] || [];
          const query = !isAgentStatus ? discoverList[0] : {};

          const visInput = {
            timeRange,
            filters,
            query
          };

          if (raw && discoverList.length) {
            // There are pending updates from the discover (which is the one who owns the true app state)

            if (!visualization && !rendered && !renderInProgress) {
              // There's no visualization object -> create it with proper filters
              renderInProgress = true;
              const rawVis = raw.filter(
                item => item && item.id === $scope.visID
              );
              visualization = await savedObjectLoaderVisualize.get(
                $scope.visID,
                rawVis[0]
              );

              // Visualization doesn't need the "_source"
              visualization.searchSource.setField('source', false);
              // Visualization doesn't need "hits"
              visualization.searchSource.setField('size', 0);

              visHandler = await npStart.plugins.visualizations.__LEGACY.createVisEmbeddableFromObject(
                visualization,
                visInput
              );
              await visHandler.render($(`[vis-id="'${$scope.visID}'"]`)[0]);
              visHandler.handler.data$.subscribe(renderComplete());
              visHandlers.addItem(visHandler);

              setSearchSource(discoverList);
            } else if (rendered && !deadField) {
              // There's a visualization object -> just update its filters
              $rootScope.rendered = true;
              visHandler.updateInput(visInput);
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
                await GenericRequest.request(
                  'GET',
                  '/elastic/known-fields/all',
                  {}
                );
                lockFields = false;
              } catch (error) {
                lockFields = false;
                ErrorHandler.handle(
                  error,
                  'Error fetching new index pattern fields'
                );
              }
            }

            renderInProgress = false;
            return myRender(raw);
          } else {
            ErrorHandler.handle(error, 'Visualize');
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
        } catch (error) {} // eslint-disable-line
        try {
          visHandler.destroy();
        } catch (error) {} // eslint-disable-line
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

          if (currentCompleted >= 100) {
            $rootScope.rendered = true;
            $rootScope.loadingStatus = 'Fetching data...';

            if ($scope.visID.includes('AWS-geo')) {
              const canvas = $(
                '.visChart.leaflet-container .leaflet-control-zoom-in'
              );
              setTimeout(function() {
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
    }
  };
});
