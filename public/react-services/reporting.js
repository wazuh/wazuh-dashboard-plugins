/*
 * Wazuh app - Reporting service
 * Copyright (C) 2015-2021 Wazuh, Inc.
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
import { WazuhConfig } from '../react-services/wazuh-config';
import { GenericRequest } from '../react-services/generic-request';
import { Vis2PNG } from '../factories/vis2png';
import { RawVisualizations } from '../factories/raw-visualizations';
import { VisHandlers } from '../factories/vis-handlers';
import { getToasts }  from '../kibana-services';
import { getAngularModule } from '../kibana-services';
const app = getAngularModule();

export class ReportingService {
  constructor() {
    this.$rootScope = app.$injector.get('$rootScope');
    this.vis2png = new Vis2PNG();
    this.rawVisualizations = new RawVisualizations();
    this.visHandlers = new VisHandlers();
    this.wazuhConfig = new WazuhConfig();
  }

  showToast = (color, title, text, time) => {
    getToasts().add({
      color: color,
      title: title,
      text: text,
      toastLifeTimeMs: time
    });
  };

  removeTableVis(visList) {
    const attributes = JSON.parse(visList.attributes.visState);
    return attributes.type !== 'table';
  }

  removeAgentStatusVis(idArray) {
    const monitoringEnabled = this.wazuhConfig.getConfig()[
      'wazuh.monitoring.enabled'
    ];
    if (!monitoringEnabled) {
      const visArray = idArray.filter(vis => {
        return vis !== 'Wazuh-App-Overview-General-Agents-status';
      });
      return visArray;
    }
    return idArray;
  }

  async startVis2Png(tab, agents = false, syscollectorFilters = null) {
    try {
      if (this.vis2png.isWorking()) {
        this.showToast('danger', 'Error', 'Report in progress', 4000);
        return;
      }
      this.$rootScope.reportBusy = true;
      this.$rootScope.reportStatus = 'Generating report...0%';
      this.$rootScope.$applyAsync();

      this.vis2png.clear();

      const rawVisualizations = this.rawVisualizations
        .getList()
        .filter(this.removeTableVis);

      let idArray = [];
      if (tab === 'general') {
        idArray = this.removeAgentStatusVis(
          rawVisualizations.map(item => item.id)
        );
      } else {
        idArray = rawVisualizations.map(item => item.id);
      }

      for (const item of idArray) {
        const tmpHTMLElement = $(`#${item}`);
        this.vis2png.assignHTMLItem(item, tmpHTMLElement);
      }

      const appliedFilters = await this.visHandlers.getAppliedFilters(
        syscollectorFilters
      );

      const array = await this.vis2png.checkArray(idArray);
      const name = `wazuh-${
        agents ?  `agent-${agents}` : 'overview'
      }-${tab}-${(Date.now() / 1000) | 0}.pdf`;

      const browserTimezone = moment.tz.guess(true);

      const data = {
        array,
        name,
        title: agents ? `Agents ${tab}` : `Overview ${tab}`,
        filters: appliedFilters.filters,
        time: appliedFilters.time,
        searchBar: appliedFilters.searchBar,
        tables: appliedFilters.tables,
        tab,
        section: agents ? 'agents' : 'overview',
        agents,
        browserTimezone
      };

      const apiEndpoint = tab === 'syscollector' ? `/reports/agents/${agents}/inventory` : `/reports/modules/${tab}`;
      await GenericRequest.request('POST', apiEndpoint, data);

      this.$rootScope.reportBusy = false;
      this.$rootScope.reportStatus = false;
      this.$rootScope.$applyAsync();
      this.showToast(
        'success',
        'Created report',
        'Success. Go to Wazuh > Management > Reporting',
        4000
      );
      return;
    } catch (error) {
      this.$rootScope.reportBusy = false;
      this.$rootScope.reportStatus = false;
      this.showToast('danger', 'Error', error.message || error, 4000);
    }
  }

  async startConfigReport(obj, type, components) {
    try {
      this.$rootScope.reportBusy = true;
      this.$rootScope.reportStatus = 'Generating PDF document...';
      this.$rootScope.$applyAsync();

      const docType =
        type === 'agentConfig'
          ? `wazuh-agent-${obj.id}`
          : `wazuh-group-${obj.name}`;

      const name = `${docType}-configuration-${(Date.now() / 1000) | 0}.pdf`;
      const browserTimezone = moment.tz.guess(true);

      const data = {
        name,
        filters: [
          type === 'agentConfig' ? { agent: obj.id } : { group: obj.name }
        ],
        tab: type,
        browserTimezone,
        components
      };
      const apiEndpoint = type === 'agentConfig' ? `/reports/agents/${obj.id}` : `/reports/groups/${obj.name}`;

      await GenericRequest.request('POST', apiEndpoint, data);

      this.$rootScope.reportBusy = false;
      this.$rootScope.reportStatus = false;
      this.$rootScope.$applyAsync();
      this.showToast(
        'success',
        'Created report',
        'Success. Go to Wazuh > Management > Reporting',
        4000
      );
      return;
    } catch (error) {
      this.$rootScope.reportBusy = false;
      this.$rootScope.reportStatus = false;
      this.showToast('danger', 'Error configuring report', error.message || error, 4000);
      this.$rootScope.$applyAsync();
    }
  }
}
