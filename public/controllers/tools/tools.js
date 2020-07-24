/*
 * Wazuh app - Settings controller
 * Copyright (C) 2015-2020 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import { TabNames } from '../../utils/tab-names';
import store from '../../redux/store';
import { updateGlobalBreadcrumb } from '../../redux/actions/globalBreadcrumbActions';

export class ToolsController {
  /**
   * Class constructor
   * @param {*} $scope
   * @param {*} $window
   * @param {*} $location
   * @param {*} errorHandler
   */
  constructor($scope, $window, $location, errorHandler) {
    this.$scope = $scope;
    this.$window = $window;
    this.$location = $location;
    this.errorHandler = errorHandler;

    this.tab = 'devTools';
    this.load = true;
    this.tabNames = TabNames;
  }

  /**
   * On controller loads
   */
  async $onInit() {
    try {
      const breadcrumb = [{ text: '' }, { text: 'Dev Tools' }];
      store.dispatch(updateGlobalBreadcrumb(breadcrumb));
      this.switchTab('devTools'); 
      /*
      const location = this.$location.search();
      if (location && location.tab) {
        this.tab = location.tab;
      }
      // Set component props
       this.setComponentProps();
     */
      this.load = false;
    } catch (error) { }
  }

  /**
   * Sets the component props
   */
  setComponentProps() {
    let tabs = [
      { id: 'devTools', name: 'Dev Console' },
      { id: 'logtest', name: 'Logtest' }
    ];
    this.toolsTabsProps = {
      clickAction: tab => {
        this.switchTab(tab, true);
      },
      selectedTab: this.tab || 'devTools',
      tabs
    };
  }

  /**
   * This switch to a selected tab
   * @param {Object} tab
   */
  switchTab(tab) {
    this.tab = tab;
    this.$location.search('tab', this.tab);
  }
}