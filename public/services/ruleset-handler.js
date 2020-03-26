/*
 * Wazuh app - Ruleset handler service
 * Copyright (C) 2015-2020 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import { ApiRequest } from "../react-services/api-request";

export class RulesetHandler {
  constructor() {
    this.apiReq = ApiRequest;
  }

  async getRules(filter = {}) {
    try {
      const result = await this.apiReq.request('GET', `/rules`, filter);
      return ((result || {}).data || {}).data || false;
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async getDecoders(filter = {}) {
    try {
      const result = await this.apiReq.request('GET', `/decoders`, filter);
      return ((result || {}).data || {}).data || false;
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async getLocalRules() {
    try {
      const result = await this.apiReq.request('GET', `/rules`, {
        path: 'etc/rules'
      });
      return ((result || {}).data || {}).data || false;
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async getLocalDecoders() {
    try {
      const result = await this.apiReq.request('GET', `/decoders`, {
        path: 'etc/decoders'
      });
      return ((result || {}).data || {}).data || false;
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async getRuleConfiguration(path, nolocal = false) {
    try {
      const _path = nolocal ? `ruleset/rules/${path}` : `etc/rules/${path}`;
      const result = await this.apiReq.request('GET', `/manager/files`, {
        path: _path
      });
      return ((result || {}).data || {}).data || false;
    } catch (error) {
      return Promise.reject(error);
    }
  }
  async getDecoderConfiguration(path, nolocal = false) {
    try {
      const _path = nolocal
        ? `ruleset/decoders/${path}`
        : `etc/decoders/${path}`;
      const result = await this.apiReq.request('GET', `/manager/files`, {
        path: _path
      });
      return ((result || {}).data || {}).data || false;
    } catch (error) {
      return Promise.reject(error);
    }
  }
  async getCdbList(path) {
    try {
      const result = await this.apiReq.request('GET', `/manager/files`, {
        path: path
      });
      return ((result || {}).data || {}).data || false;
    } catch (error) {
      return Promise.reject(error);
    }
  }
  async sendRuleConfiguration(rule, content, overwrite) {
    try {
      const result = await this.apiReq.request(
        'POST',
        `/manager/files?path=etc/rules/${rule.file ||
          rule}&overwrite=${!overwrite}`,
        { content, origin: 'xmleditor' }
      );
      return result;
    } catch (error) {
      return Promise.reject(error);
    }
  }
  async sendDecoderConfiguration(decoder, content, overwrite) {
    try {
      const result = await this.apiReq.request(
        'POST',
        `/manager/files?path=etc/decoders/${decoder.file ||
          decoder}&overwrite=${!overwrite}`,
        { content, origin: 'xmleditor' }
      );
      return result;
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async sendCdbList(list, content, overwrite) {
    try {
      const result = await this.apiReq.request(
        'POST',
        `/manager/files?path=etc/lists/${list}&overwrite=${!overwrite}`,
        { content, origin: 'raw' }
      );
      return result;
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async deleteFile(file, path) {
    let type;
    switch (path) {
      case '/rules/files':
        type = 'rules';
        break;
      case '/decoders/files':
        type = 'decoders';
        break;
      case '/lists/files':
        type = 'lists';
        break;
    }
    try {
      const result = await this.apiReq.request('DELETE', '/manager/files', {
        path: `${file.path}/${type !== 'lists' ? file.file : file.name}`
      });
      return result;
    } catch (error) {
      return Promise.reject(error);
    }
  }
}
