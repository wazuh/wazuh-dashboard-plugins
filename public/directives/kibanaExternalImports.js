require('ui/styles/base.less');
require('ui/styles/mixins.less');

require('ui/styles/control_group.less');
require('ui/styles/navbar.less');
require('plugins/kibana/visualize/styles/main.less');
require('ui/styles/config.less');
require('ui/styles/spinner.less');

import _ from 'lodash';
import 'ui/modals';

import 'plugins/kibana/visualize/saved_visualizations/saved_visualizations';
//import 'plugins/kibana/visualize/editor/sidebar';
import 'plugins/kibana/visualize/editor/agg_filter';
import 'ui/visualize';
import 'ui/collapsible_sidebar';
import 'ui/share';
import 'ui/listen';
import 'ui/bind';
import 'ui/fancy_forms';
import 'ui/filter_bar'



import Notifier from 'ui/notify/notifier';
import { VisTypesRegistryProvider } from 'ui/registry/vis_types';
import histogramVisTypeProvider from 'plugins/kbn_vislib_vis_types/histogram';
import lineVisTypeProvider from 'plugins/kbn_vislib_vis_types/line';
import pieVisTypeProvider from 'plugins/kbn_vislib_vis_types/pie';
import areaVisTypeProvider from 'plugins/kbn_vislib_vis_types/area';
import tileMapVisTypeProvider from 'plugins/tile_map/tile_map_vis';
import metricVisTypeProvider from 'plugins/kbn_vislib_vis_types/metric';



VisTypesRegistryProvider.register(histogramVisTypeProvider);
VisTypesRegistryProvider.register(lineVisTypeProvider);
VisTypesRegistryProvider.register(pieVisTypeProvider);
VisTypesRegistryProvider.register(areaVisTypeProvider);
VisTypesRegistryProvider.register(tileMapVisTypeProvider);
VisTypesRegistryProvider.register(metricVisTypeProvider);

require('plugins/table_vis/table_vis');
require('plugins/markdown_vis/markdown_vis');
//require('plugins/metrics/visualizations');
import DocTitleProvider from 'ui/doc_title';
import UtilsBrushEventProvider from 'ui/utils/brush_event';

import FilterBarFilterBarClickHandlerProvider from 'ui/filter_bar/filter_bar_click_handler';
import uiRoutes from 'ui/routes';
import { uiModules } from 'ui/modules';

import 'ui/state_management/app_state';
import StateManagementAppStateProvider from 'ui/state_management/app_state';
import 'plugins/kibana/discover/saved_searches/saved_searches.js';

//import 'ui/stringify/register';
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
