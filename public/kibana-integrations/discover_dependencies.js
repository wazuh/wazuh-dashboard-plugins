import { getAngularModule } from 'plugins/kibana/discover/kibana_services';
import { createDocTableDirective } from 'plugins/kibana/discover/np_ready/angular/doc_table/doc_table';
import { createPagerFactory } from 'plugins/kibana/discover/np_ready/angular/doc_table/lib/pager/pager_factory';
import { createTableHeaderDirective } from 'plugins/kibana/discover/np_ready/angular/doc_table/components/table_header';
import {
  createToolBarPagerButtonsDirective,
  createToolBarPagerTextDirective
} from 'plugins/kibana/discover/np_ready/angular/doc_table/components/pager';
import { createTableRowDirective } from 'plugins/kibana/discover/np_ready/angular/doc_table/components/table_row';
import { createInfiniteScrollDirective } from 'plugins/kibana/discover/np_ready/angular/doc_table/infinite_scroll';
import { createDocViewerDirective } from 'plugins/kibana/discover/np_ready/angular/doc_viewer';
import { createFieldSearchDirective } from 'plugins/kibana/discover/np_ready/components/field_chooser/discover_field_search_directive';
import { createIndexPatternSelectDirective } from 'plugins/kibana/discover/np_ready/components/field_chooser/discover_index_pattern_directive';
import { createStringFieldProgressBarDirective } from 'plugins/kibana/discover/np_ready/components/field_chooser/string_progress_bar';
import { createFieldChooserDirective } from 'plugins/kibana/discover/np_ready/components/field_chooser/field_chooser';
import { createDiscoverFieldDirective } from 'plugins/kibana/discover/np_ready/components/field_chooser/discover_field';

const app = getAngularModule();

app
  .factory('pagerFactory', createPagerFactory)
  .directive('docTable', createDocTableDirective)
  .directive('kbnTableHeader', createTableHeaderDirective)
  .directive('toolBarPagerText', createToolBarPagerTextDirective)
  .directive('kbnTableRow', createTableRowDirective)
  .directive('toolBarPagerButtons', createToolBarPagerButtonsDirective)
  .directive('kbnInfiniteScroll', createInfiniteScrollDirective)
  .directive('docViewer', createDocViewerDirective)
  .directive('discoverFieldSearch', createFieldSearchDirective)
  .directive('discoverIndexPatternSelect', createIndexPatternSelectDirective)
  .directive('stringFieldProgressBar', createStringFieldProgressBarDirective)
  .directive('discoverField', createDiscoverFieldDirective)
  .directive('discFieldChooser', createFieldChooserDirective);
