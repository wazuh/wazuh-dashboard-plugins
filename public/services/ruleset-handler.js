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
  async sendRuleConfiguration(rule, content) {
    try {
      const result = await this.apiReq.request(
        'POST',
        `//${rule}/`,
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
        `//${decoder}/`,
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
        `/manager/files`,
        { content, path: `/etc/lists/${list}` }
      );
      return result;
    } catch (error) {
      return Promise.reject(error);
    }
  }
}
