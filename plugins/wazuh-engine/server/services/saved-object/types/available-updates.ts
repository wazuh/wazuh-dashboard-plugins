import { SavedObjectsFieldMapping, SavedObjectsType } from 'opensearch-dashboards/server';
import { SAVED_OBJECT_UPDATES } from '../../../../common/constants';

const updateObjectType: SavedObjectsFieldMapping = {
  properties: {
    description: {
      type: 'text',
    },
    published_date: {
      type: 'date',
    },
    semver: {
      type: 'nested',
      properties: {
        major: {
          type: 'integer',
        },
        minor: {
          type: 'integer',
        },
        patch: {
          type: 'integer',
        },
      },
    },
    tag: {
      type: 'text',
    },
    title: {
      type: 'text',
    },
  },
};

export const availableUpdatesObject: SavedObjectsType = {
  name: SAVED_OBJECT_UPDATES,
  hidden: false,
  namespaceType: 'agnostic',
  mappings: {
    properties: {
      last_check_date: {
        type: 'date',
      },
      apis_available_updates: {
        type: 'nested',
        properties: {
          api_id: {
            type: 'text',
          },
          current_version: {
            type: 'text',
          },
          update_check: {
            type: 'boolean',
          },
          status: {
            type: 'text',
          },
          last_check_date: {
            type: 'date',
          },
          last_available_major: updateObjectType,
          last_available_minor: updateObjectType,
          last_available_patch: updateObjectType,
          error: {
            type: 'nested',
            properties: {
              title: {
                type: 'text',
              },
              detail: {
                type: 'text',
              },
            },
          },
        },
      },
    },
  },
  migrations: {},
};
