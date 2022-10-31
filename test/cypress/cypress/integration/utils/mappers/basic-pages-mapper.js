import { DEPLOY_NEW_AGENT_PAGE } from '../../pageobjects/basic/agents/deploy-new-agent.page';
import { AGENTS_PAGE } from '../../pageobjects/basic/agents/agents.page';
import { FILTERS_PAGE } from '../../pageobjects/basic/filters/filters.page';
import { OVERVIEW_PAGE } from '../../pageobjects/basic/overview/overview.page';
import { ABOUT_PAGE } from '../../pageobjects/basic/settings/about.page';
import { API_CONFIGURATION_PAGE } from '../../pageobjects/basic/settings/api-configuration.page';
import { CONFIGURATION_PAGE } from '../../pageobjects/basic/settings/configuration.page';
import { LOGS_PAGE } from '../../pageobjects/basic/settings/logs.page';
import { MISCELLANEOUS_PAGE } from '../../pageobjects/basic/settings/miscellaneous.page';
import { MODULES_PAGE } from '../../pageobjects/basic/settings/modules.page';
import { SAMPLE_DATA_PAGE } from '../../pageobjects/basic/settings/sample-data.page';
import { DECODERS_PAGE } from '../../pageobjects/basic/wazuh-menu/decoders.page';
import { RULES_PAGE } from '../../pageobjects/basic/wazuh-menu/rules.page';
import { WAZUH_MENU_PAGE } from '../../pageobjects/basic/wazuh-menu/wazuh-menu.page';
import { MODULES_DIRECTORY_PAGE } from '../../pageobjects/basic/modules-directory.page';
import { REPORTING_PAGE } from '../../pageobjects/wzd/reporting/report.page';

import { AGENT_MODULES } from './basic/agent-modules-mapper';
import { BASIC_MODULES } from './basic/basic-modules-mapper';
import { MODULES_CARDS, MODULES_SETTINGS } from './basic/modules-mapper';
import { SAMPLE_DATA } from './basic/sample-data-mapper';
import { SETTINGS_MENU_LINKS } from './basic/settings-mapper';
import { GROUPS_PAGE } from '../../pageobjects/xpack/wazuh-menu/groups.page';

export const BASIC_PAGES_MAPPER = {
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
