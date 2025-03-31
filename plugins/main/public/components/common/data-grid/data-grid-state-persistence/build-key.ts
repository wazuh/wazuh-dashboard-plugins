const WAZUH_DATA_GRID_COLUMNS_PREFIX = 'wz-data-grid-state';

type KeyState = 'column' | 'page-size';

export const buildKey = (moduleId: string, state: KeyState) => {
  return `${WAZUH_DATA_GRID_COLUMNS_PREFIX}-${state}-${moduleId}`;
};
