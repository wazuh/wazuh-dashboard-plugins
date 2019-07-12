/*
 * Wazuh app - Class for Wazuh-API-Elastic functions
 * Copyright (C) 2015-2019 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import { ElasticWrapper } from '../lib/elastic-wrapper';
import { ErrorResponse } from './error-response';
import { log } from '../logger';

const userRegEx = new RegExp(/^.{3,100}$/);
const passRegEx = new RegExp(/^.{3,100}$/);
const urlRegEx = new RegExp(/^https?:\/\/[a-zA-Z0-9-.]{1,300}$/);
const urlRegExIP = new RegExp(
  /^https?:\/\/[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$/
);
const portRegEx = new RegExp(/^[0-9]{2,5}$/);

export class WazuhApiElasticCtrl {
  /**
   * Constructor
   * @param {*} server
   */
  constructor(server) {
    this.wzWrapper = new ElasticWrapper(server);
  }

  /**
   * This check if connection and auth on an API is correct
   * @param {Object} payload
   */
  validateData(payload) {
    // Validate user
    if (!userRegEx.test(payload.user)) {
      return { code: 2006, message: 'Invalid user field' };
    }

    // Validate password
    if (!passRegEx.test(payload.password)) {
      return { code: 2007, message: 'Invalid password field' };
    }

    // Validate url
    if (!urlRegEx.test(payload.url) && !urlRegExIP.test(payload.url)) {
      return { code: 2008, message: 'Invalid url field' };
    }

    // Validate port
    const validatePort = parseInt(payload.port);
    if (
      !portRegEx.test(payload.port) ||
      validatePort <= 0 ||
      validatePort >= 99999
    ) {
      return { code: 2009, message: 'Invalid port field' };
    }

    return false;
  }

  /**
   * This build an setting API obect
   * @param {Object} payload
   */
  buildSettingsObject(payload) {
    return {
      api_user: payload.user,
      api_password: payload.password,
      url: payload.url,
      api_port: payload.port,
      insecure: payload.insecure,
      component: 'API',
      cluster_info: payload.cluster_info,
      extensions: payload.extensions
    };
  }

  /**
   * This update an API hostname
   * @param {Object} req
   * @param {Object} reply
   * Status response or ErrorResponse
   */
  async updateAPIHostname(req, reply) {
    try {
      await this.wzWrapper.updateWazuhIndexDocument(req, req.params.id, {
        doc: { cluster_info: req.payload.cluster_info }
      });
      log(
        'wazuh-api-elastic:updateAPIHostname',
        `API entry ${req.params.id} hostname updated`,
        'debug'
      );
      return { statusCode: 200, message: 'ok' };
    } catch (error) {
      log('wazuh-api-elastic:updateAPIHostname', error.message || error);
      return ErrorResponse(
        `Could not save data in elasticsearch due to ${error.message || error}`,
        2012,
        500,
        reply
      );
    }
  }

}
