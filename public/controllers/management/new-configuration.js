/*
 * Wazuh app - Management configuration controller
 * Copyright (C) 2018 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import { uiModules } from 'ui/modules';
import angular from 'angular';
import js2xmlparser from 'js2xmlparser';
import XMLBeautifier from '../../utils/xml-beautifier';
import beautifier from '../../utils/json-beautifier';

const app = uiModules.get('app/wazuh', []);

class NewConfigurationController {
  constructor($scope, errorHandler, apiReq) {
    this.$scope = $scope;
    this.errorHandler = errorHandler;
    this.apiReq = apiReq;
    this.$scope.load = true;
    this.$scope.isArray = Array.isArray;
    this.configRaw = {};
    this.$scope.currentConfig = {};

    this.$scope.configurationTab = '';
    this.$scope.configurationSubTab = '';

    this.$scope.getXML = name => this.getXML(name);
    this.$scope.getJSON = name => this.getJSON(name);
    this.$scope.switchConfigTab = configurationTab => this.switchConfigTab(configurationTab);
    this.$scope.switchConfigurationTab = configurationTab => this.switchConfigurationTab(configurationTab);
    this.$scope.switchConfigurationSubTab = configurationSubTab => this.switchConfigurationSubTab(configurationSubTab);
  }

  /**
   * Initialize
   */
  $onInit() {
    this.load();
  }

  fetchConfig(agentId,sections) {
    // this.$scope.currentConfig = await moduloJesus.fetch(agentId, sections);
    this.$scope.currentConfig = {
      'analysis-global' : {
        "global": {
          "email_notification": "no",
          "max_output_size": 0,
          "alerts_log": "yes",
          "zeromq_output": "no",
          "host_information": 8,
          "jsonout_output": "yes",
          "rotate_interval": 0,
          "rootkit_detection": 8,
          "integrity_checking": 8,
          "memory_size": 8192,
          "logall": "no",
          "prelude_output": "no",
          "stats": 4,
          "white_list": [
            "127.0.0.1",
            "80.58.61.250",
            "80.58.61.254",
            "127.0.1.1",
            "localhost.localdomain"
          ],
          "logall_json": "no"
        }
      },
      'request-remote': {
        "remote": [
        {
          "queue_size": "131072",
          "connection": "secure",
          "protocol": "udp",
          "port": "1514",
          "ipv6": "no"
        }
        ]
        }
      }
  }

  switchConfigTab(configurationTab, sections) {
    this.$scope.XMLContent = false;
    this.$scope.JSONContent = false;
    this.$scope.configurationSubTab = false;
    this.$scope.configurationTab = configurationTab;

    this.fetchConfig('000', sections);

    if (!this.$scope.$$phase) this.$scope.$digest();
  }

  /**
   * Switchs between configuration tabs
   * @param {*} configurationTab
   */
  switchConfigurationTab(configurationTab) {
    this.$scope.XMLContent = false;
    this.$scope.JSONContent = false;
    this.$scope.configurationSubTab = false;
    this.$scope.configurationTab = configurationTab;
    if (!this.$scope.$$phase) this.$scope.$digest();
  }

  /**
   * Switchs between configuration sub-tabs
   * @param {*} configurationSubTab
   */
  switchConfigurationSubTab(configurationSubTab) {
    this.$scope.XMLContent = false;
    this.$scope.JSONContent = false;
    this.$scope.configurationSubTab = configurationSubTab;
    if (!this.$scope.$$phase) this.$scope.$digest();
  }

  /**
   * Assigns XML raw content for specific configuration
   * @param {string} name Name of the configuration section
   */
  getXML(name) {
    this.$scope.JSONContent = false;
    if (this.$scope.XMLContent) {
      this.$scope.XMLContent = false;
    } else {
      try {
        if (name) {
          this.$scope.XMLContent = XMLBeautifier(
            js2xmlparser.parse(name, this.configRaw[name])
          );
        } else {
          this.$scope.XMLContent = XMLBeautifier(
            js2xmlparser.parse('configuration', this.configRaw)
          );
        }
      } catch (error) {
        this.$scope.XMLContent = false;
      }
    }
    if (!this.$scope.$$phase) this.$scope.$digest();
  }

  /**
   * Assigns JSON raw content for specific configuration
   * @param {string} name Name of the configuration section
   */
  getJSON(name) {
    this.$scope.XMLContent = false;
    if (this.$scope.JSONContent) {
      this.$scope.JSONContent = false;
    } else {
      try {
        if (name) {
          this.$scope.JSONContent = beautifier.prettyPrint(
            this.configRaw[name]
          );
        } else {
          this.$scope.JSONContent = beautifier.prettyPrint(this.configRaw);
        }
      } catch (error) {
        this.$scope.JSONContent = false;
      }
    }
    if (!this.$scope.$$phase) this.$scope.$digest();
  }

  /**
   * Fetchs required data
   */
  async load() {
    try {
      const data = await this.apiReq.request(
        'GET',
        '/manager/configuration',
        {}
      );
      Object.assign(this.configRaw, angular.copy(data.data.data));
      this.$scope.managerConfiguration = data.data.data;

      if (
        this.$scope.managerConfiguration &&
        this.$scope.managerConfiguration['active-response']
      ) {
        for (const ar of this.$scope.managerConfiguration['active-response']) {
          const rulesArray = ar.rules_id ? ar.rules_id.split(',') : [];
          if (ar.rules_id && rulesArray.length > 1) {
            const tmp = [];

            for (const id of rulesArray) {
              const rule = await this.apiReq.request('GET', `/rules/${id}`, {});
              tmp.push(rule.data.data.items[0]);
            }

            ar.rules = tmp;
          } else if (ar.rules_id) {
            const rule = await this.apiReq.request(
              'GET',
              `/rules/${ar.rules_id}`,
              {}
            );
            ar.rule = rule.data.data.items[0];
          }
        }
      }

      this.$scope.load = false;
      if (!this.$scope.$$phase) this.$scope.$digest();
      return;
    } catch (error) {
      this.errorHandler.handle(error, 'Manager');
    }
    return;
  }
}

app.controller(
  'managementNewConfigurationController',
  NewConfigurationController
);
