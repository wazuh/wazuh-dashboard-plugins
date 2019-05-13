/*
 * Wazuh app - Reporting service
 * Copyright (C) 2015-2019 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import $ from 'jquery';
import moment from 'moment';

export class ReportingService {
  constructor(
    $rootScope,
    vis2png,
    rawVisualizations,
    visHandlers,
    genericReq,
    errorHandler
  ) {
    this.$rootScope = $rootScope;
    this.vis2png = vis2png;
    this.rawVisualizations = rawVisualizations;
    this.visHandlers = visHandlers;
    this.genericReq = genericReq;
    this.errorHandler = errorHandler;
  }

  async startVis2Png(tab, isAgents = false, syscollectorFilters = null) {
    try {
      if (this.vis2png.isWorking()) {
        this.errorHandler.handle('Report in progress', 'Reporting', true);
        return;
      }
      this.$rootScope.reportBusy = true;
      this.$rootScope.reportStatus = 'Generating report...0%';
      this.$rootScope.$applyAsync();

      this.vis2png.clear();

      const idArray = this.rawVisualizations.getList().map(item => item.id);

      for (const item of idArray) {
        const tmpHTMLElement = $(`#${item}`);
        this.vis2png.assignHTMLItem(item, tmpHTMLElement);
      }

      const appliedFilters = this.visHandlers.getAppliedFilters(
        syscollectorFilters
      );

      const array = await this.vis2png.checkArray(idArray);
      const name = `wazuh-${
        isAgents ? 'agents' : 'overview'
        }-${tab}-${(Date.now() / 1000) | 0}.pdf`;

      const browserTimezone = moment.tz.guess(true);

      const data = {
        array,
        name,
        title: isAgents ? `Agents ${tab}` : `Overview ${tab}`,
        filters: appliedFilters.filters,
        time: appliedFilters.time,
        searchBar: appliedFilters.searchBar,
        tables: appliedFilters.tables,
        tab,
        section: isAgents ? 'agents' : 'overview',
        isAgents,
        browserTimezone
      };

      await this.genericReq.request('POST', '/reports', data);

      this.$rootScope.reportBusy = false;
      this.$rootScope.reportStatus = false;
      this.$rootScope.$applyAsync();
      this.errorHandler.info(
        'Success. Go to Wazuh > Management > Reporting',
        'Reporting'
      );

      return;
    } catch (error) {
      this.$rootScope.reportBusy = false;
      this.$rootScope.reportStatus = false;
      this.errorHandler.handle(error.message || error);
    }
  }

  async startConfigReport(agent) {
    try {
      this.$rootScope.reportBusy = true;
      this.$rootScope.reportStatus = 'Generating PDF document...';
      this.$rootScope.$applyAsync();

      const name = `wazuh-agent-${agent.id}-configuration-${(Date.now() /
        1000) |
        0}.pdf`;
      const browserTimezone = moment.tz.guess(true);

      const data = {
        configurations: [
          {
            title: 'Main configurations',
            sections: [
              {
                subtitle: 'Global configuration',
                desc: 'Logging settings that apply to the agent',
                config: [{ component: 'com', configuration: 'logging' }],
                labels: [
                  {
                    plain: 'Write internal logs in plain text',
                    json: 'Write internal logs in JSON format',
                    server: 'List of managers to connect'
                  }
                ]
              },
              {
                subtitle: 'Communication',
                desc: 'Settings related to the connection with the manager',
                config: [{ component: 'agent', configuration: 'client' }],
                labels: [
                  {
                    crypto_method: 'Method used to encrypt communications',
                    auto_restart:
                      'Auto-restart the agent when receiving valid configuration from manager',
                    notify_time:
                      'Time (in seconds) between agent checkings to the manager',
                    'time-reconnect':
                      'Time (in seconds) before attempting to reconnect',
                    server: 'List of managers to connect'
                  }
                ]
              },
              {
                subtitle: 'Anti-flooding settings',
                desc: 'Agent bucket parameters to avoid event flooding',
                config: [{ component: 'agent', configuration: 'buffer' }],
                labels: [
                  {
                    disabled: 'Buffer status',
                    queue_size: 'Queue size',
                    events_per_second: 'Events per second'
                  }
                ]
              },
              {
                subtitle: 'Labels',
                desc:
                  'User-defined information about the agent included in alerts',
                config: [{ component: 'agent', configuration: 'labels' }]
              }
            ]
          },
          {
            title: 'Auditing and policy monitoring',
            sections: [
              {
                subtitle: 'Policy monitoring',
                desc:
                  'Configuration to ensure compliance with security policies, standards and hardening guides',
                config: [{ component: 'syscheck', configuration: 'rootcheck' }],
                wodle: [{ name: 'sca' }],
                labels: {
                  system_audit: 'System audit'
                },
                tabs: ['General', 'SCA']
              },
              {
                subtitle: 'OpenSCAP',
                desc:
                  'Configuration assessment and automation of compliance monitoring using SCAP checks',
                wodle: [{ name: 'open-scap' }],
                labels: [
                  {
                    content: 'Evaluations'
                  }
                ]
              },
              {
                subtitle: 'CIS-CAT',
                desc:
                  'Configuration assessment using CIS scanner and SCAP checks',
                wodle: [{ name: 'cis-cat' }]
              }
            ]
          },
          {
            title: 'System threats and incident response',
            sections: [
              {
                subtitle: 'Osquery',
                desc:
                  'Expose an operating system as a high-performance relational database',
                wodle: [{ name: 'osquery' }]
              },
              {
                subtitle: 'Inventory data',
                desc:
                  'Gather relevant information about system OS, hardware, networking and packages',
                wodle: [{ name: 'syscollector' }]
              },
              {
                subtitle: 'Active response',
                desc: 'Active threat addressing by inmmediate response',
                config: [{ component: 'com', configuration: 'active-response' }]
              },
              {
                subtitle: 'Commands',
                desc: 'Configuration options of the Command wodle',
                wodle: [{ name: 'command' }]
              },
              {
                subtitle: 'Docker listener',
                desc:
                  'Monitor and collect the activity from Docker containers such as creation, running, starting, stopping or pausing events',
                wodle: [{ name: 'docker-listener' }]
              }
            ]
          },
          {
            title: 'Log data analysis',
            sections: [
              {
                subtitle: 'Log collection',
                desc:
                  'Log analysis from text files, Windows events or syslog outputs',
                config: [
                  { component: 'logcollector', configuration: 'localfile' },
                  { component: 'logcollector', configuration: 'socket' }
                ],
                options: { hideHeader: true }
              },
              {
                subtitle: 'Integrity monitoring',
                desc:
                  'Identify changes in content, permissions, ownership, and attributes of files',
                config: [{ component: 'syscheck', configuration: 'syscheck' }],
                tabs: ['General', 'Who data'],
                labels: [
                  {
                    directories: 'Monitored directories'
                  }
                ]
              }
            ]
          }
        ],
        array: [],
        name,
        title: 'agent congfg',
        filters: [{ agent: agent.id }],
        time: '',
        searchBar: '',
        tables: [],
        tab: 'agentConfig',
        browserTimezone
      };

      await this.genericReq.request('POST', '/reports', data);

      this.$rootScope.reportBusy = false;
      this.$rootScope.reportStatus = false;
      this.$rootScope.$applyAsync();
      this.errorHandler.info(
        'Success. Go to Wazuh > Management > Reporting',
        'Reporting'
      );

      return;
    } catch (error) {
      this.$rootScope.reportBusy = false;
      this.$rootScope.reportStatus = false;
      this.errorHandler.handle(error.message || error);
      this.$rootScope.$applyAsync();
    }
  }
}
