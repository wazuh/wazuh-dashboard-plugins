import { tSavedObjectResponse } from '../pattern-data-source-repository';
import { AlertsDataSourceRepository } from '../../index';
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

describe('AlertsDataSourceRepository', () => {
  let repository: AlertsDataSourceRepository;

  beforeEach(() => {
    repository = new AlertsDataSourceRepository();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should create a new instance', () => {
    expect(repository).toBeInstanceOf(AlertsDataSourceRepository);
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
    expect(AppState.setCurrentPattern).toHaveBeenCalledWith(
      mockedIndexPattern.id,
    );
  });

  it('should return an ERROR when default index pattern is not saved in storage', async () => {
    AppState.getCurrentPattern = jest.fn().mockReturnValue(null);
    try {
      await repository.getDefault();
    } catch (error) {
      expect(error.message).toBe(
        'There is no selected index pattern for alerts. Ensure there is a compatible index pattern and select it using the index pattern selector. The index pattern selector is only available when there are multiple compatibles index patterns. If there is only a compatible index pattern, the selector is not visible, and it could indicate the index pattern was not selected due to some error or you could need to select it.',
      );
    }
  });
});
