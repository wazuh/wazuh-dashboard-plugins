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
import {
  UI_ERROR_SEVERITIES,
  UIErrorLog,
  UIErrorSeverity,
  UILogLevel,
} from '../../react-services/error-orchestrator/types';
import { UI_LOGGER_LEVELS } from '../../../common/constants';
import { getErrorOrchestrator } from '../../react-services/common-services';
import { devTools, rulesetTest } from '../../utils/applications';

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

      this.load = false;

      const breadcrumb = [
        {
          text:
            this.tab === 'devTools'
              ? devTools.breadcrumbLabel
              : rulesetTest.breadcrumbLabel,
        },
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
}
