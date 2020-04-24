/*
 * Wazuh app - Management groups controller
 * Copyright (C) 2015-2020 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import { WazuhConfig } from '../../react-services/wazuh-config';
import { ApiRequest } from '../../react-services/api-request';
import { ShareAgent } from '../../factories/share-agent';
import { GroupHandler } from '../../react-services/group-handler';

export class GroupsController {
  constructor($scope, $location, errorHandler, reportingService) {
    this.scope = $scope;
    this.location = $location;
    this.apiReq = ApiRequest;
    this.errorHandler = errorHandler;
    this.shareAgent = new ShareAgent();
    this.groupHandler = GroupHandler;
    this.wazuhConfig = new WazuhConfig();
    this.reportingService = reportingService;
  }

  async $onInit() {
    try {
      this.mctrl = this.scope.mctrl;
      this.addingGroup = false;
      this.load = false;
      await this.loadGroups();

      // Listeners

      // Resetting the factory configuration
      this.scope.$on('$destroy', () => {});

      this.scope.$watch('lookingGroup', value => {
        this.availableAgents = {
          loaded: false,
          data: [],
          offset: 0,
          loadedAll: false
        };
        this.selectedAgents = {
          loaded: false,
          data: [],
          offset: 0,
          loadedAll: false
        };
        this.addMultipleAgents(false);
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
      this.errorHandler.handle(error, 'Groups');
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
        const data = await this.apiReq.request('GET', '/agents/groups/', {
          limit: 1000
        });
        const filtered = data.data.data.items.filter(
          group => group.name === globalGroup
        );
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
        const loadedGroups = await this.apiReq.request(
          'GET',
          '/agents/groups/',
          {
            limit: 1000
          }
        );
        this.buildGroupsTableProps(loadedGroups.data.data.items);
        const configuration = this.wazuhConfig.getConfig();
        this.adminMode = !!(configuration || {}).admin;
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

  async loadSelectedAgents(searchTerm) {
    try {
      let params = {
        offset: !searchTerm ? this.selectedAgents.offset : 0,
        select: ['id', 'name']
      };
      if (searchTerm) {
        params.search = searchTerm;
      }
      const result = await this.apiReq.request(
        'GET',
        `/agents/groups/${this.currentGroup.name}`,
        params
      );
      this.totalSelectedAgents = result.data.data.totalItems;
      const mapped = result.data.data.items.map(item => {
        return { key: item.id, value: item.name };
      });
      this.firstSelectedList = mapped;
      if (searchTerm) {
        this.selectedAgents.data = mapped;
        this.selectedAgents.loadedAll = true;
      } else {
        this.selectedAgents.data = this.selectedAgents.data.concat(mapped);
      }
      if (
        this.selectedAgents.data.length === 0 ||
        this.selectedAgents.data.length < 500 ||
        this.selectedAgents.offset >= this.totalSelectedAgents
      ) {
        this.selectedAgents.loadedAll = true;
      }
    } catch (error) {
      this.errorHandler.handle(error, 'Error fetching group agents');
    }
    this.selectedAgents.loaded = true;
  }

  async loadAllAgents(searchTerm, start) {
    try {
      const params = {
        limit: 500,
        offset: !searchTerm ? this.availableAgents.offset : 0,
        select: ['id', 'name']
      };

      if (searchTerm) {
        params.search = searchTerm;
        this.availableAgents.offset = 0;
      }

      const req = await this.apiReq.request('GET', '/agents/', params);

      this.totalAgents = req.data.data.totalItems;

      const mapped = req.data.data.items
        .filter(item => {
          return (
            this.selectedAgents.data.filter(selected => {
              return selected.key == item.id;
            }).length == 0 && item.id !== '000'
          );
        })
        .map(item => {
          return { key: item.id, value: item.name };
        });

      if (searchTerm || start) {
        this.availableAgents.data = mapped;
      } else {
        this.availableAgents.data = this.availableAgents.data.concat(mapped);
      }

      if (this.availableAgents.data.length < 10 && !searchTerm) {
        if (this.availableAgents.offset >= this.totalAgents) {
          this.availableAgents.loadedAll = true;
        }
        if (!this.availableAgents.loadedAll) {
          this.availableAgents.offset += 499;
          await this.loadAllAgents();
        }
      }
    } catch (error) {
      this.errorHandler.handle(error, 'Error fetching all available agents');
    }
  }

  async addMultipleAgents(toggle) {
    try {
      this.addingAgents = toggle;
      if (toggle && !this.availableAgents.loaded) {
        this.availableAgents = {
          loaded: false,
          data: [],
          offset: 0,
          loadedAll: false
        };
        this.selectedAgents = {
          loaded: false,
          data: [],
          offset: 0,
          loadedAll: false
        };
        this.multipleSelectorLoading = true;
        while (!this.selectedAgents.loadedAll) {
          await this.loadSelectedAgents();
          this.selectedAgents.offset += 499;
        }
        this.firstSelectedList = [...this.selectedAgents.data];
        await this.loadAllAgents();
        this.multipleSelectorLoading = false;
      }
    } catch (error) {
      this.errorHandler.handle(error, 'Error adding agents');
    }
    this.scope.$applyAsync();
    return;
  }

  async cancelButton() {
    this.mctrl.managementProps.groupsProps.closeAddingAgents = true;
    await this.addMultipleAgents(false);
  }

  getItemsToSave() {
    const original = this.firstSelectedList;
    const modified = this.selectedAgents.data;
    this.deletedAgents = [];
    this.addedAgents = [];

    modified.forEach(mod => {
      if (original.filter(e => e.key === mod.key).length === 0) {
        this.addedAgents.push(mod);
      }
    });
    original.forEach(orig => {
      if (modified.filter(e => e.key === orig.key).length === 0) {
        this.deletedAgents.push(orig);
      }
    });

    const addedIds = [...new Set(this.addedAgents.map(x => x.key))];
    const deletedIds = [...new Set(this.deletedAgents.map(x => x.key))];

    return { addedIds, deletedIds };
  }

  /**
   * Re-group the given array depending on the property provided as parameter.
   * @param {*} collection Array<object>
   * @param {*} property String
   */
  groupBy(collection, property) {
    try {
      const values = [];
      const result = [];

      for (const item of collection) {
        const index = values.indexOf(item[property]);
        if (index > -1) result[index].push(item);
        else {
          values.push(item[property]);
          result.push([item]);
        }
      }
      return result.length ? result : false;
    } catch (error) {
      return false;
    }
  }

  async saveAddAgents() {
    const itemsToSave = this.getItemsToSave();
    const failedIds = [];
    try {
      this.multipleSelectorLoading = true;
      if (itemsToSave.addedIds.length) {
        const addResponse = await this.apiReq.request(
          'POST',
          `/agents/group/${this.currentGroup.name}`,
          { ids: itemsToSave.addedIds }
        );
        if (addResponse.data.data.failed_ids) {
          failedIds.push(...addResponse.data.data.failed_ids);
        }
      }
      if (itemsToSave.deletedIds.length) {
        const deleteResponse = await this.apiReq.request(
          'DELETE',
          `/agents/group/${this.currentGroup.name}`,
          { ids: itemsToSave.deletedIds.toString() }
        );
        if (deleteResponse.data.data.failed_ids) {
          failedIds.push(...deleteResponse.data.data.failed_ids);
        }
      }

      if (failedIds.length) {
        const failedErrors = failedIds.map(item => ({
          id: (item || {}).id,
          message: ((item || {}).error || {}).message
        }));
        this.failedErrors = this.groupBy(failedErrors, 'message') || false;
        this.errorHandler.info(
          `Group has been updated but an error has occurred with ${failedIds.length} agents`,
          '',
          true
        );
      } else {
        this.errorHandler.info('Group has been updated');
      }
      // this.addMultipleAgents(false);
      this.multipleSelectorLoading = false;
      this.cancelButton();
    } catch (err) {
      this.multipleSelectorLoading = false;
      this.errorHandler.handle(err, 'Error applying changes');
    }
    this.scope.$applyAsync();
    return;
  }

  clearFailedErrors() {
    this.failedErrors = false;
  }

  checkLimit() {
    if (this.firstSelectedList) {
      const itemsToSave = this.getItemsToSave();
      this.currentAdding = itemsToSave.addedIds.length;
      this.currentDeleting = itemsToSave.deletedIds.length;
      this.moreThan500 = this.currentAdding > 500 || this.currentDeleting > 500;
    }
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
    await this.addMultipleAgents(status);
    this.load = false;
  }
}
