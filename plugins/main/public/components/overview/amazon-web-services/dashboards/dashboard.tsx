import React, { useEffect, useState } from 'react';
import useSearchBar from '../../../common/search-bar/use-search-bar';
import { compose } from 'redux';
import { getPlugins } from '../../../../kibana-services';
import { ViewMode } from '../../../../../../../src/plugins/embeddable/public';
import { getDashboardPanels } from './dashboard_panels';
import { I18nProvider } from '@osd/i18n/react';
import { SearchResponse } from '../../../../../../../src/core/server';
import './styles.scss';
import { withErrorBoundary } from '../../../common/hocs';
import { IndexPattern } from '../../../../../../../src/plugins/data/common';
import { SampleDataWarning } from '../../../visualize/components';
import {
  ErrorFactory,
  ErrorHandler,
  HttpError,
} from '../../../../react-services/error-management';
import {
  AlertsDataSourceRepository,
  PatternDataSource,
  tParsedIndexPattern,
  useDataSource,
  AWSDataSource,
} from '../../../common/data-source';
import { DiscoverNoResults } from '../../../common/no-results/no-results';
import { LoadingSearchbarProgress } from '../../../common/loading-searchbar-progress/loading-searchbar-progress';
import { WzSearchBar } from '../../../common/search-bar';
import { WAZUH_SAMPLE_ALERTS_CATEGORY_SECURITY } from '../../../../../common/constants';
import { createDashboard } from '../../../common/dashboards';

export const DashboardAWS = createDashboard({
  DataSource: AWSDataSource,
  DataSourceRepositoryCreator: AlertsDataSourceRepository,
  getDashboardPanels: [
    {
      getDashboardPanels: getDashboardPanels,
      id: 'aws-dashboard-tab',
      title: 'AWS dashboard',
      description: 'Dashboard of the AWS',
      hidePanelTitles: false,
    },
  ],
  sampleDataWarningCategories: [WAZUH_SAMPLE_ALERTS_CATEGORY_SECURITY],
});
