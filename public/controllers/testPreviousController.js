// Kibana dependencies
/*
import FilterBarQueryFilterProvider from 'ui/filter_bar/query_filter';
import FilterManagerProvider from 'ui/filter_manager';
import VisProvider from 'ui/vis';
import UtilsBrushEventProvider from 'ui/utils/brush_event';
import StateProvider from 'ui/state_management/state';
import SearchSourceProvider from 'ui/courier/data_source/search_source';
*/
import SearchSourceProvider from 'ui/courier/data_source/search_source';


require('plugins/kibana/discover/styles/main.less');
require('ui/doc_table/doc_table.js');
require('ui/styles/sidebar.less');
require('ui/styles/table.less');
require('ui/doc_viewer/doc_viewer.js');
require('ui/doc_title/doc_title.js');
require('ui/styles/truncate.less');
require('ui/style_compile/style_compile.js');
require('ui/registry/doc_views.js');
require('plugins/kbn_doc_views/kbn_doc_views.js');
require('ui/tooltip/tooltip.js');
import 'plugins/kibana/discover/components/field_chooser';
import _ from 'lodash';
import moment from 'moment';
import getSort from 'ui/doc_table/lib/get_sort';
import rison from 'rison-node';
import dateMath from '@elastic/datemath';
import 'ui/doc_table';
import 'ui/visualize';
import 'ui/notify';
import 'ui/fixed_scroll';
import 'ui/directives/validate_json';
import 'ui/filters/moment';
import 'ui/courier';
import 'ui/index_patterns';
import 'ui/state_management/app_state';
import 'ui/timefilter';
import 'ui/highlight/highlight_tags';
import 'ui/share';
import VisProvider from 'ui/vis';
import DocTitleProvider from 'ui/doc_title';
import UtilsBrushEventProvider from 'ui/utils/brush_event';
import PluginsKibanaDiscoverHitSortFnProvider from 'plugins/kibana/discover/_hit_sort_fn';
import FilterBarQueryFilterProvider from 'ui/filter_bar/query_filter';
import FilterManagerProvider from 'ui/filter_manager';
import AggTypesBucketsIntervalOptionsProvider from 'ui/agg_types/buckets/_interval_options';
import uiRoutes from 'ui/routes';
import uiModules from 'ui/modules';
import indexTemplate from 'plugins/wazuh/templates/directives/dis-template.html';
import StateProvider from 'ui/state_management/state';


import 'plugins/kibana/discover/saved_searches/saved_searches';
import 'plugins/kibana/discover/directives/no_results';
import 'plugins/kibana/discover/directives/timechart';
import 'ui/collapsible_sidebar';
import 'plugins/kibana/discover/components/field_chooser/field_chooser';
import 'plugins/kibana/discover/styles/main.less';
import 'ui/doc_table/components/table_row';

// Require config
var app = require('ui/modules').get('app/wazuh', []);

app.controller('testController', function ($scope, Private, $route, AppState, getAppState, globalState, courier, config, Promise, Notifier) {

	console.log("testController: hi");
	
	const notify = new Notifier({
    location: '*'
  });
  
	// Initialize AppState for this page
	
	$scope.state = new AppState();
	$scope.uiState = $scope.state.makeStateful('uiState');
	$scope.state.interval = "auto";
	console.log(getAppState());
	
	let SearchSource = Private(SearchSourceProvider);
	$scope.searchSource = new SearchSource();
	
	
	// Initialize global filters
	const queryFilter = Private(FilterBarQueryFilterProvider);
	const filterManager = Private(FilterManagerProvider);
	
	console.log(queryFilter.getGlobalFilters());
	
	// Change global filters
	var filters = [];
	//queryFilter.addFilters(filters, true);
	
	//console.log(filterManager.add("AgentName", "perro", "", "ossec-*"));
	//$scope.state
	
	// Load Kibana AppState
	console.log(getAppState());
	
	// Creating Visualization
	
			  
	// Initialize vis
	const Vis = Private(VisProvider);
	const brushEvent = Private(UtilsBrushEventProvider);
	
	// Vis Arguments
	const visStateAggs = [
	  {
		type: 'count',
		schema: 'metric'
	  },
	  {
		type: 'date_histogram',
		schema: 'segment',
		params: {
		  field: "@timestamp",
		  interval: $scope.state.interval
		}
	  }
	];

	// Create Vis object
	const State = Private(StateProvider);
	courier.indexPatterns.getIds()
    .then(function (list) {

      const id = "ossec-*";

      Promise.props({
        list: list,
        loaded: courier.indexPatterns.get(id),
        stateVal: config.get('defaultIndex'),
        stateValFound: false
      }).then(function (result) {
		  console.log("heeeey1");
		  $scope._ip = result;
		  console.log(result);
	    function resolveIndexPatternLoading() {
            const props = $scope._ip;
            const loaded = props.loaded;
            const stateVal = props.stateVal;
            const stateValFound = props.stateValFound;

            return loaded;
          }
		  
		// Set vis State
		$scope.indexPattern = resolveIndexPatternLoading();
		$scope.searchSource
              .size(500)
              .sort({"@timestamp" : "desc"})
              .query(null);
		$scope.searchSource.set('index', $scope.indexPattern);

		console.log($scope.indexPattern);		
		$scope.vis = new Vis($scope.indexPattern, {
		  title: "My title",
		  type: 'histogram',
		  params: {
			addLegend: false,
			addTimeMarker: true
		  },
		  listeners: {
			click: function (e) {
			  notify.log(e);
			  timefilter.time.from = moment(e.point.x);
			  timefilter.time.to = moment(e.point.x + e.data.ordered.interval);
			  timefilter.time.mode = 'absolute';
			},
			brush: brushEvent
		  },
		  aggs: visStateAggs
		});
	
		$scope.searchSource.aggs(function () {
		  $scope.vis.requesting();
		  return $scope.vis.aggs.toDsl();
		});
		
	
					init();
			
	  });
	});

});