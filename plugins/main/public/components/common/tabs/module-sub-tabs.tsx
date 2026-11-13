import React from 'react';

import {
  TabsManagedBySearchParam,
  TabsManagedBySearchParamProps,
} from '../../navigation/tabs-managed-by-search-params';

// Search parameter that holds the selected sub-tab
export const MODULE_SUB_TABS_SEARCH_PARAM = 'tabSubView';

export const ModuleSubTabs = ({
  tabs,
}: {
  tabs: TabsManagedBySearchParamProps['tabs'];
}) => {
  return (
    <TabsManagedBySearchParam
      tabs={tabs}
      searchParamNavigation={MODULE_SUB_TABS_SEARCH_PARAM}
      tabsProps={{ size: 's' }}
    />
  );
};
