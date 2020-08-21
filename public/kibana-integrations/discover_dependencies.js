import { getAngularModule } from '../../../../src/plugins/discover/public/kibana_services';
import { createDocTableDirective } from '../../../../src/plugins/discover/public/application/angular/doc_table/doc_table';
import { createPagerFactory } from '../../../../src/plugins/discover/public/application/angular/doc_table/lib/pager/pager_factory';
import { createTableHeaderDirective } from '../../../../src/plugins/discover/public/application/angular/doc_table/components/table_header';
import {
  createToolBarPagerButtonsDirective,
  createToolBarPagerTextDirective
} from '../../../../src/plugins/discover/public/application/angular/doc_table/components/pager';
import { createTableRowDirective } from '../../../../src/plugins/discover/public/application/angular/doc_table/components/table_row';
import { createInfiniteScrollDirective } from '../../../../src/plugins/discover/public/application/angular/doc_table/infinite_scroll';
import { createDocViewerDirective } from '../../../../src/plugins/discover/public/application/angular/doc_viewer';
import { createDiscoverSidebarDirective } from '../../../../src/plugins/discover/public/application/components/sidebar';

import { CollapsibleSidebarProvider } from '../../../../src/plugins/discover/public/application/angular/directives/collapsible_sidebar/collapsible_sidebar';
import { createRenderCompleteDirective } from '../../../../src/plugins/discover/public/application/angular/directives/render_complete';
import { createHitsCounterDirective } from '../../../../src/plugins/discover/public/application/components/hits_counter';
import { createLoadingSpinnerDirective } from '../../../../src/plugins/discover/public/application/components/loading_spinner/loading_spinner';
import { createTimechartHeaderDirective } from '../../../../src/plugins/discover/public/application/components/timechart_header';
import { createContextErrorMessageDirective } from '../../../../src/plugins/discover/public/application/components/context_error_message';
import { createSkipBottomButtonDirective } from '../../../../src/plugins/discover/public/application/components/skip_bottom_button';

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
  .directive('discoverSidebar', createDiscoverSidebarDirective)
  .directive('collapsibleSidebar', CollapsibleSidebarProvider)
  .directive('renderComplete', createRenderCompleteDirective)
  .directive('skipBottomButton', createSkipBottomButtonDirective)
  .directive('hitsCounter', createHitsCounterDirective)
  .directive('loadingSpinner', createLoadingSpinnerDirective)
  .directive('timechartHeader', createTimechartHeaderDirective)
  .directive('contextErrorMessage', createContextErrorMessageDirective)
