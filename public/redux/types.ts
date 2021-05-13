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
