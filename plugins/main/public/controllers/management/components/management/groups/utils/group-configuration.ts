import { endpointGroups } from '../../../../../../utils/applications';
import NavigationService from '../../../../../../react-services/navigation-service';
import GroupsHandler from './groups-handler';

const GROUP_CONFIGURATION_FILE_NAME = 'agent.conf';

/* Search parameter that asks the groups view to open the configuration editor
of the group in the URL. */
export const EDIT_GROUP_CONFIGURATION_SEARCH_PARAM = 'editConfig';

export interface GroupConfigurationFile {
  name: string;
  content: string;
  isEditable: boolean;
  groupName: string;
}

export const isGroupConfigurationEditRequested = (search?: {
  [EDIT_GROUP_CONFIGURATION_SEARCH_PARAM]?: string;
}) => search?.[EDIT_GROUP_CONFIGURATION_SEARCH_PARAM] === 'true';

/**
 * Path, inside the groups application, that opens the configuration editor of
 * a group.
 */
export const getGroupConfigurationEditorPath = (groupName: string) =>
  `#/manager/?tab=groups&group=${encodeURIComponent(
    groupName,
  )}&${EDIT_GROUP_CONFIGURATION_SEARCH_PARAM}=true`;

export const getGroupConfigurationEditorUrl = (groupName: string) =>
  NavigationService.getInstance().getUrlForApp(endpointGroups.id, {
    path: getGroupConfigurationEditorPath(groupName),
  });

/**
 * Reads the configuration file of a group, ready to be loaded in the editor.
 * Resolves to `null` when the file can't be read: the error is already
 * reported, and opening the editor empty would let a save wipe the file.
 */
export const getGroupConfigurationFile = async (
  groupName: string,
): Promise<GroupConfigurationFile | null> => {
  const content = await GroupsHandler.getFileContent(
    `/groups/${groupName}/files/${GROUP_CONFIGURATION_FILE_NAME}?raw=true`,
  );

  if (content === undefined) {
    return null;
  }

  return {
    name: GROUP_CONFIGURATION_FILE_NAME,
    // An empty file comes back as `false`
    content: typeof content === 'string' ? content : '',
    isEditable: true,
    groupName,
  };
};
