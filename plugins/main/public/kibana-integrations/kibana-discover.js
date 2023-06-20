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

import store from '../redux/store';
import { updateVis } from '../redux/actions/visualizationsActions';
import { getAngularModule, getCore, getDiscoverModule, getPlugins, getToasts } from '../kibana-services';
import {
  getRequestInspectorStats,
  getResponseInspectorStats,
  getServices,
  setServices,
  setDocViewsRegistry,
  subscribeWithScope,
  tabifyAggResponse,
  getHeaderActionMenuMounter,
  setUiActions
} from './discover/kibana_services';

import indexTemplateLegacy from './discover/application/angular/discover_legacy.html';

getAngularModule().directive('kbnDis', [
  function () {
    return {
      restrict: 'E',
      scope: {},
      template: indexTemplateLegacy
    };
  }
]);

// Added dependencies (from plugin platform module)
import './discover_dependencies';
//import 'ui/directives/render_directive';
import './discover/application/angular/directives';
import { DocViewsRegistry } from './discover/application/doc_views/doc_views_registry';
import { DocViewTable } from './discover/application/components/table/table';
import { JsonCodeBlock } from './discover/application/components/json_code_block/json_code_block';
import _ from 'lodash';

import { Subscription, Subject, merge } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import moment from 'moment';
import dateMath from '@elastic/datemath';
import { i18n } from '@kbn/i18n';
import { getState, splitState } from './discover/application/angular/discover_state';

import { RequestAdapter } from '../../../../src/plugins/inspector/public';
import { getSortArray, getSortForSearchSource } from './discover/application/angular/doc_table';
import * as columnActions from './discover/application/angular/doc_table/actions/columns';

import { discoverResponseHandler } from './discover/application/angular/response_handler';

///WAZUH///
import { buildServices } from './discover/build_services';
import { WazuhConfig } from '../react-services/wazuh-config';
import { ModulesHelper } from '../components/common/modules/modules-helper';
///////////
import { validateTimeRange } from './discover/application/helpers/validate_time_range';
import {
  fieldFormats,
  esFilters,
  indexPatterns as indexPatternsUtils,
  connectToQueryState,
  syncQueryStateWithUrl,
  getDefaultQuery,
  search,
  UI_SETTINGS,
} from '../../../../src/plugins/data/public';
import { addFatalError } from '../../../../src/plugins/kibana_legacy/public';
import {
  DEFAULT_COLUMNS_SETTING,
  SAMPLE_SIZE_SETTING,
  SORT_DEFAULT_ORDER_SETTING,
  SEARCH_ON_PAGE_LOAD_SETTING,
  DOC_HIDE_TIME_COLUMN_SETTING,
} from './discover/common';
import { AppState } from '../react-services/app-state';
import { createFixedScroll } from './discover/application/angular/directives/fixed_scroll';

import './discover/application/index.scss';
import { getFilterWithAuthorizedAgents } from '../react-services/filter-authorization-agents';
import { getSettingDefaultValue } from '../../common/services/settings';

const fetchStatuses = {
  UNINITIALIZED: 'uninitialized',
  LOADING: 'loading',
  COMPLETE: 'complete',
  NO_RESULTS: 'none'
};

const appDiscover = getDiscoverModule();

appDiscover.run(async () => {
  const services = await buildServices(
    getCore(),
    getPlugins(),
    { env: { packageInfo: { branch: "7.10" } } },
    () => getAngularModule().$injector
  );
  setServices(services);
  setUiActions(getPlugins().uiActions);
});

const wazuhApp = getAngularModule();

appDiscover.directive('discoverApp', function () {
  return {
    restrict: 'E',
    controllerAs: 'discoverApp',
    controller: discoverController,
  };
});

