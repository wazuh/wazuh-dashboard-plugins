/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import { uiModules } from 'ui/modules';

import toggleHtml from './kbn_global_timepicker.html';
import { timeNavigation } from './time_navigation';
import { timefilter } from 'ui/timefilter';
import { prettyDuration } from 'ui/timepicker/pretty_duration';
import { prettyInterval } from 'ui/timepicker/pretty_interval';

// WAZUH. Renamed from kbnGlobalTimepicker to wzKbnGlobalTimepicker
uiModules
  .get('kibana')
  .directive('wzKbnGlobalTimepicker', (globalState, config, $rootScope) => {
    const getConfig = (...args) => config.get(...args);

    const listenForUpdates = ($scope) => {
      $scope.$listenAndDigestAsync(timefilter, 'refreshIntervalUpdate', () => {
        setTimefilterValues($scope);
      });
      $scope.$listenAndDigestAsync(timefilter, 'timeUpdate', () => {
        setTimefilterValues($scope);
      });
      $scope.$listenAndDigestAsync(timefilter, 'enabledUpdated', () => {
        setTimefilterValues($scope);
      });
    };

    function setTimefilterValues($scope) {
      console.log('setTimefilterValues')
      $rootScope.$broadcast('updateVis')
      const time = timefilter.getTime();
      const refreshInterval = timefilter.getRefreshInterval();
      $scope.timefilterValues = {
        refreshInterval: refreshInterval,
        time: time,
        display: {
          time: prettyDuration(time.from, time.to, getConfig),
          refreshInterval: prettyInterval(refreshInterval.value),
        },
        isAutoRefreshSelectorEnabled: timefilter.isAutoRefreshSelectorEnabled,
        isTimeRangeSelectorEnabled: timefilter.isTimeRangeSelectorEnabled,
      };
    }

    return {
      template: toggleHtml,
      replace: true,
      require: '^wzKbnTopNav',
      link: ($scope, element, attributes, wzKbnTopNav) => {
        listenForUpdates($scope);

        setTimefilterValues($scope);

        $scope.toggleRefresh = () => {
          timefilter.toggleRefresh();
        };

        $scope.forward = function () {
          timefilter.setTime(timeNavigation.stepForward(timefilter.getBounds()));
        };

        $scope.back = function () {
          timefilter.setTime(timeNavigation.stepBackward(timefilter.getBounds()));
        };

        $scope.updateFilter = function (from, to, mode) {
          timefilter.setTime({ from, to, mode });
          wzKbnTopNav.close('filter');
        };

        $scope.updateInterval = function (interval) {
          timefilter.setRefreshInterval(interval);
          wzKbnTopNav.close('interval');
        };

        $scope.getSharedTimeFilterFromDate = function () {
          return (timefilter.isAutoRefreshSelectorEnabled || timefilter.isTimeRangeSelectorEnabled)
            ? timefilter.getBounds().min.clone().utc().format()
            : null;
        };

        $scope.getSharedTimeFilterToDate = function () {
          return (timefilter.isAutoRefreshSelectorEnabled || timefilter.isTimeRangeSelectorEnabled)
            ? timefilter.getBounds().max.clone().utc().format()
            : null;
        };
      },
    };
  });