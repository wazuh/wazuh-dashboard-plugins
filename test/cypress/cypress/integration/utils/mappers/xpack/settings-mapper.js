import {
  WAZUH_MENU_PAGE
} from '../../../pageobjects/xpack/wazuh-menu/wazuh-menu.page';

export const SETTINGS_MENU_LINKS = {
  'API configuration': WAZUH_MENU_PAGE['settingsApiConfigurationLink'],
  Modules: WAZUH_MENU_PAGE['settingsModulesLink'],
  'Sample data': WAZUH_MENU_PAGE['settingsSampleDataLink'],
  Configuration: WAZUH_MENU_PAGE['settingsConfigurationLink'],
  Logs: WAZUH_MENU_PAGE['settingsLogsLink'],
  Miscellaneous: WAZUH_MENU_PAGE['settingsMiscellaneousLink'],
  About: WAZUH_MENU_PAGE['settingsAboutLink'],
};
