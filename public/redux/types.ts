import { DefaultRootState } from 'react-redux';

export type ResolverAction = {
  type: string;
  payload: any;
};

export type AppConfigState = {
  isLoading: boolean;
  isReady: boolean;
  hasError: boolean;
  data: { [key: string]: any };
};

export type AppRootState = DefaultRootState & {
  appConfig: AppConfigState,
};

export type RestartWazuhState = {
  restartAttempt: number,
  syncCheckAttempt: number,
  unsynchronizedNodes: [],
  syncNodesInfo: [ {name: string, synced: boolean} ],
  restartStatus: string
}
