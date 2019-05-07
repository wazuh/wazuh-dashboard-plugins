/*
 * Wazuh app - Error handler service
 * Copyright (C) 2015-2019 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import { toastNotifications } from 'ui/notify';

/**
 * Override default behavior for notifications.
 * The purpose is to increase default lifetime for error/warning toasters
 */
import { GlobalToastList } from '../../../../src/core/public/notifications/toasts/global_toast_list';
import { ToastsService } from '../../../../src/core/public/notifications/toasts/toasts_service';
import { ToastsServicew } from './notifications/toasts_service';
import { GlobalToastListw } from './notifications/global_toast_list';
ToastsService.prototype.start = ToastsServicew.prototype.start;
GlobalToastList.prototype.render = GlobalToastListw.prototype.render;

export class ErrorHandler {
  /**
   * Constructor
   */
  constructor(wzMisc, $rootScope, checkDaemonsStatus) {
    this.wzMisc = wzMisc;
    this.$rootScope = $rootScope;
    this.checkDaemonsStatus = checkDaemonsStatus;
  }

  /**
   * Extracts error message string from any kind of error.
   * @param {*} error
   */
  extractMessage(error) {
    if ((error || {}).status === -1) {
      const origin = ((error || {}).config || {}).url || '';
      const isFromAPI =
        origin.includes('/api/request') ||
        origin.includes('/api/csv') ||
        origin.includes('/api/agents-unique');
      return isFromAPI
        ? "Wazuh API is not reachable. Reason: timeout."
        : 'Server did not respond';
    }
    if ((((error || {}).data || {}).errorData || {}).message)
      return error.data.errorData.message;
    if (((error || {}).errorData || {}).message) return error.errorData.message;
    if (typeof (error || {}).data === 'string') return error.data;
    if (typeof ((error || {}).data || {}).error === 'string')
      return error.data.error;
    if (typeof ((error || {}).data || {}).message === 'string')
      return error.data.message;
    if (typeof (((error || {}).data || {}).message || {}).msg === 'string')
      return error.data.message.msg;
    if (typeof ((error || {}).data || {}).data === 'string')
      return error.data.data;
    if (typeof error.message === 'string') return error.message;
    if (((error || {}).message || {}).msg) return error.message.msg;
    if (typeof error === 'string') return error;
    if (typeof error === 'object') return JSON.stringify(error);
    return error || 'Unexpected error';
  }

  /**
   * Fires a green toast (success toast) using given message
   * @param {string} message The message to be shown
   * @param {string} location Usually means the file where this method was called
   */
  info(message, location) {
    if (typeof message === 'string') {
      message = location ? location + '. ' + message : message;
      toastNotifications.addSuccess(message);
    }
    return;
  }

  /**
   * Main method to show error, warning or info messages
   * @param {*} error
   * @param {string} location Usually means the file where this method was called
   * @param {boolean} isWarning If true, the toast is yellow
   * @param {boolean} silent If true, no message is shown
   */
  handle(error, location, isWarning, silent) {
    const message = this.extractMessage(error);
    if (typeof message === 'string' && message.includes('ERROR3099')) {
      this.$rootScope.wazuhNotReadyYet = 'Wazuh not ready yet.';
      this.$rootScope.$applyAsync();
      this.checkDaemonsStatus.makePing();
      return;
    }
    const origin = ((error || {}).config || {}).url || '';

    if (this.wzMisc.getBlankScr()) silent = true;
    let text =
      typeof message === 'string' && typeof origin === 'string' && origin.length
        ? `${message} (${origin})`
        : message;
    if (error.extraMessage) text = error.extraMessage;
    text = location ? location + '. ' + text : text;
    if (!silent) {
      if (
        isWarning ||
        (text &&
          typeof text === 'string' &&
          text.toLowerCase().includes('no results'))
      ) {
        toastNotifications.addWarning(text);
      } else {
        toastNotifications.addDanger(text);
      }
    }
    return text;
  }
}
