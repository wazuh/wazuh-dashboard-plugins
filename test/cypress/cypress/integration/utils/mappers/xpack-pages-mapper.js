import { DEPLOY_NEW_AGENT_PAGE } from '../../pageobjects/xpack/agents/deploy-new-agent.page';
import { AGENTS_PAGE } from '../../pageobjects/xpack/agents/agents.page';
import { FILTERS_PAGE } from '../../pageobjects/xpack/filters/filters.page';
import { OVERVIEW_PAGE } from '../../pageobjects/xpack/overview/overview.page';
import { ABOUT_PAGE } from '../../pageobjects/xpack/settings/about.page';
import { API_CONFIGURATION_PAGE } from '../../pageobjects/xpack/settings/api-configuration.page';
import { CONFIGURATION_PAGE } from '../../pageobjects/xpack/settings/configuration.page';
import { LOGS_PAGE } from '../../pageobjects/xpack/settings/logs.page';
import { MISCELLANEOUS_PAGE } from '../../pageobjects/xpack/settings/miscellaneous.page';
import { MODULES_PAGE } from '../../pageobjects/xpack/settings/modules.page';
import { SAMPLE_DATA_PAGE } from '../../pageobjects/xpack/settings/sample-data.page';
import { DECODERS_PAGE } from '../../pageobjects/xpack/wazuh-menu/decoders.page';
import { RULES_PAGE } from '../../pageobjects/xpack/wazuh-menu/rules.page';
import { WAZUH_MENU_PAGE } from '../../pageobjects/xpack/wazuh-menu/wazuh-menu.page';
import { MODULES_DIRECTORY_PAGE } from '../../pageobjects/xpack/modules-directory.page';
import { GROUPS_PAGE } from '../../pageobjects/xpack/wazuh-menu/groups.page';
import { AGENT_MODULES } from './xpack/agent-modules-mapper';
import { BASIC_MODULES } from './xpack/basic-modules-mapper';
import { MODULES_CARDS, MODULES_SETTINGS } from './xpack/modules-mapper';
import { SAMPLE_DATA } from './xpack/sample-data-mapper';
import { SETTINGS_MENU_LINKS } from './xpack/settings-mapper';
import { REPORTING_PAGE } from '../../pageobjects/wzd/reporting/report.page';


export const XPACK_PAGES_MAPPER = {
  DEPLOY_NEW_AGENT_PAGE,
  AGENTS_PAGE,
  FILTERS_PAGE,
  OVERVIEW_PAGE,
  ABOUT_PAGE,
  API_CONFIGURATION_PAGE,
  CONFIGURATION_PAGE,
  LOGS_PAGE,
  MISCELLANEOUS_PAGE,
  MODULES_PAGE,
  SAMPLE_DATA_PAGE,
  DECODERS_PAGE,
  RULES_PAGE,
  WAZUH_MENU_PAGE,
  MODULES_DIRECTORY_PAGE,
  REPORTING_PAGE,


  AGENT_MODULES,
  BASIC_MODULES,
  MODULES_CARDS,
  MODULES_SETTINGS,
  SAMPLE_DATA,
  SETTINGS_MENU_LINKS,
  GROUPS_PAGE
};
