import React, { useEffect } from 'react';
import { ModuleSubTabs } from '../../../common/tabs';
import NavigationService from '../../../../react-services/navigation-service';
import { useRouterSearch } from '../../../common/hooks';

interface ComplianceModuleProps {
  moduleId: string;
  tabs: any[];
}

export const ComplianceModule = ({ moduleId, tabs }: ComplianceModuleProps) => {
  const search = useRouterSearch();

  useEffect(() => {
    if (search.tabSubView) {
      const isTabValid = tabs.some(t => t.id === search.tabSubView);

      if (!isTabValid) {
        const navigationService = NavigationService.getInstance();
        const newSearch = { ...search, tabSubView: tabs[0].id };
        const searchParams = new URLSearchParams(newSearch).toString();

        navigationService.navigate(
          `${navigationService.getPathname()}?${searchParams}`,
        );
      }
    }
  }, [moduleId]);

  return <ModuleSubTabs tabs={tabs} />;
};
