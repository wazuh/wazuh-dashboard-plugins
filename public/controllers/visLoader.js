require('ui/styles/base.less');
require('ui/styles/mixins.less');
require('ui/share/styles/index.less');
require('ui/styles/control_group.less');
require('ui/styles/navbar.less');
require('plugins/kibana/visualize/styles/main.less');
require('ui/styles/config.less');
require('ui/styles/spinner.less');

import _ from 'lodash';
import 'plugins/kibana/visualize/saved_visualizations/saved_visualizations';
import 'plugins/kibana/visualize/editor/sidebar';
import 'plugins/kibana/visualize/editor/agg_filter';
import 'ui/visualize';
import 'ui/collapsible_sidebar';
import 'ui/share';
import 'ui/listen';
import 'ui/bind';
import 'ui/fancy_forms';
import 'ui/filter_bar'

import Notifier from 'ui/notify/notifier';
import RegistryVisTypesProvider from 'ui/registry/vis_types';
require('plugins/metric_vis/metric_vis');
require('plugins/table_vis/table_vis');
require('plugins/markdown_vis/markdown_vis');
RegistryVisTypesProvider.register(require('plugins/kbn_vislib_vis_types/histogram'));
RegistryVisTypesProvider.register(require('plugins/kbn_vislib_vis_types/line'));
RegistryVisTypesProvider.register(require('plugins/kbn_vislib_vis_types/pie'));
RegistryVisTypesProvider.register(require('plugins/kbn_vislib_vis_types/area'));
RegistryVisTypesProvider.register(require('plugins/kbn_vislib_vis_types/tile_map'));

import DocTitleProvider from 'ui/doc_title';
import UtilsBrushEventProvider from 'ui/utils/brush_event';
import FilterBarQueryFilterProvider from 'ui/filter_bar/query_filter';
import FilterBarFilterBarClickHandlerProvider from 'ui/filter_bar/filter_bar_click_handler';
import uiRoutes from 'ui/routes';
import uiModules from 'ui/modules';

import editorTemplate from 'plugins/wazuh/templates/agents-metrics.html';
import 'ui/state_management/app_state';
import StateManagementAppStateProvider from 'ui/state_management/app_state';
import 'plugins/kibana/discover/saved_searches/saved_searches.js';

import 'ui/stringify/register';
import RegistryFieldFormatsProvider from 'ui/registry/field_formats';

import 'ui/kbn_top_nav';
import 'ui/timepicker';
import 'ui/directives/paginate.js';
import 'ui/directives/rows.js';

import 'ui/directives/pretty_duration.js';
import 'ui/parse_query';
import 'ui/persisted_log';
import 'ui/typeahead';

import 'plugins/spy_modes/req_resp_stats_spy_mode';
import 'plugins/spy_modes/table_spy_mode';

require('ui/courier');

var app = require('ui/modules').get('app/wazuh', [])
  .directive('kbnVis', [function () {
    return {
      restrict: 'E',
      scope: {
        visType: '@visType',
        visIndexPattern: '@visIndexPattern',
        visA: '@visA',
        visG: '@visG',
        visFilter: '@visFilter',
        visHeight: '@visHeight',
        visSearchable: '@visSearchable'
      },
      template: require('../templates/vis-template.html')
    }
  }]);

