import { WazuhCorePluginStart } from '../../wazuh-core/public';
import { AvailableUpdates } from '../common/types';
import type { CtiFeedSyncStatusProps } from './shared-components/cti-feed-sync-status';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface WazuhCheckUpdatesPluginSetup {}

export interface WazuhCheckUpdatesPluginStart {
  UpdatesNotification: () => JSX.Element | null;
  getAvailableUpdates: (
    queryApi: boolean,
    forceQuery: boolean,
  ) => Promise<AvailableUpdates>;
  DismissNotificationCheck: () => JSX.Element | null;
  ctiRegistrationUiEnabled: boolean;
  ctiUpsellEnabled: boolean;
  ctiRegistrationStatusPollIntervalSec: number;
  CtiUpsellNotification: () => JSX.Element | null;
  /** Sync state of the CTI feed, linking to the CTI feed app. */
  CtiFeedSyncStatus: (props: CtiFeedSyncStatusProps) => JSX.Element | null;
}

export interface AppPluginStartDependencies {
  wazuhCore: WazuhCorePluginStart;
}
