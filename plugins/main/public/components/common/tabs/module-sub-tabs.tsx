import React from 'react';

import {
  TabsManagedBySearchParam,
  TabsManagedBySearchParamProps,
} from '../../navigation/tabs-managed-by-search-params';

export const ModuleSubTabs = ({ tabs }: TabsManagedBySearchParamProps) => {
  return (
    <TabsManagedBySearchParam
      tabs={tabs}
      searchParamNavigation='tabSubView'
      tabsProps={{ size: 's' }}
    />
  );
};
