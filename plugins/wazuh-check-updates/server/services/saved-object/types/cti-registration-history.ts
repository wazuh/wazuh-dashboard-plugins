/* eslint-disable camelcase -- saved object fields use snake_case */
import { SavedObjectsType } from 'opensearch-dashboards/server';
import { SAVED_OBJECT_CTI_REGISTRATION_HISTORY } from '../../../../common/constants';

// One document per environment UUID, shared by every user and dashboard node.
export const ctiRegistrationHistoryObject: SavedObjectsType = {
  name: SAVED_OBJECT_CTI_REGISTRATION_HISTORY,
  hidden: true,
  namespaceType: 'agnostic',
  mappings: {
    properties: {
      last_plan: {
        type: 'keyword',
      },
      last_registered_at: {
        type: 'date',
      },
      lost_at: {
        type: 'date',
      },
      lost_plan: {
        type: 'keyword',
      },
    },
  },
  migrations: {},
};
