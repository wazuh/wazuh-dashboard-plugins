import type { AppStoreState } from '../store';

export const showMenuSelector = (state: AppStoreState): boolean =>
  !!state?.appStateReducers?.showMenu;
