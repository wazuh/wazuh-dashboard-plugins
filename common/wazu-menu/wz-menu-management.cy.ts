/*
 * Wazuh app - Wazuh Constants file for Cypress
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

export enum WAZUH_MENU_MANAGEMENT_SECTIONS_CY_TEST_ID {
  MANAGEMENT = 'menuManagementManagementLink',
  ADMINISTRATION = 'menuManagementAdministrationLink',
  RULESET = 'menuManagementRulesetLink',
  RULES = 'menuManagementRulesLink',
  DECODERS = 'menuManagementDecodersLink',
  CDB_LISTS = 'menuManagementCdbListsLink',
  GROUPS = 'menuManagementGroupsLink',
  CONFIGURATION = 'menuManagementConfigurationLink',
  STATUS_AND_REPORTS = 'menuManagementStatusReportsLink',
  STATUS = 'menuManagementStatusLink',
  CLUSTER = 'menuManagementMonitoringLink',
  LOGS = 'menuManagementLogsLink',
  REPORTING = 'menuManagementReportingLink',
  STATISTICS = 'menuManagementStatisticsLink',
}
