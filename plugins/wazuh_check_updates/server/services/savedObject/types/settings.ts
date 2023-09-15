import { SavedObjectsType } from 'opensearch-dashboards/server';
import { SAVED_OBJECT_SETTINGS } from '../../../../common';

export const settingsObject: SavedObjectsType = {
  name: SAVED_OBJECT_SETTINGS,
  hidden: false,
  namespaceType: 'agnostic',
  mappings: {
    properties: {
      schedule: {
        type: 'text',
      },
    },
  },
  migrations: {},
};
