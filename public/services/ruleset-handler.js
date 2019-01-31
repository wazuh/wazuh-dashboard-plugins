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
  async getLocalRules() {
    try {
      const result = await this.apiReq.request(
        'GET',
        `/rules`,
        { path: '/var/ossec/etc/rules' }
      );
      return result;
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async getLocalDecoders() {
    try {
      const result = await this.apiReq.request(
        'GET',
        `/decoders`,
        { path: '/var/ossec/etc/decoders' }
      );
      return result;
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async getRuleConfiguration(path) {
    try {
      const result = await this.apiReq.request(
        'GET',
        `/manager/files`,
        { path: `etc/rules/${path}` }
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
        { path: `etc/decoders/${path}` }
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
        `/manager/files?path=etc/rules/${rule.file}`,
        { content, origin: 'xmleditor' }
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
        `/manager/files?path=etc/decoders/${decoder.file}`,
        { content, origin: 'xmleditor' }
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
        `/manager/files?path=etc/lists/${list}`,
        { content, origin: 'raw' }
      );
      return result;
    } catch (error) {
      return Promise.reject(error);
    }
  }
}
