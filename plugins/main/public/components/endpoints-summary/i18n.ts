import { i18n } from '@osd/i18n';

const t = (id: string, defaultMessage: string) =>
  i18n.translate(`wz-endpoints-summary.${id}`, { defaultMessage });

export const endpointsSummaryI18n = {
  noAgentsTitle: t(
    'empty.noAgentsTitle',
    'No agents were added to the manager',
  ),
  noAgentsBody: t(
    'empty.noAgentsBody',
    'Add agents to fleet to start monitoring',
  ),
  deployNewAgent: t('deployNewAgent', 'Deploy new agent'),
  agentsByStatus: t('dashboard.agentsByStatus', 'Agents by Status'),
  top5Os: t('dashboard.top5Os', 'Top 5 OS'),
  top5Groups: t('dashboard.top5Groups', 'Top 5 groups'),
  noResults: t('empty.noResults', 'No results'),
  noResultsFound: t('empty.noResultsFound', 'No results were found'),
  agents: t('table.agents', 'Agents'),
  columnId: t('table.columnId', 'ID'),
  columnName: t('table.columnName', 'Name'),
  columnIpAddress: t('table.columnIpAddress', 'IP address'),
  columnGroups: t('table.columnGroups', 'Group(s)'),
  columnOperatingSystem: t('table.columnOperatingSystem', 'Operating system'),
  columnVersion: t('table.columnVersion', 'Version'),
  columnRegistrationDate: t('table.columnRegistrationDate', 'Registration date'),
  columnLastKeepAlive: t('table.columnLastKeepAlive', 'Last keep alive'),
  columnStatus: t('table.columnStatus', 'Status'),
  columnActions: t('table.columnActions', 'Actions'),
  notSearchableTip: t(
    'table.notSearchableTip',
    'This is not searchable through a search term.',
  ),
  outdated: t('table.outdated', 'Outdated'),
  upgrading: t('table.upgrading', 'Upgrading'),
  upgradePendingTip: t(
    'table.upgradePendingTip',
    'Upgrade request sent. This may take a few minutes.',
  ),
  moreGroups: t('table.moreGroups', 'more'),
  agentsSelected: (count: number) =>
    i18n.translate('wz-endpoints-summary.table.agentsSelected', {
      defaultMessage:
        '{count} {count, plural, one {agent} other {agents}} selected',
      values: { count },
    }),
  selectAllAgents: (count: number) =>
    i18n.translate('wz-endpoints-summary.table.selectAllAgents', {
      defaultMessage: 'Select all {count} agents',
      values: { count },
    }),
  clearAgentsSelected: (count: number) =>
    i18n.translate('wz-endpoints-summary.table.clearAgentsSelected', {
      defaultMessage: 'Clear {count} agents selected',
      values: { count },
    }),
  agentsBeingUpgraded: (count: number) =>
    i18n.translate('wz-endpoints-summary.table.agentsBeingUpgraded', {
      defaultMessage:
        '{count} {count, plural, one {agent is} other {agents are}} being upgraded',
      values: { count },
    }),
  upgradeRefreshHint: t(
    'table.upgradeRefreshHint',
    'The upgrade request was sent. This list will refresh automatically once each agent reports the new version.',
  ),
  filterByRegistrationDate: t(
    'search.filterByRegistrationDate',
    'filter by registration date',
  ),
  filterById: t('search.filterById', 'filter by ID'),
  filterByIp: t('search.filterByIp', 'filter by IP address'),
  filterByGroup: t('search.filterByGroup', 'filter by group'),
  filterByLastKeepAlive: t(
    'search.filterByLastKeepAlive',
    'filter by last keep alive',
  ),
  filterByManager: t('search.filterByManager', 'filter by manager'),
  filterByName: t('search.filterByName', 'filter by name'),
  filterByOsName: t(
    'search.filterByOsName',
    'filter by operating system name',
  ),
  filterByOsPlatform: t(
    'search.filterByOsPlatform',
    'filter by operating platform',
  ),
  filterByOsVersion: t(
    'search.filterByOsVersion',
    'filter by operating system version',
  ),
  filterByStatus: t('search.filterByStatus', 'filter by status'),
  filterByVersion: t('search.filterByVersion', 'filter by version'),
  invalidDateFormat: (value: string) =>
    i18n.translate('wz-endpoints-summary.search.invalidDateFormat', {
      defaultMessage:
        '"{value}" is not a expected format. Valid formats: YYYY-MM-DD, YYYY-MM-DD HH:mm:ss, YYYY-MM-DDTHH:mm:ss, YYYY-MM-DDTHH:mm:ssZ.',
      values: { value },
    }),
  viewAgentDetails: t('actions.viewAgentDetails', 'View agent details'),
  neverConnectedDetailsTip: t(
    'actions.neverConnectedDetailsTip',
    'Since the agent never connected, it is not possible to access its details',
  ),
  agentConfiguration: t('actions.agentConfiguration', 'Agent configuration'),
  neverConnectedConfigTip: t(
    'actions.neverConnectedConfigTip',
    'Since the agent never connected, it is not possible to access its configuration',
  ),
  editGroups: t('actions.editGroups', 'Edit groups'),
  upgrade: t('actions.upgrade', 'Upgrade'),
  agentNotActive: t('actions.agentNotActive', 'Agent is not active'),
  agentUpToDate: t('actions.agentUpToDate', 'Agent is up to date'),
  remove: t('actions.remove', 'Remove'),
  more: t('actions.more', 'More'),
  selectAgentsToPerform: t(
    'actions.selectAgentsToPerform',
    'Select agents to perfom the action',
  ),
  addGroupsToAgents: t('actions.addGroupsToAgents', 'Add groups to agents'),
  removeGroupsFromAgents: t(
    'actions.removeGroupsFromAgents',
    'Remove groups from agents',
  ),
  upgradeAgents: t('actions.upgradeAgents', 'Upgrade agents'),
  removeAgents: t('actions.removeAgents', 'Remove agents'),
  cancel: t('common.cancel', 'Cancel'),
  save: t('common.save', 'Save'),
  close: t('common.close', 'Close'),
  unknownError: t('common.unknownError', 'Unknown error'),
  agentId: t('common.agentId', 'Agent ID'),
  agentName: t('common.agentName', 'Agent name'),
  agentVersion: t('common.agentVersion', 'Agent version'),
  os: t('common.os', 'OS'),
  groups: t('common.groups', 'Groups'),
  selectedAgents: t('common.selectedAgents', 'Selected agents'),
  selectGroups: t('common.selectGroups', 'Select groups'),
  selectGroupsToAdd: t('common.selectGroupsToAdd', 'Select groups to add'),
  selectGroupsToRemove: t(
    'common.selectGroupsToRemove',
    'Select groups to remove',
  ),
  mustAddOneGroup: t('common.mustAddOneGroup', 'You must add at least one group'),
  changesApplyToFiltered: t(
    'common.changesApplyToFiltered',
    'The changes will be applied to all agents that match the filters set in the list',
  ),
  couldNotLoadGroups: t(
    'errors.couldNotLoadGroups',
    'Could not load groups. Check your permissions.',
  ),
  noGroupsAvailable: t('errors.noGroupsAvailable', 'No groups available.'),
  noGroupsForPermissions: t(
    'errors.noGroupsForPermissions',
    'No groups available for your permissions.',
  ),
  editAgentGroupsTitle: t('modals.editAgentGroupsTitle', 'Edit agent groups'),
  groupsSavedSuccess: t('modals.groupsSavedSuccess', 'Groups saved successfully'),
  couldNotGetGroups: t('errors.couldNotGetGroups', 'Could not get groups'),
  couldNotSaveAgentGroups: t(
    'errors.couldNotSaveAgentGroups',
    'Could not save agent groups',
  ),
  noPermissionEditGroups: (message: string) =>
    i18n.translate('wz-endpoints-summary.errors.noPermissionEditGroups', {
      defaultMessage:
        'No permissions to edit this agent groups. {message}',
      values: { message },
    }),
  upgradeAgentTitle: t('modals.upgradeAgentTitle', 'Upgrade agent'),
  upgradeRequestSent: t(
    'modals.upgradeRequestSent',
    'Upgrade request sent successfully',
  ),
  couldNotUpgradeAgent: t('errors.couldNotUpgradeAgent', 'Could not upgrade agent'),
  noPermissionUpgradeAgent: (message: string) =>
    i18n.translate('wz-endpoints-summary.errors.noPermissionUpgradeAgent', {
      defaultMessage: 'No permissions to upgrade this agent. {message}',
      values: { message },
    }),
  packageType: t('modals.packageType', 'Package type'),
  packageTypeTip: t(
    'modals.packageTypeTip',
    "Specify the package type, as the manager can't determine it automatically for the OS platform",
  ),
  packageTypePlaceholder: t('modals.packageTypePlaceholder', 'Packege type'),
  removeAgentTitle: t('modals.removeAgentTitle', 'Remove agent'),
  removeAgentSuccess: t('modals.removeAgentSuccess', 'Remove agent'),
  removedAgent: (name: string, id: string) =>
    i18n.translate('wz-endpoints-summary.modals.removedAgent', {
      defaultMessage: 'Removed agent: {name} ({id})',
      values: { name, id },
    }),
  couldNotRemoveAgent: t('errors.couldNotRemoveAgent', 'Could not remove agent'),
  noPermissionRemoveAgent: (message: string) =>
    i18n.translate('wz-endpoints-summary.errors.noPermissionRemoveAgent', {
      defaultMessage: 'No permissions to remove this agent. {message}',
      values: { message },
    }),
  removeAgentWarning: t(
    'modals.removeAgentWarning',
    'If the selected agent is still active and auto-enrollment is enabled, they will automatically register again after deletion.',
  ),
  couldNotGetAgentsInfo: t(
    'errors.couldNotGetAgentsInfo',
    'Could not get agents info',
  ),
  goToEndpointSummary: t(
    'agent.goToEndpointSummary',
    'go to Endpoint summary',
  ),
  couldNotSaveAgentsGroups: t(
    'errors.couldNotSaveAgentsGroups',
    'Could not save agents groups',
  ),
  noPermissionModifyGroups: (message: string) =>
    i18n.translate('wz-endpoints-summary.errors.noPermissionModifyGroups', {
      defaultMessage:
        'No permissions to modify groups for one or more selected agents. {message}',
      values: { message },
    }),
  selectAgentOrReturn: t(
    'agent.selectAgentOrReturn',
    'You need to select an agent or return to',
  ),
  endpointSummaryLink: t('agent.endpointSummaryLink', 'Endpoint summary'),
  deployWizard: {
    backToEndpoints: t('deployWizard.backToEndpoints', 'Back to Endpoints'),
    backAriaLabel: t('deployWizard.backAriaLabel', 'Back'),
    stepSelectPackage: t(
      'deployWizard.stepSelectPackage',
      'Select the package to download and install on your system:',
    ),
    stepServerAddressTitle: t('deployWizard.stepServerAddressTitle', 'Server address:'),
    stepPassword: t('deployWizard.stepPassword', 'Password'),
    passwordRequiredPrefix: t(
      'deployWizard.passwordRequiredPrefix',
      "The password is required but wasn't defined. Please check our",
    ),
    documentation: t('deployWizard.documentation', 'documentation'),
    missingPasswordPermissionTitle: t(
      'deployWizard.missingPasswordPermissionTitle',
      'Missing permission to read the registration password',
    ),
    missingPasswordPermissionBody: (permission: string) =>
      i18n.translate(
        'wz-endpoints-summary.deployWizard.missingPasswordPermissionBody',
        {
          defaultMessage: 'Require {permission} permission.',
          values: { permission },
        },
      ),
    stepOptionalSettingsTitle: t(
      'deployWizard.stepOptionalSettingsTitle',
      'Optional settings:',
    ),
    stepInstallCommands: t(
      'deployWizard.stepInstallCommands',
      'Run the following commands to download and install the agent:',
    ),
    deploymentCommandsHiddenTitle: t(
      'deployWizard.deploymentCommandsHiddenTitle',
      'Deployment commands hidden',
    ),
    deploymentCommandsHiddenBody: t(
      'deployWizard.deploymentCommandsHiddenBody',
      'Missing permissions to read the manager configuration required to view the deployment commands.',
    ),
    pleaseSelectSteps: (steps: string) =>
      i18n.translate('wz-endpoints-summary.deployWizard.pleaseSelectSteps', {
        defaultMessage: 'Please select the {steps}.',
        values: { steps },
      }),
    fieldsWithErrors: (fields: string) =>
      i18n.translate('wz-endpoints-summary.deployWizard.fieldsWithErrors', {
        defaultMessage:
          'There are fields with errors. Please verify them: {fields}.',
        values: { fields },
      }),
    stepStartAgent: t('deployWizard.stepStartAgent', 'Start the agent:'),
    startCommandHiddenTitle: t(
      'deployWizard.startCommandHiddenTitle',
      'Start command hidden',
    ),
    startCommandHiddenBody: t(
      'deployWizard.startCommandHiddenBody',
      'Missing permissions to read the manager configuration required to view the start command.',
    ),
    stepVerifyConnection: t(
      'deployWizard.stepVerifyConnection',
      'Go to endpoints to verify the agent connection:',
    ),
    backToAgentList: t('deployWizard.backToAgentList', 'Back to agent list'),
    openBreadcrumb: (label: string) =>
      i18n.translate('wz-endpoints-summary.deployWizard.openBreadcrumb', {
        defaultMessage: 'Open {label}',
        values: { label },
      }),
    stepConjunction: t('deployWizard.stepConjunction', ' and '),
    osLinux: t('deployWizard.osLinux', 'LINUX'),
    osWindows: t('deployWizard.osWindows', 'WINDOWS'),
    osMacos: t('deployWizard.osMacos', 'macOS'),
    serverAddressSubtitle: t(
      'deployWizard.serverAddressSubtitle',
      'This is the address the agent uses to communicate with the server. Enter an IP address or a fully qualified domain name (FQDN).',
    ),
    optionalSettingsSubtitle: t(
      'deployWizard.optionalSettingsSubtitle',
      'By default, the deployment uses the hostname as the agent name. Optionally, you can use a different agent name in the field below.',
    ),
    learnAbout: t('deployWizard.learnAbout', 'Learn about'),
    serverAddressLink: t('deployWizard.serverAddressLink', 'Server address.'),
    assignServerAddress: t(
      'deployWizard.assignServerAddress',
      'Assign a server address',
    ),
    serverAddressPlaceholder: t(
      'deployWizard.serverAddressPlaceholder',
      'Server address',
    ),
    rememberServerAddress: t(
      'deployWizard.rememberServerAddress',
      'Remember server address',
    ),
    errorSavingServerAddress: t(
      'deployWizard.errorSavingServerAddress',
      'Error saving server address configuration',
    ),
    assigningAgentNameLink: t(
      'deployWizard.assigningAgentNameLink',
      'Assigning an agent name.',
    ),
    assignAgentName: t('deployWizard.assignAgentName', 'Assign an agent name:'),
    agentNamePlaceholder: t('deployWizard.agentNamePlaceholder', 'Agent name'),
    agentNameUniqueWarning: t(
      'deployWizard.agentNameUniqueWarning',
      "The agent name must be unique. It can't be changed once the agent has been enrolled.",
    ),
    selectGroupLink: t('deployWizard.selectGroupLink', 'Select a group.'),
    selectExistingGroups: t(
      'deployWizard.selectExistingGroups',
      'Select one or more existing groups:',
    ),
    defaultGroupPlaceholder: t('deployWizard.defaultGroupPlaceholder', 'Default'),
    selectGroupPlaceholder: t(
      'deployWizard.selectGroupPlaceholder',
      'Select group',
    ),
    noGroupsInWizard: t(
      'deployWizard.noGroupsInWizard',
      'No groups available. Groups may not exist yet or there was an issue loading them.',
    ),
    copyCommand: t('deployWizard.copyCommand', 'Copy command'),
    showPassword: t('deployWizard.showPassword', 'Show password'),
    requirements: t('deployWizard.requirements', 'Requirements'),
    adminPrivileges: t(
      'deployWizard.adminPrivileges',
      'You will need administrator privileges to perform this installation.',
    ),
    powershellRequired: t(
      'deployWizard.powershellRequired',
      'PowerShell 3.0 or greater is required.',
    ),
    runInPowerShell: t(
      'deployWizard.runInPowerShell',
      'Keep in mind you need to run this command in a Windows PowerShell terminal.',
    ),
    bashRequired: t('deployWizard.bashRequired', 'Shell Bash is required.'),
    runInBash: t(
      'deployWizard.runInBash',
      'Keep in mind you need to run this command in a Shell Bash terminal.',
    ),
    additionalSystemsPrefix: t(
      'deployWizard.additionalSystemsPrefix',
      'For additional systems and architectures, please check our',
    ),
    stepFieldOperatingSystem: t(
      'deployWizard.stepFieldOperatingSystem',
      'operating system',
    ),
    stepFieldServerAddress: t(
      'deployWizard.stepFieldServerAddress',
      'server address',
    ),
    fieldAgentName: t('deployWizard.fieldAgentName', 'agent name'),
    fieldAgentGroups: t('deployWizard.fieldAgentGroups', 'agent groups'),
    validationMinLength: t(
      'deployWizard.validationMinLength',
      'The minimum length is 2 characters.',
    ),
    validationInvalidCharacter: (character: string) =>
      i18n.translate(
        'wz-endpoints-summary.deployWizard.validationInvalidCharacter',
        {
          defaultMessage:
            'The character "{character}" is not valid. Allowed characters are A-Z, a-z, 0-9, ".", "-", "_"',
          values: { character },
        },
      ),
    validationInvalidCharacters: (characters: string) =>
      i18n.translate(
        'wz-endpoints-summary.deployWizard.validationInvalidCharacters',
        {
          defaultMessage:
            'The characters "{characters}" are not valid. Allowed characters are A-Z, a-z, 0-9, ".", "-", "_"',
          values: { characters },
        },
      ),
  },
};
