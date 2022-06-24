/*
 * Wazuh app - Settings controller
 * Copyright (C) 2015-2022 Wazuh, Inc.
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
import { updateSelectedToolsSection } from '../../redux/actions/appStateActions';
import {
  UI_ERROR_SEVERITIES,
  UIErrorLog,
  UIErrorSeverity,
  UILogLevel,
} from '../../react-services/error-orchestrator/types';
import { UI_LOGGER_LEVELS } from '../../../common/constants';
import { getErrorOrchestrator } from '../../react-services/common-services';

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

    this.tab = $location.$$search.tab;
    this.load = true;
    this.tabNames = TabNames;
  }

  /**
   * On controller loads
   */
  async $onInit() {
    try {
      const location = this.$location.search();
      if (location && location.tab) {
        this.tab = location.tab;
      }
      // Set component props
      this.setComponentProps();

      this.load = false;

      this.switchTab(this.tab);
      const breadcrumb = [
        { text: '' },
        { text: this.tab === 'devTools' ? 'API Console' : 'Ruleset Test' },
      ];
      store.dispatch(updateGlobalBreadcrumb(breadcrumb));
    } catch (error) {
      const options: UIErrorLog = {
        context: `${ToolsController.name}.$onInit`,
        level: UI_LOGGER_LEVELS.ERROR as UILogLevel,
        severity: UI_ERROR_SEVERITIES.BUSINESS as UIErrorSeverity,
        error: {
          error: error,
          message: error.message || error,
          title: error.name,
        },
      };
      getErrorOrchestrator().handleError(options);
    }
  }

  /**
   * Sets the component props
   */
  setComponentProps() {
    let tabs = [
      { id: 'devTools', name: 'API Console' },
      { id: 'logtest', name: 'Ruleset Test' },
    ];
    this.toolsTabsProps = {
      clickAction: (tab) => {
        this.switchTab(tab, true);
      },
      selectedTab: this.tab || 'devTools',
      tabs,
    };
  }

  /**
   * This switch to a selected tab
   * @param {Object} tab
   */
  switchTab(tab) {
    store.dispatch(updateSelectedToolsSection(tab));
    this.$location.search('tab', tab);
  }
}
