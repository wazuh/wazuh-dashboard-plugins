/*
 * Wazuh app - Management logs controller
 * Copyright (C) 2015-2020 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

export class LogsController {
  /**
   * Class constructor
   * @param {*} $scope
   * @param {*} apiReq
   * @param {*} errorHandler
   * @param {*} csvReq
   * @param {*} appState
   * @param {*} wzTableFilter
   */
  constructor(
    $scope,
    apiReq
  ) {
    this.$scope = $scope;
    this.apiReq = apiReq;
  }

  /**
   * Initialize
   */
  $onInit() {
    this.logsProps = {
      wzReq: (method, path, body) => this.apiReq.request(method, path, body)
    }
  }
}
