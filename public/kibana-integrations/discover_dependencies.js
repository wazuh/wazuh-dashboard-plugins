import { getDiscoverModule } from '../kibana-services';
import { createDocTableDirective } from './discover/application/angular/doc_table/doc_table';
import { createPagerFactory } from './discover/application/angular/doc_table/lib/pager/pager_factory';
import { createTableHeaderDirective } from './discover/application/angular/doc_table/components/table_header';
import {
  createToolBarPagerButtonsDirective,
  createToolBarPagerTextDirective
} from './discover/application/angular/doc_table/components/pager';
import { createTableRowDirective } from './discover/application/angular/doc_table/components/table_row';
import { createInfiniteScrollDirective } from './discover/application/angular/doc_table/infinite_scroll';
import { createDocViewerDirective } from './discover/application/angular/doc_viewer';
import { createRenderCompleteDirective } from './discover/application/angular/directives/render_complete';
import { createContextErrorMessageDirective } from './discover/application/components/context_error_message';

const app = getDiscoverModule();

app
  .factory('pagerFactory', createPagerFactory)
  .directive('docTable', createDocTableDirective)
  .directive('kbnTableHeader', createTableHeaderDirective)
  .directive('toolBarPagerText', createToolBarPagerTextDirective)
  .directive('kbnTableRow', createTableRowDirective)
  .directive('toolBarPagerButtons', createToolBarPagerButtonsDirective)
  .directive('kbnInfiniteScroll', createInfiniteScrollDirective)
  .directive('docViewer', createDocViewerDirective)
  .directive('renderComplete', createRenderCompleteDirective)
  .directive('contextErrorMessage', createContextErrorMessageDirective)
