/*
 * Wazuh app - Pattern handler service
 * Copyright (C) 2015-2020 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import { AppState } from "../react-services/app-state";
import { WzMisc } from "../factories/misc";

export class PatternHandler {
  /**
   * Class constructor
   * @param {*} $location
   * @param {*} genericReq
   * @param {*} appState
   * @param {*} errorHandler
   * @param {*} wzMisc
   */
  constructor($location, genericReq, appState, errorHandler) {
    this.$location = $location;
    this.genericReq = genericReq;
    this.appState = appState;
    this.errorHandler = errorHandler;
    this.wzMisc = new WzMisc();
  }

  /**
   * Get the available pattern list
   */
  async getPatternList() {
    try {
      const patternList = await this.genericReq.request(
        'GET',
        '/elastic/index-patterns',
        {}
      );

      if (!patternList.data.data.length) {
        this.$location.search('tab', null);
        if(!window.location.hash.includes('#/settings') && !window.location.hash.includes('#/blank-screen'))
          window.location.href = "/app/wazuh#/settings/";
        return;
      }

      if (AppState.getCurrentPattern()) {
        let filtered = patternList.data.data.filter(item =>
          item.id.includes(AppState.getCurrentPattern())
        );
        if (!filtered.length)
          AppState.setCurrentPattern(patternList.data.data[0].id);
      }

      return patternList.data.data;
    } catch (error) {
      this.errorHandler.handle(error, 'Pattern Handler (getPatternList)');
    }
    return;
  }

  /**
   * Change current pattern for the given pattern
   * @param {String} selectedPattern
   */
  async changePattern(selectedPattern) {
    try {
      AppState.setCurrentPattern(selectedPattern);
      await this.genericReq.request(
        'GET',
        `/elastic/known-fields/${selectedPattern}`,
        {}
      );
      return AppState.getCurrentPattern();
    } catch (error) {
      this.errorHandler.handle(error, 'Pattern Handler (changePattern)');
    }
    return;
  }
}
