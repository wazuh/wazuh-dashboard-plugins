import React from 'react';
import { ModuleSubTabs } from '../../../common/tabs';
import { TabsManagedBySearchParamProps } from '../../../navigation/tabs-managed-by-search-params';

interface ComplianceModuleProps {
  tabs: TabsManagedBySearchParamProps['tabs'];
}

export const ComplianceModule = ({ tabs }: ComplianceModuleProps) => {
  return <ModuleSubTabs tabs={tabs} />;
};
