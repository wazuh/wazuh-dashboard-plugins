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
        mayor: {
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
      last_check: {
        type: 'date',
      },
      apiAvailableUpdates: {
        type: 'nested',
        properties: {
          apiId: {
            type: 'text',
          },
          version: {
            type: 'text',
          },
          status: {
            type: 'text',
          },
          last_check: {
            type: 'date',
          },
          lastMayor: updateObjectType,
          lastMinor: updateObjectType,
          lastPatch: updateObjectType,
        },
      },
    },
  },
  migrations: {},
};
