/*
 * Wazuh app - Factory to store values from configuration file
 * Copyright (C) 2018 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
export class WazuhConfig {
  constructor() {
    this.config = {};
  }

  setConfig(cfg) {
    Object.assign(this.config, cfg);
  }

  getConfig() {
    return this.config;
  }
}
