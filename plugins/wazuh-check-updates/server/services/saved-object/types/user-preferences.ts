import { SavedObjectsType } from 'opensearch-dashboards/server';
import { SAVED_OBJECT_USER_PREFERENCES } from '../../../../common/constants';

// Per-user preferences of this plugin, not only update notifications.
export const userPreferencesObject: SavedObjectsType = {
  name: SAVED_OBJECT_USER_PREFERENCES,
  hidden: true,
  namespaceType: 'agnostic',
  mappings: {
    properties: {
      last_dismissed_updates: {
        type: 'object',
        properties: {
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
      hide_cti_upsell: {
        type: 'boolean',
      },
    },
  },
  migrations: {},
};
