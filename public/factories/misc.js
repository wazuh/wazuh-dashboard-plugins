/*
 * Wazuh app - Factory to share common variables between controllers
 *
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
export class WzMisc {
  /**
   * Class constructor
   */
  constructor() {
    if (!!WzMisc.instance) {
      return WzMisc.instance;
    }
    this.state = {
      apiIsDown: false,
      comeFromWizard: false,
      blankScreenError: false,
      lastRestart: null
    };

    WzMisc.instance = this;
    return this;
  }

  /**
   * Set if api is down
   * @param {String} value
   */
  setApiIsDown(value) {
    this.state.apiIsDown = value;
  }

  /**
   * Get if api is down
   */
  getApiIsDown() {
    return this.state.apiIsDown;
  }

  /**
   * Set wizard
   * @param {String} value
   */
  setWizard(value) {
    this.state.comeFromWizard = value;
  }

  /**
   * Get wizard
   */
  getWizard() {
    return this.state.comeFromWizard;
  }

  /**
   * Set blank screen
   * @param {String} value
   */
  setBlankScr(value) {
    this.state.blankScreenError = value;
  }

  /**
   * Get blank screen
   */
  getBlankScr() {
    return this.state.blankScreenError;
  }

  /**
   * Set last restart
   * @param {String} value
   */
  setLastRestart(value) {
    this.state.lastRestart = value;
  }
}
