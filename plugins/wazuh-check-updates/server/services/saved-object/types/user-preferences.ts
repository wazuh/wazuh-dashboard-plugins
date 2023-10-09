import { SavedObjectsType } from 'opensearch-dashboards/server';
import { SAVED_OBJECT_USER_PREFERENCES } from '../../../../common/constants';

export const userPreferencesObject: SavedObjectsType = {
  name: SAVED_OBJECT_USER_PREFERENCES,
  hidden: false,
  namespaceType: 'agnostic',
  mappings: {
    properties: {
      last_dismissed_updates: {
        type: 'nested',
        properties: {
          api_id: {
            type: 'text',
          },
          last_major: {
            type: 'text',
          },
          last_minor: {
            type: 'text',
          },
          last_patch: {
            type: 'text',
          },
        },
      },
      hide_update_notifications: {
        type: 'boolean',
      },
    },
  },
  migrations: {},
};
