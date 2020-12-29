import { getAngularModule } from '../kibana-services';
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
//import { createDiscoverSidebarDirective } from './discover/application/components/sidebar';

//import { CollapsibleSidebarProvider } from './discover/application/angular/directives/collapsible_sidebar/collapsible_sidebar';
import { createRenderCompleteDirective } from './discover/application/angular/directives/render_complete';
//import { createHitsCounterDirective } from './discover/application/components/hits_counter';
//import { createLoadingSpinnerDirective } from './discover/application/components/loading_spinner/loading_spinner';
//import { createTimechartHeaderDirective } from './discover/application/components/timechart_header';
import { createContextErrorMessageDirective } from './discover/application/components/context_error_message';
//import { createSkipBottomButtonDirective } from './discover/application/components/skip_bottom_button';

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
  //.directive('discoverSidebar', createDiscoverSidebarDirective)
  //.directive('collapsibleSidebar', CollapsibleSidebarProvider)
  .directive('renderComplete', createRenderCompleteDirective)
  //.directive('skipBottomButton', createSkipBottomButtonDirective)
  //.directive('hitsCounter', createHitsCounterDirective)
  //.directive('loadingSpinner', createLoadingSpinnerDirective)
  //.directive('timechartHeader', createTimechartHeaderDirective)
  .directive('contextErrorMessage', createContextErrorMessageDirective)
