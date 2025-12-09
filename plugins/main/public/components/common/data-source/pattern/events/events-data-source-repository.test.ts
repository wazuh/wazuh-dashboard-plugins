import { tSavedObjectResponse } from '../pattern-data-source-repository';
import { EventsDataSourceRepository } from './events-data-source-repository';
jest.mock('../../../../../react-services/generic-request');
import { AppState } from '../../../../../react-services';
jest.mock('../../../../../react-services/app-state');
jest.mock('../../../../../kibana-services', () => ({
  ...(jest.requireActual('../../../../../kibana-services') as object),
  getHttp: jest.fn().mockReturnValue({
    basePath: {
      get: () => {
        return 'http://localhost:5601';
      },
      prepend: url => {
        return `http://localhost:5601${url}`;
      },
    },
  }),
  getCookies: jest.fn().mockReturnValue({
    set: (name, value, options) => {
      return true;
    },
    get: () => {
      return '{}';
    },
    remove: () => {
      return;
    },
  }),
  getUiSettings: jest.fn().mockReturnValue({
    get: name => {
      return true;
    },
  }),
}));

const mockedSavedObject = {
  data: {
    attributes: {
      title: 'test-pattern-title',
      fields:
        '[{"name":"timestamp","type":"date","count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true}]',
    },
    id: 'test-pattern-id',
    migrationVersion: {
      'index-pattern': '7.10.0',
    },
    namespace: ['default'],
    references: [],
    score: 0,
    type: 'index-pattern',
    updated_at: '2021-08-23T14:05:54.000Z',
    version: 'WzIwMjEsM',
  },
} as tSavedObjectResponse;

describe('EventsDataSourceRepository', () => {
  let repository: EventsDataSourceRepository;

  beforeEach(() => {
    repository = new EventsDataSourceRepository();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should create a new instance', () => {
    expect(repository).toBeInstanceOf(EventsDataSourceRepository);
  });

  it('should set default pattern in storage', async () => {
    const mockedIndexPattern = {
      ...mockedSavedObject.data,
      id: 'test-id',
      attributes: {
        ...mockedSavedObject.data.attributes,
        title: 'test-title',
      },
    };
    const parsedIndexPatternData =
      repository.parseIndexPattern(mockedIndexPattern);
    await repository.setDefault(parsedIndexPatternData);
  });

  it('should return an ERROR when default index pattern is not saved in storage', async () => {
    // Mock getWazuhCorePlugin configuration to return empty pattern
    const { getWazuhCorePlugin } = require('../../../../../kibana-services');
    jest
      .spyOn(require('../../../../../kibana-services'), 'getWazuhCorePlugin')
      .mockReturnValue({
        configuration: {
          get: jest.fn().mockResolvedValue(''),
        },
      });
    try {
      await repository.getDefault([]);
    } catch (error) {
      expect(error.message).toBe(
        "No index pattern selected for events. Make sure a compatible index pattern exists and select it. This wasn't applied correctly or needs to be re-selected.",
      );
    }
  });
});