require('ui/modules').get('app/wazuh', [])
  .controller('VisEditorW', function ($scope, $route, timefilter, AppState, $location, kbnUrl, $timeout, courier, Private, Promise, savedVisualizations) {
    $scope.v = {};
    $scope.v.filter = $scope.visFilter;
    $scope.chrome = {};
    $scope.chrome.getVisible = function () {
      return true;
    }

    var _savedVis = function () {

      const visTypes = Private(RegistryVisTypesProvider);
      const visType = _.find(visTypes, { name: $scope.visType });

      if (!visType) {
        throw new Error('You must provide a valid visualization type');
      }

      if (visType.requiresSearch && !$scope.visIndexPattern) {
        throw new Error('You must provide either an indexPattern');
      }

      return savedVisualizations.get({ 'type': $scope.visType, 'indexPattern': $scope.visIndexPattern, '_g': $scope.visG, '_a': $scope.visA })
        .catch(courier.redirectWhenMissing({
          '*': '/'
        }));
    }

    _savedVis().then(function (_sVis) {
      $scope._loadVisAsync = true;

      const savedVis = _sVis;

      const vis = savedVis.vis;
      const editableVis = vis.createEditableVis();
      vis.requesting = function () {
        const requesting = editableVis.requesting;
        requesting.call(vis);
        requesting.call(editableVis);
      };

      const searchSource = savedVis.searchSource;

      $scope.topNavMenu = [{
        key: 'refresh',
        description: 'Refresh',
        run: function () { $scope.fetch(); }
      }];

      if (savedVis.id) {
        docTitle.change(savedVis.title);
      }

      let $state = $scope.$state = (function initState() {
        const stateDefaults = {
          uiState: {},
          linked: false,
          query: $scope.visFilter ? $scope.visFilter : { query_string: { analyze_wildcard: '!t', query: '*' } },
          filters: [],
          vis: {}
        };

        $state = new AppState(stateDefaults);

        return $state;
      } ());

      function init() {
        // export some objects
        $scope.savedVis = savedVis;

        $scope.searchSource = searchSource;
        $scope.vis = vis;

        $scope.indexPattern = vis.indexPattern;
        $scope.editableVis = editableVis;
        $scope.state = $state;

        $scope.uiState = $state.makeStateful('uiState');

        vis.setUiState($scope.uiState);

        $scope.timefilter = timefilter;
        $scope.opts = _.pick($scope, 'doSave', 'savedVis', 'shareData', 'timefilter');

        const filterBarClickHandler = Private(FilterBarFilterBarClickHandlerProvider);
        editableVis.listeners.click = vis.listeners.click = filterBarClickHandler($state);
        const brushEvent = Private(UtilsBrushEventProvider);
        editableVis.listeners.brush = vis.listeners.brush = brushEvent;

        // track state of editable vis vs. "actual" vis
        $scope.stageEditableVis = transferVisState(editableVis, vis, true);
        $scope.resetEditableVis = transferVisState(vis, editableVis);

        $scope.$watch('searchSource.get("index").timeFieldName', function (timeField) {
          timefilter.enabled = !!timeField;
        });

        // update the searchSource when filters update
        const queryFilter = Private(FilterBarQueryFilterProvider);
        $scope.$listen(queryFilter, 'update', function () {
          searchSource.set('filter', queryFilter.getFilters());
          $state.save();
        });

        // fetch data when filters fire fetch event
        $scope.$listen(queryFilter, 'fetch', $scope.fetch);


        $scope.$listen($state, 'fetch_with_changes', function (keys) {

          let $state = $scope.$state = (function initState() {
            $route.current.params._a = $scope.visA;
            $route.updateParams({ '_a': $scope.visA });
            $route.current.params._g = $scope.visG;
            $route.updateParams({ '_g': $scope.visG });
            const stateDefaults = {
              uiState: {},
              linked: false,
              query: $scope.visFilter ? $scope.visFilter : { query_string: { analyze_wildcard: '!t', query: '*' } },
              filters: [],
              vis: {}
            };
            $state = new AppState(stateDefaults);

            return $state;
          } ());

          $scope.state = $state;

          if (_.contains(keys, 'linked') && $state.linked === true) {
            return;
          }

          $state.vis.listeners = _.defaults($state.vis.listeners || {}, vis.listeners);

          vis.setState($state.vis);
          editableVis.setState($state.vis);

          // we use state to track query, must write before we fetch
          if ($scope.v.filter && !$state.linked) {
            searchSource.set('query', $scope.v.filter);
          } else {
            searchSource.set('query', null);
          }

          if (_.isEqual(keys, ['filters'])) {
            // updates will happen in filter watcher if needed
            return;
          }

          $scope.fetch();
        });

        $scope.$listen(timefilter, 'fetch', _.bindKey($scope, 'fetch'));

        $scope.$on('ready:vis', function () {
          $scope.$emit('application.load');
          $state.emit('fetch_with_changes');
        });

        $scope.$on('$destroy', function () {
          savedVis.destroy();
        });
      }

      $scope.fetch = function () {
        const queryFilter = Private(FilterBarQueryFilterProvider);
        searchSource.set('filter', queryFilter.getFilters());
        if (!$state.linked) searchSource.set('query', $scope.v.filter);
        if ($scope.vis.type.requiresSearch) {
          courier.fetch();
        }
      };

      $scope.startOver = function () {
        //Nothing
      };

      $scope.doSave = function () {
        savedVis.id = savedVis.title;
        // vis.title was not bound and it's needed to reflect title into visState
        $state.vis.title = savedVis.title;
        savedVis.visState = $state.vis;
        savedVis.uiStateJSON = angular.toJson($scope.uiState.getChanges());

        savedVis.save()
          .then(function (id) {
            $scope.kbnTopNav.close('save');

            if (id) {
              notify.info('Saved Visualization "' + savedVis.title + '"');
              if (savedVis.id === $route.current.params.id) return;
            }
          }, notify.fatal);
      };

      $scope.unlink = function () {
        if (!$state.linked) return;

        $state.linked = false;
        const parent = searchSource.getParent(true);
        const parentsParent = parent.getParent(true);

        // display unlinking for 2 seconds, unless it is double clicked
        $scope.unlinking = $timeout($scope.clearUnlinking, 2000);

        delete savedVis.savedSearchId;
        parent.set('filter', _.union(searchSource.getOwn('filter'), parent.getOwn('filter')));

        // copy over all state except "aggs" and filter, which is already copied
        _(parent.toJSON())
          .omit('aggs')
          .forOwn(function (val, key) {
            searchSource.set(key, val);
          })
          .commit();

        $scope.query = searchSource.get('query');
        $state.filters = searchSource.get('filter');
        searchSource.inherits(parentsParent);
      };

      $scope.clearUnlinking = function () {
        if ($scope.unlinking) {
          $timeout.cancel($scope.unlinking);
          $scope.unlinking = null;
        }
      };

      function transferVisState(fromVis, toVis, stage) {
        return function () {
          const view = fromVis.getEnabledState();
          const full = fromVis.getState();
          toVis.setState(view);
          editableVis.dirty = false;
          $state.vis = full;
          $state.save();

          if (stage) $scope.fetch();
        };
      }
      init();

    });

  });
