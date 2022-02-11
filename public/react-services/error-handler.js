/*
 * Wazuh app - Error handler service
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import { getToasts }  from '../kibana-services';
import store from '../redux/store';
import { updateWazuhNotReadyYet } from '../redux/actions/appStateActions';
import { WzMisc } from '../factories/misc';
import { CheckDaemonsStatus } from './check-daemons-status';

const wzMisc = new WzMisc();
let history = [];
const filterHistoryTimeInMs = 2000;
const filterRecentHistory = date => history.filter(item => date - item.date <= filterHistoryTimeInMs);
const isErrorRecentlyShown = text => history.some(item => item.text === text)

export class ErrorHandler {
  /**
   * Extracts error message string from any kind of error.
   * @param {*} error
   */
  static extractMessage(error) {
    if ((error || {}).status === -1) {
      const origin = ((error || {}).config || {}).url || '';
      const isFromAPI =
        origin.includes('/api/request') ||
        origin.includes('/api/csv') ||
        origin.includes('/api/agents-unique');
      return isFromAPI
        ? 'Wazuh API is not reachable. Reason: timeout.'
        : 'Server did not respond';
    };
    if ((((error || {}).data || {}).errorData || {}).message){
      return error.data.errorData.message;
    };
    if (((error || {}).errorData || {}).message){
      return error.errorData.message;
    } ;
    if (typeof (error || {}).data === 'string'){
      return error.data;
    };
    if (typeof ((error || {}).data || {}).error === 'string'){
      return error.data.error;
    };
    if (typeof ((error || {}).data || {}).message === 'string'){
      return error.data.message;
    };
    if (typeof (((error || {}).data || {}).message || {}).msg === 'string'){
      return error.data.message.msg;
    };
    if (typeof ((error || {}).data || {}).data === 'string'){
      return error.data.data;
    };
    if (typeof error.message === 'string'){
      return error.message;
    };
    if (((error || {}).message || {}).msg){
      return error.message.msg;
    };
    if (typeof error === 'string'){
      return error
    };
    if (typeof error === 'object' && error !== null){
      return JSON.stringify(error)
    };
    return error || 'Unexpected error';
  }

  /**
   * Fires a green toast (success toast) using given message
   * @param {string} message The message to be shown
   * @param {string} location Usually means the file where this method was called
   */
  static info(message, location) {
    if (typeof message === 'string') {
      // Current date in milliseconds
      const date = new Date().getTime();

      // Remove errors older than 2s from the error history
      history = filterRecentHistory(date);

      // Check if the incoming error was already shown in the last two seconds
      const recentlyShown = isErrorRecentlyShown(message);

      if (!recentlyShown) {
        message = location ? `${location}. ${message}` : message;
        history.push({ text: message, date });
        getToasts().addSuccess(message);
      }
    }
  }

  /**
   * Fires a yellow toast (warning toast) using given message
   * @param {string} message The message to be shown
   * @param {string} location Usually means the file where this method was called
   */
  static warning(message, location) {
    if (typeof message === 'string') {
      // Current date in milliseconds
      const date = new Date().getTime();

      // Remove errors older than 2s from the error history
      history = filterRecentHistory(date);

      // Check if the incoming error was already shown in the last two seconds
      const recentlyShown = isErrorRecentlyShown(message);

      if (!recentlyShown) {
        message = location ? `${location}. ${message}` : message;
        history.push({ text: message, date });
        getToasts().addWarning(message);
      }
    }
  }

  /**
   * Main method to show error, warning or info messages
   * @param {*} error
   * @param {string} location Usually means the file where this method was called
   * @param {boolean} params If true, the toast is yellow
   * @param {boolean} [params.warning=false] If true, the toast is yellow
   * @param {boolean} [params.silent=false] If true, no message is shown
   */
  static handle(error, location, params = {warning: false, silent: false}) {
    const message = ErrorHandler.extractMessage(error);
    const messageIsString = typeof message === 'string';
    if (messageIsString && message.includes('ERROR3099')) {
      const updateNotReadyYet = updateWazuhNotReadyYet('Wazuh not ready yet.');
      store.dispatch(updateNotReadyYet);
      CheckDaemonsStatus.makePing().catch((error) => {});
      return;
    }

    const origin = ((error || {}).config || {}).url || '';
    const originIsString = typeof origin === 'string' && origin.length;

    if (wzMisc.getBlankScr()){
      params.silent = true
    };

    const hasOrigin = messageIsString && originIsString;

    let text = hasOrigin ? `${message} (${origin})` : message;

    if (error.extraMessage){
      text = error.extraMessage
    };

    text = location ? `${location}. ${text}` : text;

    // Current date in milliseconds
    const date = new Date().getTime();

    // Remove errors older than 2s from the error history
    history = filterRecentHistory(date);

    // Check if the incoming error was already shown in the last two seconds
    const recentlyShown = isErrorRecentlyShown(text);

    // If the incoming error was not shown in the last two seconds, add it to the history
    !recentlyShown && history.push({ text, date });

    // The error must be shown and the error was not shown in the last two seconds, then show the error
    if (!params.silent && !recentlyShown) {
      if (
        params.warning ||
        (text &&
          typeof text === 'string' &&
          text.toLowerCase().includes('no results'))
      ) {
        getToasts().addWarning(text);
      } else {
        getToasts().addDanger(text);
      }
    }
    return text;
  }
};
