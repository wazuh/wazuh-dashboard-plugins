/*
 * Wazuh app - Ruleset handler service
 * Copyright (C) 2015-2019 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
export class RulesetHandler {
  constructor(apiReq) {
    this.apiReq = apiReq;
  }
  async getRuleConfiguration(path) {
    try {
      const result = await this.apiReq.request(
        'GET',
        `/manager/files`,
        { path: `/etc/rules/${path}`, format: 'xml' }
      );
      return ((result || {}).data || {}).data || false;
    } catch (error) {
      return Promise.reject(error);
    }
  }
  async getDecoderConfiguration(path) {
    try {
      const result = await this.apiReq.request(
        'GET',
        `/manager/files`,
        { path: `/etc/decoders/${path}`, format: 'xml' }
      );
      return ((result || {}).data || {}).data || false;
    } catch (error) {
      return Promise.reject(error);
    }
  }
  async getCdbList(path) {
    try {
      const result = await this.apiReq.request(
        'GET',
        `/manager/files`,
        { path: path }
      );
      return result;
    } catch (error) {
      return Promise.reject(error);
    }
  }
  async sendRuleConfiguration(rule, content) {
    try {
      const result = await this.apiReq.request(
        'POST',
        `/manager/files`,
        { content, path: "/etc/rules" }
      );
      return result;
    } catch (error) {
      return Promise.reject(error);
    }
  }
  async sendDecoderConfiguration(decoder, content) {
    try {
      const result = await this.apiReq.request(
        'POST',
        `/manager/files`,
        { content, path: "/etc/decoders" }
      );
      return result;
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async sendCdbList(list, content) {
    try {
      const result = await this.apiReq.request(
        'POST',
        `/manager/files`,
        { content, path: `/etc/lists/${list}` }
      );
      return result;
    } catch (error) {
      return Promise.reject(error);
    }
  }
}
