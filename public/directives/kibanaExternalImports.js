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
import 'ui/vis/editors/default/sidebar';
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
import metricVisTypeProvider from 'plugins/kbn_vislib_vis_types/metric';



VisTypesRegistryProvider.register(histogramVisTypeProvider);
VisTypesRegistryProvider.register(lineVisTypeProvider);
VisTypesRegistryProvider.register(pieVisTypeProvider);
VisTypesRegistryProvider.register(areaVisTypeProvider);
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

import { RegistryFieldFormatsProvider } from 'ui/registry/field_formats';
import { UrlFormat } from 'plugins/kibana/../common/field_formats/types/url';
import { BytesFormat } from 'plugins/kibana/../common/field_formats/types/bytes';
import { DateFormat } from 'plugins/kibana/../common/field_formats/types/date';
import { DurationFormat } from 'plugins/kibana/../common/field_formats/types/duration';
import { IpFormat } from 'plugins/kibana/../common/field_formats/types/ip';
import { NumberFormat } from 'plugins/kibana/../common/field_formats/types/number';
import { PercentFormat } from 'plugins/kibana/../common/field_formats/types/percent';
import { StringFormat } from 'plugins/kibana/../common/field_formats/types/string';
import { SourceFormat } from 'plugins/kibana/../common/field_formats/types/source';
import { ColorFormat } from 'plugins/kibana/../common/field_formats/types/color';
import { TruncateFormat } from 'plugins/kibana/../common/field_formats/types/truncate';
import { BoolFormat } from 'plugins/kibana/../common/field_formats/types/boolean';

RegistryFieldFormatsProvider.register(() => UrlFormat);
RegistryFieldFormatsProvider.register(() => BytesFormat);
RegistryFieldFormatsProvider.register(() => DateFormat);
RegistryFieldFormatsProvider.register(() => DurationFormat);
RegistryFieldFormatsProvider.register(() => IpFormat);
RegistryFieldFormatsProvider.register(() => NumberFormat);
RegistryFieldFormatsProvider.register(() => PercentFormat);
RegistryFieldFormatsProvider.register(() => StringFormat);
RegistryFieldFormatsProvider.register(() => SourceFormat);
RegistryFieldFormatsProvider.register(() => ColorFormat);
RegistryFieldFormatsProvider.register(() => TruncateFormat);
RegistryFieldFormatsProvider.register(() => BoolFormat);

import { VisRequestHandlersRegistryProvider } from 'ui/registry/vis_request_handlers';
import { CourierRequestHandlerProvider } from 'ui/vis/request_handlers/courier';
import { noneRequestHandlerProvider } from 'ui/vis/request_handlers/none';

VisRequestHandlersRegistryProvider.register(CourierRequestHandlerProvider);
VisRequestHandlersRegistryProvider.register(noneRequestHandlerProvider);

import { VisResponseHandlersRegistryProvider } from 'ui/registry/vis_response_handlers';
import { BasicResponseHandlerProvider } from 'ui/vis/response_handlers/basic';
import { noneResponseHandler } from 'ui/vis/response_handlers/none';

VisResponseHandlersRegistryProvider.register(BasicResponseHandlerProvider);
VisResponseHandlersRegistryProvider.register(noneResponseHandler);

import { VisEditorTypesRegistryProvider } from 'ui/registry/vis_editor_types';
import { defaultEditor } from 'ui/vis/editors/default/default';
VisEditorTypesRegistryProvider.register(defaultEditor);

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