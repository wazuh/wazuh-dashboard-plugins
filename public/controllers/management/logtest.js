/*
 * Wazuh app - Management edit ruleset configuration controller
 * Copyright (C) 2015-2019 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
export class LogtestController {
  /**
   * Constructor
   * @param {*} $scope
   * @param {*} $location
   * @param {*} errorHandler
   * @param {*} apiReq
   * @param {*} appState
   */
  constructor(
    $scope,
    $location,
    errorHandler,
    apiReq,
    appState
  ) {
    this.$scope = $scope;
    this.errorHandler = errorHandler;
    this.apiReq = apiReq;
    this.appState = appState;
    this.$location = $location;
    this.XMLContent = "hola"
  }

  /**
   * When controller loads
   */
  $onInit() {

    this.$scope.$broadcast('XMLContentReady', {
      data: this.XMLContent,
      logs: true
    });
    this.$scope.$applyAsync();

  }
}
