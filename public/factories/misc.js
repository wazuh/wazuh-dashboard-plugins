/*
 * Wazuh app - Factory to share common variables between controllers
 * 
 * Copyright (C) 2018 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import { uiModules } from 'ui/modules';

const app = uiModules.get('app/wazuh', []);

class WzMisc {
  constructor() {
    this.state = {
      apiIsDown: false,
      comeFromWizard: false,
      blankScreenError: false,
      lastRestart: null
    };
  }

  setApiIsDown(value) {
    this.state.apiIsDown = value;
  }

  getApiIsDown() {
    return this.state.apiIsDown;
  }

  setWizard(value) {
    this.state.comeFromWizard = value;
  }

  getWizard() {
    return this.state.comeFromWizard;
  }

  setBlankScr(value) {
    this.state.blankScreenError = value;
  }

  getBlankScr() {
    return this.state.blankScreenError;
  }

  setLastRestart(value) {
    this.state.lastRestart = value;
  }

  getLastRestart() {
    return this.state.lastRestart;
  }
}

app.service('wzMisc', WzMisc);
