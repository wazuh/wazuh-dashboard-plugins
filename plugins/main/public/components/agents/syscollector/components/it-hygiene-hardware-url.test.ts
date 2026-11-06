import NavigationService from '../../../../react-services/navigation-service';
import store from '../../../../redux/store';
import { getItHygieneHardwareUrl } from './it-hygiene-hardware-url';

jest.mock('../../../../react-services/navigation-service', () => ({
  __esModule: true,
  default: { getInstance: jest.fn() },
}));
jest.mock('../../../../redux/store', () => ({
  __esModule: true,
  default: { getState: jest.fn() },
}));
jest.mock('../../../../utils/applications', () => ({
  ITHygiene: { id: 'it-hygiene' },
}));

const getUrlForApp = jest.fn(
  (appId: string, options: { path: string }) => `/app/${appId}${options.path}`,
);

describe('getItHygieneHardwareUrl', () => {
  beforeEach(() => {
    (NavigationService.getInstance as jest.Mock).mockReturnValue({
      getUrlForApp,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('opens the Hardware tab for the selected agent', () => {
    (store.getState as jest.Mock).mockReturnValue({
      appStateReducers: { currentAgentData: { id: '001' } },
    });

    expect(getItHygieneHardwareUrl()).toBe(
      '/app/it-hygiene#/overview/?tab=it-hygiene&tabView=system&tabSubView=hardware&agentId=001',
    );
  });

  it('omits the agent when none is selected', () => {
    (store.getState as jest.Mock).mockReturnValue({ appStateReducers: {} });

    expect(getItHygieneHardwareUrl()).toBe(
      '/app/it-hygiene#/overview/?tab=it-hygiene&tabView=system&tabSubView=hardware',
    );
  });
});
