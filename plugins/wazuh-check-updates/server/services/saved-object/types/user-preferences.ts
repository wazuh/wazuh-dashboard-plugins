import { SavedObjectsType } from 'opensearch-dashboards/server';
import { SAVED_OBJECT_USER_PREFERENCES } from '../../../../common/constants';

export const userPreferencesObject: SavedObjectsType = {
  name: SAVED_OBJECT_USER_PREFERENCES,
  hidden: false,
  namespaceType: 'agnostic',
  mappings: {
    properties: {
      users: {
        type: 'nested',
        properties: {
          username: { type: 'text' },
          last_dismissed_update: {
            type: 'text',
          },
          hide_update_notifications: {
            type: 'boolean',
          },
        },
      },
    },
  },
  migrations: {},
};
