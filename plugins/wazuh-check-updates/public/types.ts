import React from 'react';
import { WazuhCorePluginStart } from '../../wazuh-core/public';
import { AvailableUpdates } from '../common/types';

export interface WazuhCheckUpdatesPluginSetup {}
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface WazuhCheckUpdatesPluginStart {
  UpdatesNotification: () => React.JSX.Element | null;
  getAvailableUpdates: (
    queryApi: boolean,
    forceQuery: boolean,
  ) => Promise<AvailableUpdates>;
  DismissNotificationCheck: () => React.JSX.Element | null;
  hooks: {
    useDockedSideNav: () => boolean;
  };
}

export interface AppPluginStartDependencies {
  wazuhCore: WazuhCorePluginStart;
}