function discoverController(
  $element,
  $route,
  $scope,
  $timeout,
  $window,
  Promise,
  localStorage,
  uiCapabilities,
  // Wazuh requirements from here
  $rootScope,
  $location,
  loadedVisualizations,
  discoverPendingUpdates
) {
  const { isDefault: isDefaultType } = indexPatternsUtils;
  const subscriptions = new Subscription();
  const $fetchObservable = new Subject();
  let inspectorRequest;
  const savedSearch = $route.current.locals.savedSearch;
  $scope.searchSource = savedSearch.searchSource;
  $scope.indexPattern = resolveIndexPatternLoading();
  //used for functional testing
  $scope.fetchCounter = 0;

  //WAZUH
  wazuhApp.discoverScope = $scope;
  if (!wazuhApp.globalFilters) {
    wazuhApp.globalFilters = {};
  }

  (async () => {
     const services = await buildServices(
      getCore(),
      getPlugins(),
      { env: { packageInfo: { branch: "7.10" } } },
      () => getAngularModule().$injector
    );
    this.docViewsRegistry = new DocViewsRegistry();
    setDocViewsRegistry(this.docViewsRegistry);
    this.docViewsRegistry.addDocView({
      title: i18n.translate('discover.docViews.table.tableTitle', {
        defaultMessage: 'Table',
      }),
      order: 10,
      component: DocViewTable,
    });
    this.docViewsRegistry.addDocView({
      title: i18n.translate('discover.docViews.json.jsonTitle', {
        defaultMessage: 'JSON',
      }),
      order: 20,
      component: JsonCodeBlock,
    });
    setServices(services);
  })();

  const {
    core,
    chrome,
    data,
    filterManager,
    timefilter,
    toastNotifications,
    history: getHistory,
    uiSettings: config,
    visualizations
  } = getServices();

  const wazuhConfig = new WazuhConfig();
  const modulesHelper = ModulesHelper;

  const getTimeField = () => {
    return isDefaultType($scope.indexPattern) ? $scope.indexPattern.timeFieldName : undefined;
  };

  const history = getHistory();

  const {
    appStateContainer,
    startSync: startStateSync,
    stopSync: stopStateSync,
    setAppState,
    replaceUrlAppState,
    kbnUrlStateStorage,
    getPreviousAppState,
  } = getState({
    defaultAppState: getStateDefaults(),
    storeInSessionStorage: config.get('state:storeInSessionStorage'),
    history,
  });
  if (appStateContainer.getState().index !== $scope.indexPattern.id) {
    //used index pattern is different than the given by url/state which is invalid
    setAppState({ index: $scope.indexPattern.id });
  }
  $scope.state = { ...appStateContainer.getState() };

  // syncs `_g` portion of url with query services
  const { stop: stopSyncingGlobalStateWithUrl } = syncQueryStateWithUrl(
    data.query,
    kbnUrlStateStorage
  );

  // sync initial app filters from state to filterManager
  filterManager.setAppFilters(_.cloneDeep(appStateContainer.getState().filters));
  data.query.queryString.setQuery(appStateContainer.getState().query);

  const stopSyncingQueryAppStateWithStateContainer = connectToQueryState(
    data.query,
    appStateContainer,
    {
      filters: esFilters.FilterStateStore.APP_STATE,
      query: true,
    }
  );

  const appStateUnsubscribe = appStateContainer.subscribe(async (newState) => {
    const { state: newStatePartial } = splitState(newState);
    const { state: oldStatePartial } = splitState(getPreviousAppState());

    if (!_.isEqual(newStatePartial, oldStatePartial)) {
      $scope.$evalAsync(async () => {
        if (oldStatePartial.index !== newStatePartial.index) {
          //in case of index switch the route has currently to be reloaded, legacy
          return;
        }

        $scope.state = { ...newState };

        // detect changes that should trigger fetching of new data
        const changes = ['interval', 'sort', 'query'].filter(
          (prop) => !_.isEqual(newStatePartial[prop], oldStatePartial[prop])
        );

        if (changes.length) {
          $fetchObservable.next();
        }
      });
    }
  });

  // this listener is waiting for such a path http://localhost:5601/app/discover#/
  // which could be set through pressing "New" button in top nav or go to "Discover" plugin from the sidebar
  // to reload the page in a right way
  const unlistenHistoryBasePath = history.listen(({ pathname, search, hash }) => {
    if (!search && !hash && pathname === '/') {
      $route.reload();
    }
  });

  $scope.setIndexPattern = async (id) => {
    const nextIndexPattern = await indexPatterns.get(id);
    if (nextIndexPattern) {
      const nextAppState = getSwitchIndexPatternAppState(
        $scope.indexPattern,
        nextIndexPattern,
        $scope.state.columns,
        $scope.state.sort,
        config.get(MODIFY_COLUMNS_ON_SWITCH)
      );
      await replaceUrlAppState(nextAppState);
      $route.reload();
    }
  };

  // update data source when filters update
  subscriptions.add(
    subscribeWithScope(
      $scope,
      filterManager.getUpdates$(),
      {
        next: () => {
          //Patch empty fields
          const filters = filterManager.getAppFilters();
          if(filters.filter(item=> item.meta.params && item.meta.params.query === '').length){
            getToasts().add({
              color: 'warning',
              title: 'Invalid field value',
              text: 'The filter field contains invalid value',
              toastLifeTimeMs: 10000,
            });
            filterManager.setFilters(filters.filter(item=>item.meta.params.query));
          }
          //end of patch empty fields
          $scope.state.filters = filters;
          $scope.updateDataSource();
        },
      },
      (error) => addFatalError(core.fatalErrors, error)
    )
  );

  const inspectorAdapters = {
    requests: new RequestAdapter(),
  };

  $scope.timefilterUpdateHandler = (ranges) => {
    timefilter.setTime({
      from: moment(ranges.from).toISOString(),
      to: moment(ranges.to).toISOString(),
      mode: 'absolute',
    });
  };
  $scope.intervalOptions = search.aggs.intervalOptions;
  $scope.minimumVisibleRows = 50;
  $scope.fetchStatus = fetchStatuses.UNINITIALIZED;
  $scope.showSaveQuery = uiCapabilities.discover.saveQuery;

  $scope.$watch(
    () => uiCapabilities.discover.saveQuery,
    (newCapability) => {
      $scope.showSaveQuery = newCapability;
    }
  );

  let abortController;
  $scope.$on('$destroy', () => {
    if (abortController) abortController.abort();
    savedSearch.destroy();
    subscriptions.unsubscribe();
    appStateUnsubscribe();
    stopStateSync();
    stopSyncingGlobalStateWithUrl();
    stopSyncingQueryAppStateWithStateContainer();
    //WAZUH
    //unlistenHistoryBasePath();
    if (tabListener) tabListener();
    delete wazuhApp.discoverScope;
  });

  // WAZUH MODIFIED
  $scope.topNavMenu = [];

  $scope.searchSource
    .setField('index', $scope.indexPattern)
    .setField('highlightAll', true)
    .setField('version', true);

  // Even when searching rollups, we want to use the default strategy so that we get back a
  // document-like response.
  $scope.searchSource.setPreferredSearchStrategyId('default');

  // searchSource which applies time range
  const timeRangeSearchSource = savedSearch.searchSource.create();

  if (isDefaultType($scope.indexPattern)) {
    timeRangeSearchSource.setField('filter', () => {
      return timefilter.createFilter($scope.indexPattern);
    });
  }

  $scope.searchSource.setParent(timeRangeSearchSource);

  const pageTitleSuffix = savedSearch.id && savedSearch.title ? `: ${savedSearch.title}` : '';
  chrome.docTitle.change(`Wazuh${pageTitleSuffix}`);
  const discoverBreadcrumbsTitle = i18n.translate('discover.discoverBreadcrumbTitle', {
    defaultMessage: 'Wazuh',
  });

  if (savedSearch.id && savedSearch.title) {
    chrome.setBreadcrumbs([
      {
        text: discoverBreadcrumbsTitle,
        href: '#/',
      },
      { text: savedSearch.title },
    ]);
  } else {
    chrome.setBreadcrumbs([
      {
        text: discoverBreadcrumbsTitle,
      },
    ]);
  }

  $scope.screenTitle = savedSearch.title;

  const getFieldCounts = async () => {
    // the field counts aren't set until we have the data back,
    // so we wait for the fetch to be done before proceeding
    if ($scope.fetchStatus === fetchStatuses.COMPLETE) {
      return $scope.fieldCounts;
    }

    return await new Promise((resolve) => {
      const unwatch = $scope.$watch('fetchStatus', (newValue) => {
        if (newValue === fetchStatuses.COMPLETE) {
          unwatch();
          resolve($scope.fieldCounts);
        }
      });
    });
  };

  const getSharingDataFields = async (selectedFields, timeFieldName, hideTimeColumn) => {
    if (selectedFields.length === 1 && selectedFields[0] === '_source') {
      const fieldCounts = await getFieldCounts();
      return {
        searchFields: null,
        selectFields: _.keys(fieldCounts).sort(),
      };
    }

    const fields =
      timeFieldName && !hideTimeColumn ? [timeFieldName, ...selectedFields] : selectedFields;
    return {
      searchFields: fields,
      selectFields: fields,
    };
  };

  this.getSharingData = async () => {
    const searchSource = $scope.searchSource.createCopy();

    const { searchFields, selectFields } = await getSharingDataFields(
      $scope.state.columns,
      $scope.indexPattern.timeFieldName,
      config.get(DOC_HIDE_TIME_COLUMN_SETTING)
    );
    searchSource.setField('fields', searchFields);
    searchSource.setField(
      'sort',
      getSortForSearchSource(
        $scope.state.sort,
        $scope.indexPattern,
        config.get(SORT_DEFAULT_ORDER_SETTING)
      )
    );
    searchSource.setField('highlight', null);
    searchSource.setField('highlightAll', null);
    searchSource.setField('aggs', null);
    searchSource.setField('size', null);

    const body = await searchSource.getSearchRequestBody();
    return {
      searchRequest: {
        index: searchSource.getField('index').title,
        body,
      },
      fields: selectFields,
      metaFields: $scope.indexPattern.metaFields,
      conflictedTypesFields: $scope.indexPattern.fields
        .filter((f) => f.type === 'conflict')
        .map((f) => f.name),
      indexPatternId: searchSource.getField('index').id,
    };
  };

  function getStateDefaults() {
    const query = $scope.searchSource.getField('query') || data.query.queryString.getDefaultQuery();
    return {
      query,
      sort: getSortArray(savedSearch.sort, $scope.indexPattern),
      columns:
        savedSearch.columns.length > 0
          ? savedSearch.columns
          : config.get(DEFAULT_COLUMNS_SETTING).slice(),
      index: $scope.indexPattern.id,
      interval: 'auto',
      filters: _.cloneDeep($scope.searchSource.getOwnField('filter')),
    };
  }

  $scope.state.index = $scope.indexPattern.id;
  $scope.state.sort = getSortArray($scope.state.sort, $scope.indexPattern);

  $scope.opts = {
    // number of records to fetch, then paginate through
    sampleSize: config.get(SAMPLE_SIZE_SETTING),
    timefield: getTimeField(),
    savedSearch: savedSearch,
    indexPatternList: $route.current.locals.ip.list,
    config: config,
    fixedScroll: $scope.tabView === 'discover'? createFixedScroll($scope, $timeout) : () => {},
    setHeaderActionMenu: () => {} //getHeaderActionMenuMounter(),
  };

  const shouldSearchOnPageLoad = () => {
    // A saved search is created on every page load, so we check the ID to see if we're loading a
    // previously saved search or if it is just transient
    return (
      config.get(SEARCH_ON_PAGE_LOAD_SETTING) ||
      savedSearch.id !== undefined ||
      timefilter.getRefreshInterval().pause === false
    );
  };

  const init = _.once(() => {
    $scope.updateDataSource().then(async () => {
      const searchBarChanges = merge(
        timefilter.getAutoRefreshFetch$(),
        timefilter.getFetch$(),
        filterManager.getFetches$(),
        $fetchObservable
      ).pipe(debounceTime(100));

      subscriptions.add(
        subscribeWithScope(
          $scope,
          searchBarChanges,
          {
            next: () => {
              const customFilterAllowedAgents = getFilterWithAuthorizedAgents(store.getState().appStateReducers.allowedAgents);
              filterManager.filters = customFilterAllowedAgents ? _.union(filterManager.filters, [customFilterAllowedAgents]) : filterManager.filters;
              $scope.filters = filterManager.filters;

              // Wazuh. Hides the alerts of the '000' agent if it is in the configuration
              const buildFilters = () => {
                const { hideManagerAlerts } = wazuhConfig.getConfig();
                if (hideManagerAlerts) {
                  return [
                    {
                      meta: {
                        alias: null,
                        disabled: false,
                        key: 'agent.id',
                        negate: true,
                        params: { query: '000' },
                        type: 'phrase',
                        index: AppState.getCurrentPattern() || getSettingDefaultValue('pattern')
                      },
                      query: { match_phrase: { 'agent.id': '000' } },
                      $state: { store: 'appState' }
                    }
                  ];
                }
                return [];
              };
              ///////////////////////////////  WAZUH   ///////////////////////////////////
              if (wazuhApp.globalFilters && wazuhApp.globalFilters.tab === $location.search().tab) {
                wazuhApp.globalFilters = {
                  tab: $location.search().tab,
                  filters: (filterManager.filters || []).filter(x => x.$state.store === "globalState")
                };
              }
              $scope.updateDataSource().then(function () {
                ///////////////////////////////  WAZUH   ///////////////////////////////////
                if (!filtersAreReady()) return;
                discoverPendingUpdates.removeAll();
                discoverPendingUpdates.addItem($scope.state.query, [
                  ...$scope.filters,
                  ...buildFilters() // Hide '000' agent
                ]);
                if ($location.search().tab != 'configuration') {
                  loadedVisualizations.removeAll();
                }
                $scope.fetch();
                ////////////////////////////////////////////////////////////////////////////
                //$scope.state.save();
                // Forcing a digest cycle
                $rootScope.$applyAsync();
              });
            }
          },
          error => addFatalError(core.fatalErrors, error)
        )
      );
      subscriptions.add(
        subscribeWithScope(
          $scope,
          timefilter.getTimeUpdate$(),
          {
            next: () => {
              $scope.updateTime();
            },
          },
          (error) => addFatalError(core.fatalErrors, error)
        )
      );

      $scope.changeInterval = (interval) => {
        if (interval) {
          setAppState({ interval });
        }
      };

      $scope.$watchMulti(
        ['rows', 'fetchStatus'],
        (function updateResultState() {
          let prev = {};
          const status = {
            UNINITIALIZED: 'uninitialized',
            LOADING: 'loading', // initial data load
            READY: 'ready', // results came back
            NO_RESULTS: 'none', // no results came back
          };

          function pick(rows, oldRows, fetchStatus) {
            // initial state, pretend we're already loading if we're about to execute a search so
            // that the uninitilized message doesn't flash on screen
            if (rows == null && oldRows == null && shouldSearchOnPageLoad()) {
              return status.LOADING;
            }

            if (fetchStatus === fetchStatuses.UNINITIALIZED) {
              return status.UNINITIALIZED;
            }

            const rowsEmpty = _.isEmpty(rows);
            if (rowsEmpty && fetchStatus === fetchStatuses.LOADING) return status.LOADING;
            else if (!rowsEmpty) return status.READY;
            else {
              // Wazuh. If there are hits but no rows, the it's also a READY status
              return $scope.hits ? status.READY : status.NO_RESULTS;
            }
          }

          return function () {
            const current = {
              rows: $scope.rows,
              fetchStatus: $scope.fetchStatus,
            };

            $scope.resultState = pick(
              current.rows,
              prev.rows,
              current.fetchStatus,
              prev.fetchStatus
            );
            // Copying it to the rootScope to access it from the Wazuh App //
            $rootScope.resultState = $scope.resultState;
            /////////////////////////////////////////////////////////////////

            prev = current;
          };
        })()
      );

      if (getTimeField()) {
        setupVisualization();
        $scope.updateTime();
      }

      init.complete = true;
      if (shouldSearchOnPageLoad()) {
        $fetchObservable.next();
      }
    });
  });

  ////////////////////////////////////////////////////////////////////////
  // Wazuh - Removed saveDataSource, it's not needed by our integration //
  ////////////////////////////////////////////////////////////////////////

  $scope.opts.fetch = $scope.fetch = function () {
    // ignore requests to fetch before the app inits
    if (!init.complete) return;
    $scope.fetchCounter++;
    $scope.fetchError = undefined;
    $scope.minimumVisibleRows = 50;
    if (!validateTimeRange(timefilter.getTime(), toastNotifications)) {
      $scope.resultState = 'none';
      return;
    }

    // Abort any in-progress requests before fetching again
    if (abortController) abortController.abort();
    abortController = new AbortController();

    $scope
      .updateDataSource()
      .then(setupVisualization)
      .then(function () {
        $scope.fetchStatus = fetchStatuses.LOADING;
        logInspectorRequest();
        return $scope.searchSource.fetch({
          abortSignal: abortController.signal,
        });
      })
      .then(onResults)
      .catch((error) => {
        // If the request was aborted then no need to surface this error in the UI
        if (error instanceof Error && error.name === 'AbortError') return;

        $scope.fetchStatus = fetchStatuses.NO_RESULTS;
        $scope.rows = [];
        data.search.showError(error);
      });
  };

  $scope.handleRefresh = function ({ query }, isUpdate = true) {
    // Wazuh filters are not ready yet
    if (!filtersAreReady()) return;
    if (!_.isEqual(query, appStateContainer.getState().query) || isUpdate === false) {
       /// Wazuh 7.7.x
       let q = { ...query };
       if (query && typeof query === 'object') {
         q.timestamp = new Date().getTime().toString();
       }
       ///
       setAppState({ query: q });
      // WAZUH query from search bar
      discoverPendingUpdates.removeAll();
      discoverPendingUpdates.addItem($scope.state.query, filterManager.filters);
      $scope.fetch();
      /////
      $fetchObservable.next();
    }
  };

  $scope.updateSavedQueryId = (newSavedQueryId) => {
    if (newSavedQueryId) {
      setAppState({ savedQuery: newSavedQueryId });
    } else {
      // remove savedQueryId from state
      const state = {
        ...appStateContainer.getState(),
      };
      delete state.savedQuery;
      appStateContainer.set(state);
    }
  };

  function getDimensions(aggs, timeRange) {
    const [metric, agg] = aggs;
    agg.params.timeRange = timeRange;
    const bounds = agg.params.timeRange ? timefilter.calculateBounds(agg.params.timeRange) : null;
    agg.buckets.setBounds(bounds);

    const { esUnit, esValue } = agg.buckets.getInterval();
    return {
      x: {
        accessor: 0,
        label: agg.makeLabel(),
        format: agg.toSerializedFieldFormat(),
        params: {
          date: true,
          interval: moment.duration(esValue, esUnit),
          intervalESValue: esValue,
          intervalESUnit: esUnit,
          format: agg.buckets.getScaledDateFormat(),
          bounds: agg.buckets.getBounds(),
        },
      },
      y: {
        accessor: 1,
        format: metric.toSerializedFieldFormat(),
        label: metric.makeLabel(),
      },
    };
  }

  function onResults(resp) {
    inspectorRequest.stats(getResponseInspectorStats(resp, $scope.searchSource)).ok({ json: resp });

    if (getTimeField()) {
      const tabifiedData = tabifyAggResponse($scope.vis.data.aggs, resp);
      $scope.searchSource.rawResponse = resp;
      $scope.histogramData = discoverResponseHandler(
        tabifiedData,
        getDimensions($scope.vis.data.aggs.aggs, $scope.timeRange)
      );
      if ($scope.vis.data.aggs.aggs[1]) {
        $scope.bucketInterval = $scope.vis.data.aggs.aggs[1].buckets.getInterval();
      }
      $scope.updateTime();
    }

    $scope.hits = resp.hits.total;
    $scope.rows = resp.hits.hits;

    // Ensure we have "hits" and "rows" available as soon as possible
    $scope.$applyAsync();
    // if we haven't counted yet, reset the counts
    const counts = ($scope.fieldCounts = $scope.fieldCounts || {});

    $scope.rows.forEach((hit) => {
      const fields = Object.keys($scope.indexPattern.flattenHit(hit));
      fields.forEach((fieldName) => {
        counts[fieldName] = (counts[fieldName] || 0) + 1;
      });
    });
    $scope.fetchStatus = fetchStatuses.COMPLETE;
  }

  async function logInspectorRequest() {
    inspectorAdapters.requests.reset();
    const title = i18n.translate('discover.inspectorRequestDataTitle', {
      defaultMessage: 'data',
    });
    const description = i18n.translate('discover.inspectorRequestDescription', {
      defaultMessage: 'This request queries Elasticsearch to fetch the data for the search.',
    });
    inspectorRequest = inspectorAdapters.requests.start(title, { description });
    inspectorRequest.stats(getRequestInspectorStats($scope.searchSource));
    const body = await $scope.searchSource.getSearchRequestBody();
    inspectorRequest.json(body);
  }

  $scope.updateTime = function () {
    ///////////////////////////////  WAZUH   ///////////////////////////////////
    if ($location.search().tab != 'configuration') {
      loadedVisualizations.removeAll();
      $rootScope.$broadcast('updateVis');
      store.dispatch(updateVis({ update: true }));
      // Forcing a digest cycle
      $rootScope.$applyAsync();
    }
    ////////////////////////////////////////////////////////////////////////////
    const { from, to } = timefilter.getTime();
    // this is the timerange for the histogram, should be refactored
    $scope.timeRange = {
      from: dateMath.parse(from),
      to: dateMath.parse(to, { roundUp: true }),
    };
  };

  $scope.toMoment = function (datetime) {
    if (!datetime) {
      return;
    }
    return moment(datetime).format(config.get('dateFormat'));
  };

  $scope.resetQuery = function () {
    /*     history.push(
          $route.current.params.id ? `/view/${encodeURIComponent($route.current.params.id)}` : '/'
        ); */
    $route.reload();
  };

  $scope.onSkipBottomButtonClick = function () {
    // show all the Rows
    $scope.minimumVisibleRows = $scope.hits;

    // delay scrolling to after the rows have been rendered
    const bottomMarker = $element.find('#discoverBottomMarker');
    $timeout(() => {
      bottomMarker.focus();
      // The anchor tag is not technically empty (it's a hack to make Safari scroll)
      // so the browser will show a highlight: remove the focus once scrolled
      $timeout(() => {
        bottomMarker.blur();
      }, 0);
    }, 0);
  };

  $scope.newQuery = function () {
    //history.push('/');
  };

  // Wazuh.
  // defaultSearchSource -> Use it for Discover tabs and the Discover visualization.
  // noHitsSearchSource  -> It doesn't fetch the "hits" array and it doesn't fetch the "_source",
  //                        use it for panels.
  let defaultSearchSource = null,
    noHitsSearchSource = null;
  $scope.updateDataSource = () => {
    const { indexPattern, searchSource } = $scope;
    // Wazuh
    const isPanels = $scope.tabView === 'panels';
    const isClusterMonitoring = $scope.tabView === 'cluster-monitoring';

    // Wazuh. Should we fetch "_source" and "hits" ?
    const noHits = isPanels || isClusterMonitoring;

    // Wazuh. The very first time, the copies are null, just create them
    if (!defaultSearchSource || !noHitsSearchSource) {
      defaultSearchSource = $scope.searchSource.createCopy();
      noHitsSearchSource = $scope.searchSource.createCopy();
      noHitsSearchSource.setField('source', false);
    }

    // Wazuh. Select the proper searchSource depending on the view
    $scope.searchSource = noHits ? noHitsSearchSource : defaultSearchSource;

    // Wazuh. Set the size to 0 depending on the selected searchSource
    const size = noHits ? 0 : $scope.opts.sampleSize;
    searchSource
      .setField('index', $scope.indexPattern)
      .setField('size', size) // Wazuh. Use custom size
      .setField(
        'sort',
        getSortForSearchSource(
          $scope.state.sort,
          indexPattern,
          config.get(SORT_DEFAULT_ORDER_SETTING)
        )
      )
      .setField('query', data.query.queryString.getQuery() || null)
      .setField('filter', filterManager.getFilters());
    //Wazuh update the visualizations
    $rootScope.$broadcast('updateVis');
    store.dispatch(updateVis({ update: true }));
    return Promise.resolve();
  };

  $scope.setSortOrder = function setSortOrder(sort) {
    setAppState({ sort });
  };

  // TODO: On array fields, negating does not negate the combination, rather all terms
  $scope.filterQuery = function (field, values, operation) {
    // Commented due to https://github.com/elastic/kibana/issues/22426
    //$scope.indexPattern.popularizeField(field, 1);
    const newFilters = esFilters.generateFilters(
      filterManager,
      field,
      values,
      operation,
      $scope.indexPattern.id
    );
    return filterManager.addFilters(newFilters);
  };

  $scope.addColumn = function addColumn(columnName) {
    // Commented due to https://github.com/elastic/kibana/issues/22426
    /*     if (uiCapabilities.discover.save) {
        $scope.indexPattern.popularizeField(columnName, 1);
        } */
    const columns = columnActions.addColumn($scope.state.columns, columnName);
    setAppState({ columns });
  };

  $scope.removeColumn = function removeColumn(columnName) {
    // Commented due to https://github.com/elastic/kibana/issues/22426
    /*     if (uiCapabilities.discover.save) {
          $scope.indexPattern.popularizeField(columnName, 1);
        } */
    const columns = columnActions.removeColumn($scope.state.columns, columnName);
    // The state's sort property is an array of [sortByColumn,sortDirection]
    const sort = $scope.state.sort.length
      ? $scope.state.sort.filter((subArr) => subArr[0] !== columnName)
      : [];
    setAppState({ columns, sort });
  };

  $scope.moveColumn = function moveColumn(columnName, newIndex) {
    const columns = columnActions.moveColumn($scope.state.columns, columnName, newIndex);
    setAppState({ columns });
  };

  $scope.scrollToTop = function () {
    $window.scrollTo(0, 0);
  };

  async function setupVisualization() {
    // Wazuh. Do not setup visualization if there isn't a copy for the default searchSource
    if (!defaultSearchSource) {
      return;
    }
    // If no timefield has been specified we don't create a histogram of messages
    if (!getTimeField()) return;
    const { interval: histogramInterval } = $scope.state;

    const visStateAggs = [
      {
        type: 'count',
        schema: 'metric',
      },
      {
        type: 'date_histogram',
        schema: 'segment',
        params: {
          field: getTimeField(),
          interval: histogramInterval,
          timeRange: timefilter.getTime(),
        },
      },
    ];

    $scope.vis = await visualizations.createVis('histogram', {
      title: savedSearch.title,
      params: {
        addLegend: false,
        addTimeMarker: true,
      },
      data: {
        aggs: visStateAggs,
        searchSource: $scope.searchSource.getSerializedFields(),
      },
    });

    $scope.searchSource.onRequestStart((searchSource, options) => {
      if (!$scope.vis) return;
      return $scope.vis.data.aggs.onSearchRequestStart(searchSource, options);
    });

    $scope.searchSource.setField('aggs', function () {
      if (!$scope.vis) return;
      return $scope.vis.data.aggs.toDsl();
    });
  }

  function getIndexPatternWarning(index) {
    return i18n.translate('discover.valueIsNotConfiguredIndexPatternIDWarningTitle', {
      defaultMessage: '{stateVal} is not a configured index pattern ID',
      values: {
        stateVal: `"${index}"`,
      },
    });
  }

  function resolveIndexPatternLoading() {
    const {
      loaded: loadedIndexPattern,
      stateVal,
      stateValFound,
    } = $route.current.locals.ip;

    const ownIndexPattern = $scope.searchSource.getOwnField('index');

    if (ownIndexPattern && !stateVal) {
      return ownIndexPattern;
    }

    if (stateVal && !stateValFound) {
      const warningTitle = getIndexPatternWarning();

      if (ownIndexPattern) {
        getToasts().addWarning({
          title: warningTitle,
          text: i18n.translate('discover.showingSavedIndexPatternWarningDescription', {
            defaultMessage:
              'Showing the saved index pattern: "{ownIndexPatternTitle}" ({ownIndexPatternId})',
            values: {
              ownIndexPatternTitle: ownIndexPattern.title,
              ownIndexPatternId: ownIndexPattern.id,
            },
          }),
        });
        return ownIndexPattern;
      }

      getToasts().addWarning({
        title: warningTitle,
        text: i18n.translate('discover.showingDefaultIndexPatternWarningDescription', {
          defaultMessage:
            'Showing the default index pattern: "{loadedIndexPatternTitle}" ({loadedIndexPatternId})',
          values: {
            loadedIndexPatternTitle: loadedIndexPattern.title,
            loadedIndexPatternId: loadedIndexPattern.id,
          },
        }),
      });
    }

    return loadedIndexPattern;
  }

  ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  ////////////////////////////////////////////////////// WAZUH //////////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  $scope.$watch('fetchStatus', () => {
    if ($scope.fetchStatus !== fetchStatuses.UNINITIALIZED) {
      setTimeout(() => {
        modulesHelper.hideCloseButtons();
      },  100);
    }
  });

  $scope.loadFilters = async (wzCurrentFilters, tab) => {
    filterManager.removeAll();
    const appState = appStateContainer.getState();
    if (!appState) {
      $timeout(100).then(() => {
        return loadFilters(wzCurrentFilters);
      });
    } else {
      wzCurrentFilters.forEach(x => {
        if (x.$state.isImplicit != false)
          x.$state.isImplicit = true
      });
      wazuhApp.globalFilters.tab = tab;
      const globalFilters = wazuhApp.globalFilters.filters || [];
      if (tab && $scope.tab !== tab) {
        filterManager.removeAll();
      }

      filterManager.addFilters([...wzCurrentFilters, ...(globalFilters || [])]);
      $scope.filters = filterManager.filters;
    }
  };

  $scope.tabView = $location.search().tabView || 'panels';
  $scope.showMain = $scope.tabView === 'discover';

  const tabListener = $rootScope.$on(
    'changeTabView',
    async (evt, parameters) => {
      $scope.resultState = 'loading';
      $scope.$applyAsync();
      $scope.tabView = parameters.tabView || 'panels';
      $scope.tab = parameters.tab;
      $scope.showMain = $scope.tabView === 'discover';

      evt.stopPropagation();
      if ($scope.tabView === 'discover') {
        $scope.rows = false;
        $scope.fetch();
      }
      $scope.handleRefresh({
        query: $scope.state.query
      }, false);
      $scope.$applyAsync();
    }
  );

  /**
   * Wazuh - aux function for checking filters status
   */
  const filtersAreReady = () => {
    const currentUrlPath = $location.path();
    if (currentUrlPath) {
      let filters = filterManager.filters;
      filters = Array.isArray(filters)
        ? filters.filter(item =>
          ['appState', 'globalState'].includes(
            ((item || {}).$state || {}).store || ''
          )
        )
        : [];
      if (!filters || !filters.length) return false;
    }
    return true;
  };
  ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  init();
  // Propagate current app state to url, then start syncing
  replaceUrlAppState().then(() => startStateSync());
}

