import { KeyState } from './constants';

const WAZUH_DATA_GRID_COLUMNS_PREFIX = 'wz-data-grid-state';

export const buildKey = (moduleId: string, state: KeyState) =>
  `${WAZUH_DATA_GRID_COLUMNS_PREFIX}-${state}-${moduleId}`;
