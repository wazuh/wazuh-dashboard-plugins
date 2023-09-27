import { useState } from 'react';
import { DashboardContainerInput } from '../../../../../../../../src/plugins/dashboard/public';
import { ViewMode } from '../../../../../../../../src/plugins/embeddable/public';

const emptyInitialConfiguration: DashboardContainerInput = {
  viewMode: ViewMode.EDIT,
  filters: [],
  query: undefined,
  timeRange: undefined,
  useMargins: false,
  title: '',
  isFullScreenMode: false,
  panels: {},
  id: '',
};

export const useDashboardConfiguration = (initialConfiguration?: DashboardContainerInput) => {
  const [configuration, setConfiguration] = useState<DashboardContainerInput>(
    initialConfiguration ? initialConfiguration : emptyInitialConfiguration
  );

  const updateConfiguration = (updatedConfig: Partial<DashboardContainerInput>) => {
    setConfiguration((prevConfig: DashboardContainerInput) => ({
      ...prevConfig,
      ...updatedConfig,
    }));
  };

  return {
    configuration,
    updateConfiguration,
  };
};
