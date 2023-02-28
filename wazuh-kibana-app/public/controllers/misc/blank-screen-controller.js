/*
 * Wazuh app - Blank screen controller
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import { AppState } from '../../react-services/app-state';
import { ErrorHandler } from '../../react-services/error-handler';
import { WzMisc } from '../../factories/misc';
import { UI_ERROR_SEVERITIES } from '../../react-services/error-orchestrator/types';
import { UI_LOGGER_LEVELS } from '../../../common/constants';
import { getErrorOrchestrator } from '../../react-services/common-services';

export class BlankScreenController {
  /**
   * Class constructor
   * @param {*} $scope
   * @param {*} $location
   * @param {*} errorHandler
   */
  constructor($scope, $location, errorHandler) {
    this.$scope = $scope;
    this.$location = $location;
    this.errorHandler = errorHandler;
    this.wzMisc = new WzMisc();
    this.showErrorPage = false;
  }

  /**
   * When controller loads
   */
  $onInit() {
    AppState.setWzMenu();
    const catchedError = this.wzMisc.getBlankScr();
    if (catchedError) {
      let parsed = null;
      try {
        parsed = ErrorHandler.handle(catchedError, '',  { silent: true });
      } catch (error) {
        const options = {
          context: `${BlankScreenController.name}.$onInit`,
          level: UI_LOGGER_LEVELS.ERROR,
          severity: UI_ERROR_SEVERITIES.UI,
          error: {
            error: error,
            message: error.message || error,
            title: error.name,
          },
        };
        getErrorOrchestrator().handleError(options);
      }

      this.errorToShow = parsed || catchedError;
      this.$scope.$applyAsync();
      this.wzMisc.setBlankScr(false);
    } else {
      this.goOverview();
      return;
    }
    this.$scope.blankScreenProps = {
      errorToShow: this.errorToShow,
      goToOverview: () => this.goOverview()
    };
    this.showErrorPage = true;
    AppState.setWzMenu(false);
  }

  /**
   * This navigate to overview
   */
  goOverview() {
    this.$location.path('/overview');
  }
}
