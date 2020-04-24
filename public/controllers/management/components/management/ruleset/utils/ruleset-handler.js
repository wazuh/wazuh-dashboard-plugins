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

import { WzRequest } from '../../../../../../react-services/wz-request';

export default class RulesetHandler {
  /**
   * Get the information about a rule
   * @param {String} file
   * @param {Number} id
   */
  static async getRuleInformation(file, id) {
    try {
      const result = await WzRequest.apiReq('GET', `/rules`, {
        file
      });
      const info = ((result || {}).data || {}).data || false;
      if (info) Object.assign(info, { current: id }); //Assign the current rule ID to filter later in the component
      return info;
    } catch (error) {
      return Promise.reject(error);
    }
  }

  /**
   * Get the default about a decoder
   * @param {String} file
   */
  static async getDecoderInformation(file, name) {
    try {
      const result = await WzRequest.apiReq('GET', `/decoders`, {
        file
      });
      const info = ((result || {}).data || {}).data || false;
      if (info) Object.assign(info, { current: name });
      return info;
    } catch (error) {
      return Promise.reject(error);
    }
  }

  /**
   * Get the rules
   */
  static async getRules(filters = {}) {
    try {
      const result = await WzRequest.apiReq('GET', `/rules`, filters);
      return (((result || {}).data || {}).data || {}).items || false;
    } catch (error) {
      return Promise.reject(error);
    }
  }

  /**
   * Get the rules files
   */
  static async getRulesFiles(filters = {}) {
    try {
      const result = await WzRequest.apiReq('GET', `/rules/files`, filters);
      return (((result || {}).data || {}).data || {}).items || false;
    } catch (error) {
      return Promise.reject(error);
    }
  }

  /**
   * Get the CDB lists
   * @param {Object} filters
   */
  static async getLists(filters = {}) {
    try {
      const result = await WzRequest.apiReq('GET', `/lists/files`, filters);
      return (((result || {}).data || {}).data || {}).items || false;
    } catch (error) {
      return Promise.reject(error);
    }
  }

  /**
   * Get the decoders
   */
  static async getDecoders(filters = {}) {
    try {
      const result = await WzRequest.apiReq('GET', `/decoders`, filters);
      return (((result || {}).data || {}).data || {}).items || false;
    } catch (error) {
      return Promise.reject(error);
    }
  }

  /**
   * Get the decoder files
   */
  static async getDecodersFiles(filters = {}) {
    try {
      const result = await WzRequest.apiReq('GET', `/decoders/files`, filters);
      return (((result || {}).data || {}).data || {}).items || false;
    } catch (error) {
      return Promise.reject(error);
    }
  }

  /**
   * Get the local rules
   */
  static async getLocalRules() {
    try {
      const result = await WzRequest.apiReq('GET', `/rules`, {
        path: 'etc/rules'
      });
      return (((result || {}).data || {}).data || {}).items || false;
    } catch (error) {
      return Promise.reject(error);
    }
  }

  /**
   * Get the local decoders
   */
  static async getLocalDecoders() {
    try {
      const result = await WzRequest.apiReq('GET', `/decoders`, {
        path: 'etc/decoders'
      });
      return (((result || {}).data || {}).data || {}).items || false;
    } catch (error) {
      return Promise.reject(error);
    }
  }

  /**
   * Get the content of a rule file
   * @param {String} path
   * @param {Boolean} nolocal
   */
  static async getRuleContent(path, nolocal = true) {
    try {
      const _path = nolocal ? `ruleset/rules/${path}` : `etc/rules/${path}`;
      const result = await this.getFileContent(_path);
      return result;
    } catch (error) {
      return Promise.reject(error);
    }
  }

  /**
   * Get the content of a decoder file
   * @param {String} path
   * @param {Boolean} nolocal
   */
  static async getDecoderContent(path, nolocal = true) {
    try {
      const _path = nolocal
        ? `ruleset/decoders/${path}`
        : `etc/decoders/${path}`;
      const result = await this.getFileContent(_path);
      return result;
    } catch (error) {
      return Promise.reject(error);
    }
  }

  /**
   * Get the content of a CDB list
   * @param {String} path
   */
  static async getCdbList(path) {
    try {
      const result = await this.getFileContent(path);
      return result;
    } catch (error) {
      return Promise.reject(error);
    }
  }

  /**
   * Get the content of any type of file Rules, Decoders, CDB lists...
   * @param {String} path
   */
  static async getFileContent(path) {
    try {
      const result = await WzRequest.apiReq('GET', `/manager/files`, {
        path: path
      });
      return ((result || {}).data || {}).data || false;
    } catch (error) {
      return Promise.reject(error);
    }
  }

  /**
   * Send the rule content
   * @param {String} rule
   * @param {String} content
   * @param {Boolean} overwrite
   */
  static async sendRuleConfiguration(rule, content, overwrite) {
    try {
      const result = await WzRequest.apiReq(
        'POST',
        `/manager/files?path=etc/rules/${rule.file ||
          rule}&overwrite=${overwrite}`,
        { content, origin: 'xmleditor' }
      );
      return result;
    } catch (error) {
      return Promise.reject(error);
    }
  }

  /**
   * Send the decoders content
   * @param {String} decoder
   * @param {String} content
   * @param {Boolean} overwrite
   */
  static async sendDecoderConfiguration(decoder, content, overwrite) {
    try {
      const result = await WzRequest.apiReq(
        'POST',
        `/manager/files?path=etc/decoders/${decoder.file ||
          decoder}&overwrite=${overwrite}`,
        { content, origin: 'xmleditor' }
      );
      return result;
    } catch (error) {
      return Promise.reject(error);
    }
  }

  /**
   * Send the cdb list content
   * @param {String} list
   * @param {String} path
   * @param {String} content
   * @param {Boolean} overwrite
   */
  static async sendCdbList(list, path, content, overwrite) {
    try {
      const result = await WzRequest.apiReq(
        'POST',
        `/manager/files?path=${path}/${list}&overwrite=${overwrite}`,
        { content, origin: 'raw' }
      );
      return result;
    } catch (error) {
      return Promise.reject(error);
    }
  }

  static async uploadCdbList(list, content, overwrite) {
    try {
      const result = await WzRequest.apiReq(
        'POST',
        `/manager/files?path=etc/lists/${list}&overwrite=${!overwrite}`,
        { content, origin: 'raw' }
      );
      return result;
    } catch (error) {
      return Promise.reject(error);
    }
  }

  /**
   * Delete a file
   * @param {String} file
   * @param {String} path
   */
  static async deleteFile(file, path) {
    const fullPath = `${path}/${file}`;
    try {
      const result = await WzRequest.apiReq('DELETE', '/manager/files', {
        path: fullPath
      });
      return result;
    } catch (error) {
      return Promise.reject(error);
    }
  }
}
