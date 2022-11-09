import { ErrorHandler } from '../../react-services';
import { DevToolsController } from './dev-tools';

// mocked some required kibana-services
jest.mock('../../kibana-services', () => ({
  ...(jest.requireActual('../../kibana-services') as object),
  getUiSettings: jest.fn().mockReturnValue({
    get: (name) => {
      return true;
    },
  }),
}));

// mocked window object
Object.defineProperty(window, 'location', {
  value: {
    hash: {
      endsWith: jest.fn(),
      includes: jest.fn(),
    },
    href: jest.fn(),
    assign: jest.fn(),
    search: jest.fn().mockResolvedValue({
      tab: 'api',
    }),
    path: jest.fn(),
  },
  writable: true,
});
// mocked scope dependency
const $scope = {
  $applyAsync: jest.fn(),
};
// mocked getErrorOrchestrator
const mockedGetErrorOrchestrator = {
  handleError: jest.fn(),
};

jest.mock('../../react-services/common-services', () => {
  return {
    getErrorOrchestrator: () => mockedGetErrorOrchestrator,
  };
});

describe('Devtools Controller', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Devtools.Send()', () => {
    it('Should return string type errors to print in the codemirror textarea output', async () => {

      // Create new instance of the devtools controller
      const controller = new DevToolsController($scope, window, ErrorHandler, [window.document]);

      // Define possible error structures to parse
      const errorTypes = {
        dataObject: {
          data: { message: 'Data Object Error' }
        },
        invalidObject: {
          error: 'Invalid Object Error'
        },
        object: {
          data: 'Object Error',
          status: -1
        },
        string: "String Error",
        null: null,
        undefined: undefined,
        number: 1,
      }

      expect(controller.parseError(errorTypes.object)).toEqual('Wazuh API is not reachable. Reason: timeout.');
      expect(controller.parseError(errorTypes.string)).toEqual('String Error');
      expect(controller.parseError(errorTypes.dataObject)).toEqual(errorTypes.dataObject.data.message);
      expect(controller.parseError(errorTypes.invalidObject)).toEqual(JSON.stringify(errorTypes.invalidObject));
      
    })
  })

});