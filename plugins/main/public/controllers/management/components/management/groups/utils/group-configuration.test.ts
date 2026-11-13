import GroupsHandler from './groups-handler';
import {
  getGroupConfigurationEditorPath,
  getGroupConfigurationFile,
  isGroupConfigurationEditRequested,
} from './group-configuration';

jest.mock('./groups-handler', () => ({
  __esModule: true,
  default: { getFileContent: jest.fn() },
}));

jest.mock('../../../../../../utils/applications', () => ({
  endpointGroups: { id: 'endpoint-groups' },
}));

jest.mock('../../../../../../react-services/navigation-service', () => ({
  __esModule: true,
  default: { getInstance: () => ({ getUrlForApp: jest.fn() }) },
}));

const getFileContent = GroupsHandler.getFileContent as jest.Mock;

describe('group configuration', () => {
  beforeEach(() => jest.clearAllMocks());

  it('builds the path that opens the editor of a group', () => {
    expect(getGroupConfigurationEditorPath('linux')).toBe(
      '#/manager/?tab=groups&group=linux&editConfig=true',
    );
  });

  it.each([
    [{ editConfig: 'true' }, true],
    [{ editConfig: 'false' }, false],
    [{}, false],
    [undefined, false],
  ])('reads the edit request from %p', (search, expected) => {
    expect(isGroupConfigurationEditRequested(search)).toBe(expected);
  });

  it('loads the configuration file of the group', async () => {
    getFileContent.mockResolvedValue('<agent_config></agent_config>');

    await expect(getGroupConfigurationFile('linux')).resolves.toEqual({
      name: 'agent.conf',
      content: '<agent_config></agent_config>',
      isEditable: true,
      groupName: 'linux',
    });
    expect(getFileContent).toHaveBeenCalledWith(
      '/groups/linux/files/agent.conf?raw=true',
    );
  });

  it('loads an empty file as empty content', async () => {
    getFileContent.mockResolvedValue(false);

    await expect(getGroupConfigurationFile('linux')).resolves.toMatchObject({
      content: '',
    });
  });

  it("doesn't load a file that can't be read", async () => {
    getFileContent.mockResolvedValue(undefined);

    await expect(getGroupConfigurationFile('linux')).resolves.toBeNull();
  });
});
