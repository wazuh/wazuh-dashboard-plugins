export const WAZUH_MENU_PAGE = {
  wazuhMenuLeft: '.wz-menu-left-side .wz-menu-sections',
  wazuhMenuRight: '.wz-menu-right-side',
  wazuhMenuSettingRight: '.wz-menu-right-side .WzManagementSideMenu',
  wazuhMenuButton: '[data-test-subj=menuWazuhButton]',
  //region Menu
  //region Menu
  modulesButton: '[data-test-subj=menuModulesButton]',
  managementButton: '[data-test-subj=menuManagementButton]',
  agentsButton: '[data-test-subj=menuAgentsButton]',
  toolsButton: '[data-test-subj=menuToolsButton]',
  securityButton: '[data-test-subj=menuSecurityButton]',
  settingsButton: '[data-test-subj=menuSettingsButton]',
  //endregion Menu
  //region SubMenu
  //region Modules
  //endregion Menu
  //region SubMenu
  //region Modules
  modulesDirectoryLink: '.wz-menu-right-side  div.euiFlexGroup > div > button > span > span',
  securityEventsLink: '[data-test-subj=menuModulesSecurityEventsLink]',
  integrityMonitoringLink: '[data-test-subj=menuModulesFimLink]',
  amazonAwsLink: '[data-test-subj=menuModulesAwsLink]',
  googleCloudPlatformLink: '[data-test-subj=menuModulesGcpLink]',
  policyMonitoringLink: '[data-test-subj=menuModulesPolicyMonitoringLink]',
  systemAuditingLink: '[data-test-subj=menuModulesAuditLink]',
  openScapLink: '[data-test-subj=menuModulesOpenScapLink]',
  cisCatLink: '[data-test-subj=menuModulesCiscatLink]',
  securityConfigurationAssessmentLink: '[data-test-subj=menuModulesScaLink]',
  vulnerabilitiesLink: '[data-test-subj=menuModulesVulsLink]',
  virusTotalLink: '[data-test-subj=menuModulesVirustotalLink]',
  osqueryLink: '[data-test-subj=menuModulesOsqueryLink]',
  dockerListenerLink: '[data-test-subj=menuModulesDockerLink]',
  mitreAttackLink: '[data-test-subj=menuModulesMitreLink]',
  pciDssLink: '[data-test-subj=menuModulesPciLink]',
  gdprLink: '[data-test-subj=menuModulesGdprLink]',
  hipaaLink: '[data-test-subj=menuModulesHipaaLink]',
  nistLink: '[data-test-subj=menuModulesNistLink]',
  tscLink: '[data-test-subj=menuModulesTscLink]',
  //endregion
  //region Management
  //endregion
  //region Management
  rulesLink: '[data-test-subj=menuManagementRulesLink]',
  decodersLink: '[data-test-subj=menuManagementDecodersLink]',
  cdbListLink: '[data-test-subj=menuManagementCdbListsLink]',
  groupsLink: '[data-test-subj=menuManagementGroupsLink]',
  configurationLink: '[data-test-subj=menuManagementConfigurationLink]',
  statusLink: '[data-test-subj=menuManagementStatusLink]',
  clusterLink: '[data-test-subj=menuManagementMonitoringLink]',
  statisticsLink: '[data-test-subj=menuManagementStatisticsLink]',
  logsLink: '[data-test-subj=menuManagementLogsLink]',
  reportingLink: '[data-test-subj=menuManagementReportingLink]',
  //endregion
  //region Tools
  //endregion
  //region Tools
  apiConsoleLink: '[data-test-subj=menuToolsDevToolsLink]',
  rulesetTestLink: '[data-test-subj=menuToolsLogtestLink]',
  //endregion
  //region Security
  //endregion
  //region Security
  usersLink: '[data-test-subj=menuSecurityUsersLink]',
  rolesLink: '[data-test-subj=menuSecurityRolesLink]',
  policiesLink: '[data-test-subj=menuSecurityPoliciesLink]',
  rolesMappingLink: '[data-test-subj=menuSecurityRoleMappingLink]',
  //endregion
  //region Settings
  //endregion
  //region Settings
  settingsApiConfigurationLink: '[data-test-subj=menuSettingsApiLink]',
  settingsModulesLink: '.wz-menu-right-side .WzManagementSideMenu [data-test-subj=menuSettingsModulesLink]',
  settingsSampleDataLink: '[data-test-subj=menuSettingsSampleDataLink]',
  settingsConfigurationLink: '[data-test-subj=menuSettingsConfigurationLink]',
  settingsLogsLink: '[data-test-subj=menuSettingsLogsLink]',
  settingsMiscellaneousLink: '[data-test-subj=menuSettingsMiscellaneousLink]',
  settingsAboutLink: '[data-test-subj=menuSettingsAboutLink]',
  //endregion
  //endregion
};
