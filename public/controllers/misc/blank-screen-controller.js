/*
 * Wazuh app - Blank screen controller
 * Copyright (C) 2015-2019 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
export class BlankScreenController {
  /**
   * Class constructor
   * @param {*} $scope
   * @param {*} $location
   * @param {*} errorHandler
   * @param {*} wzMisc
   */
  constructor($scope, $location, errorHandler, wzMisc) {
    this.$scope = $scope;
    this.$location = $location;
    this.errorHandler = errorHandler;
    this.wzMisc = wzMisc;
  }

  /**
   * When controller loads
   */
  $onInit() {
    const catchedError = this.wzMisc.getBlankScr();
    if (catchedError) {
      let parsed = null;
      try {
        parsed = this.errorHandler.handle(catchedError, '', false, true);
      } catch (error) {} // eslint-disable-line
      this.errorToShow = parsed || catchedError;
      this.wzMisc.setBlankScr(false);
      this.$scope.$applyAsync();
    }
  }

  /**
   * This navigate to overview
   */
  goOverview() {
    this.$location.path('/overview');
  }
}
