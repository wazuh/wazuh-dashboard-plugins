/*
 * Wazuh app - Management groups controller
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import { WazuhConfig } from '../../react-services/wazuh-config';
import { WzRequest } from '../../react-services/wz-request';
import { ShareAgent } from '../../factories/share-agent';
import { GroupHandler } from '../../react-services/group-handler';
import { ErrorHandler } from '../../react-services/error-handler';
import { ReportingService } from '../../react-services/reporting';

export class GroupsController {
  constructor($scope, $location, errorHandler) {
    this.scope = $scope;
    this.location = $location;
    this.errorHandler = errorHandler;
    this.shareAgent = new ShareAgent();
    this.groupHandler = GroupHandler;
    this.wazuhConfig = new WazuhConfig();
    this.reportingService = new ReportingService();
  }

  async $onInit() {
    try {
      this.mctrl = this.scope.mctrl;
      this.addingGroup = false;
      this.load = false;
      await this.loadGroups();

      // Listeners

      // Resetting the factory configuration
      this.scope.$on('$destroy', () => { });

      this.scope.$watch('lookingGroup', value => {
        this.addingAgents = false;
        if (!value) {
          this.file = false;
          this.filename = false;
        }
      });

      // Props
      this.exportConfigurationProps = {
        exportConfiguration: enabledComponents =>
          this.exportConfiguration(enabledComponents),
        type: 'group'
      };

      this.filesInGroupTableProps = {
        exportConfigurationProps: this.exportConfigurationProps
      };

      return;
    } catch (error) {
      ErrorHandler.handle(error, 'Groups');
    }
  }

  /**
   * Loads the initial information
   */
  async loadGroups() {
    try {
      // If come from agents
      // Store a boolean variable to check if come from agents
      this.globalAgent = this.shareAgent.getAgent();
      if (this.globalAgent) {
        const globalGroup = this.shareAgent.getSelectedGroup();
        // Get ALL groups
        const data = await WzRequest.apiReq('GET', '/groups', {});
        const filtered = data.data.data.affected_items.filter(group => group.name === globalGroup);
        if (Array.isArray(filtered) && filtered.length) {
          // Load that our group
          this.buildGroupsTableProps(data.data.data.items, {
            group: filtered[0]
          });
        } else {
          throw Error(`Group ${globalGroup} not found`);
        }

        this.shareAgent.deleteAgent();
      } else {
        const loadedGroups = await WzRequest.apiReq('GET', '/groups', {});
        this.buildGroupsTableProps(loadedGroups.data.data.affected_items);
        this.load = false;
      }
      this.scope.$applyAsync();
    } catch (error) {
      return Promise.reject(error);
    }
  }

  toggle() {
    this.lookingGroup = true;
  }

  /**
   * This navigate to a selected agent
   * @param {Number} agentId
   */
  showAgent(agent) {
    this.shareAgent.setAgent(agent);
    this.location.search('tab', null);
    this.location.path('/agents');
    this.scope.$applyAsync();
  }

  /**
   *
   * @param {Object} enabledComponents
   */
  exportConfiguration(enabledComponents, group) {
    this.reportingService.startConfigReport(
      group,
      'groupConfig',
      enabledComponents
    );
  }

  async cancelButton() {
    this.mctrl.managementProps.groupsProps.closeAddingAgents = true;
    this.addingAgents = false;
  }

  switchAddingGroup() {
    this.addingGroup = !this.addingGroup;
  }

  buildGroupsTableProps(items, params = {}) {
    this.redirectGroup = params.group || false;
    this.groupsTableProps = {
      items,
      closeAddingAgents: false,
      showAddingAgents: (status, group) => {
        this.showAddingAgents(status, group);
      },
      exportConfigurationProps: {
        exportConfiguration: (enabledComponents, group) =>
          this.exportConfiguration(enabledComponents, group),
        type: 'group'
      },
      currentGroup: group => {
        this.currentGroup = group;
      },
      updateProps: () => {
        this.loadGroups();
      },
      showAgent: agent => {
        this.showAgent(agent);
      },
      selectedGroup: this.redirectGroup
    };
    this.mctrl.managementProps.groupsProps = this.groupsTableProps;
  }

  async showAddingAgents(status, group) {
    this.load = true;
    this.mctrl.managementProps.groupsProps.closeAddingAgents = false;
    this.currentGroup = group;
    this.lookingGroup = true;
    this.addingAgents = status;
    this.load = false;
    this.multipleAgentSelectorProps = {
      currentGroup: this.currentGroup,
      cancelButton: () => this.cancelButton(),
    };
    this.scope.$applyAsync();
  }
}
