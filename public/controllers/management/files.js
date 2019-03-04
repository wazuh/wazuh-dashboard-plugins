/*
 * Wazuh app - Ruleset controllers
 * Copyright (C) 2015-2019 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

export class FilesController {
  constructor($scope, wazuhConfig) {
    this.$scope = $scope;
    this.wazuhConfig = wazuhConfig;
    this.appliedFilters = [];
    this.searchTerm = '';
  }

  $onInit() {
    const configuration = this.wazuhConfig.getConfig();
    this.adminMode = !!(configuration || {}).admin;
    this.filesSubTab = 'rules';
  }

  switchFilesSubTab(tab) {
    this.filesSubTab = tab;
  }

  search(term) {
    this.$scope.$broadcast('wazuhSearch', { term, removeFilters: 0 });
  }
}
