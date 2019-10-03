/*
 * Wazuh app - Management groups controller
 * Copyright (C) 2015-2019 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import beautifier from '../../utils/json-beautifier';
import * as FileSaver from '../../services/file-saver';

export class GroupsController {
  constructor(
    $scope,
    $location,
    apiReq,
    errorHandler,
    csvReq,
    appState,
    shareAgent,
    groupHandler,
    wazuhConfig,
    reportingService
  ) {
    this.scope = $scope;
    this.location = $location;
    this.apiReq = apiReq;
    this.errorHandler = errorHandler;
    this.csvReq = csvReq;
    this.appState = appState;
    this.shareAgent = shareAgent;
    this.groupHandler = groupHandler;
    this.wazuhConfig = wazuhConfig;
    this.reportingService = reportingService;
  }

  async $onInit() {
    try {
      this.addingGroup = false;
      this.load = true;
      // Store a boolean variable to check if come from agents
      this.globalAgent = this.shareAgent.getAgent();

      await this.loadGroups();

      // Listeners
      this.scope.$on('groupsIsReloaded', async() => {
        await this.loadGroups();
        this.groupsSelectedTab = false;
        this.editingFile = false;
        this.currentGroup = false;
        this.scope.$emit('removeCurrentGroup');
        this.lookingGroup = false;
        this.scope.$applyAsync();
      });

      this.scope.$on('updateGroupInformation', this.updateGroupInformation());

      // Resetting the factory configuration
      this.scope.$on('$destroy', () => { console.log('destroy') });

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
        exportConfiguration: enabledComponents => this.exportConfiguration(enabledComponents),
        type: 'group'
      }

      this.groupsTabsProps = {
        clickAction: tab => {
          if (tab === 'agents') {
            this.goBackToAgents();
          } else if (tab === 'files') {
            this.goBackFiles();
          }
        },
        selectedTab: this.groupsSelectedTab || 'agents',
        tabs: [{ id: 'agents', name: 'Agents' }, { id: 'files', name: 'Content' }]
      };
      return;
    } catch (error) {
      this.errorHandler.handle(error, 'Groups');
    }
  };


  /**
   * Loads the initial information
   */
  async loadGroups() {
    try {
      // If come from agents
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
          this.loadGroup(filtered[0]);
          this.lookingGroup = true;
          this.addingAgents = false;
        } else {
          throw Error(`Group ${globalGroup} not found`);
        }

        this.shareAgent.deleteAgent();
      } else {
        const loadedGroups = await this.apiReq.request('GET', '/agents/groups/', {
          limit: 1000
        });
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

  /**
  * Get full data on CSV format from a path
  * @param {String} path path with data to convert
  */
  async downloadCsv(path) {
    try {
      this.errorHandler.info('Your download should begin automatically...', 'CSV');
      const currentApi = JSON.parse(this.appState.getCurrentAPI()).id;
      const output = await this.csvReq.fetch(
        path,
        currentApi,
        //this.wzTableFilter.get()//TODO solve the filter problems
      );
      const blob = new Blob([output], { type: 'text/csv' }); // eslint-disable-line

      FileSaver.saveAs(blob, 'groups.csv');

      return;
    } catch (error) {
      this.errorHandler.handle(error, 'Download CSV');
    }
    return;
  }

  /**
   * This perfoms a search by a given term
   * @param {String} term
   */
  search(term) {
    this.scope.$broadcast('wazuhSearch', { term });
  };


  toggle() {
    this.lookingGroup = true;
  }

  /**
   * This navigate to a selected agent
   * @param {Number} agentId
   */
  showAgent(agentId) {
    this.shareAgent.setAgent(agentId);
    this.location.search('tab', null);
    this.location.path('/agents');
  };

  /**
   * This load the group information to a given agent
   * @param {String} group
   */
  async loadGroup(group) {
    try {
      this.groupsSelectedTab = 'agents';
      this.lookingGroup = true;
      const count = await this.apiReq.request(
        'GET',
        `/agents/groups/${group.name}/files`,
        { limit: 1 }
      );
      this.totalFiles = count.data.data.totalItems;
      this.fileViewer = false;
      this.currentGroup = group;
      this.groupsSelectedTab = 'agents';
      this.location.search('currentGroup', group.name);
      if (this.location.search() && this.location.search().navigation) {
        this.appState.setNavigation({ status: true });
        this.location.search('navigation', null);
      }
      this.scope.$emit('setCurrentGroup', { currentGroup: this.currentGroup });
      this.fileViewer = false;
      this.load = false;
      this.globalAgent = false;
      this.scope.$applyAsync();
    } catch (error) {
      this.errorHandler.handle(error, 'Groups');
    }
    return;
  };


  /**
   * Updates the group information
   * @param {Object} event 
   * @param {Object} parameters 
   */
  async updateGroupInformation(event, parameters) {
    try {
      if (this.currentGroup) {
        const result = await Promise.all([
          await this.apiReq.request('GET', `/agents/groups/${parameters.group}`, {
            limit: 1
          }),
          await this.apiReq.request('GET', `/agents/groups`, {
            search: parameters.group
          })
        ]);

        const [count, sums] = result.map(
          item => ((item || {}).data || {}).data || false
        );
        const updatedGroup = ((sums || {}).items || []).find(
          item => item.name === parameters.group
        );

        this.currentGroup.count = (count || {}).totalItems || 0;
        if (updatedGroup) {
          this.currentGroup.configSum = updatedGroup.configSum;
          this.currentGroup.mergedSum = updatedGroup.mergedSum;
        }
      }
    } catch (error) {
      this.errorHandler.handle(error, 'Groups');
    }
    this.scope.$applyAsync();
    return;
  };

  /**
   * This navigate back to agents overview
   */
  goBackToAgents() {
    this.groupsSelectedTab = 'agents';
    this.file = false;
    this.filename = false;
    this.scope.$applyAsync();
  };

  /**
   * This navigate back to files
   */
  goBackFiles() {
    this.groupsSelectedTab = 'files';
    this.addingAgents = false;
    this.editingFile = false;
    this.file = false;
    this.filename = false;
    this.fileViewer = false;
    this.scope.$applyAsync();
  };

  /**
   * This navigate back to groups
   */
  goBackGroups() {
    this.currentGroup = false;
    this.scope.$emit('removeCurrentGroup');
    this.lookingGroup = false;
    this.editingFile = false;
    this.scope.$applyAsync();
  };

  /**
   * 
   * @param {Object} enabledComponents 
   */
  exportConfiguration(enabledComponents) {
    this.reportingService.startConfigReport(
      this.currentGroup,
      'groupConfig',
      enabledComponents
    );
  };

  /**
   * This show us a group file, for a given group and file
   *
   * @param {String} groupName
   * @param {String} fileName
   */
  async showFile(groupName, fileName) {
    try {
      if (this.filename) this.filename = '';
      if (fileName === '../ar.conf') fileName = 'ar.conf';
      this.fileViewer = true;
      const tmpName = `/agents/groups/${groupName}/files/${fileName}`;
      const data = await this.apiReq.request('GET', tmpName, {});
      this.file = beautifier.prettyPrint(data.data.data);
      this.filename = fileName;
      this.scope.$applyAsync();
    } catch (error) {
      this.errorHandler.handle(error, 'Groups');
    }
    return;
  };

  async fetchFile() {
    try {
      const data = await this.apiReq.request(
        'GET',
        `/agents/groups/${this.currentGroup.name}/files/agent.conf`,
        { format: 'xml' }
      );
      const xml = ((data || {}).data || {}).data || false;

      if (!xml) {
        throw new Error('Could not fetch agent.conf file');
      }
      return xml;
    } catch (error) {
      return Promise.reject(error);
    }
  };

  async editGroupAgentConfig() {
    this.editingFile = true;
    try {
      this.fetchedXML = await this.fetchFile();
      this.location.search('editingFile', true);
      this.appState.setNavigation({ status: true });
      this.scope.$broadcast('fetchedFile', { data: this.fetchedXML });
    } catch (error) {
      this.fetchedXML = null;
      this.errorHandler.handle(error, 'Fetch file error');
    }
    this.scope.$applyAsync();
  };

  closeEditingFile() {
    this.editingFile = false;
    this.appState.setNavigation({ status: true });
    this.scope.$broadcast('closeEditXmlFile', {});
    this.groupsTabsProps.selectedTab = 'files';
    this.scope.$applyAsync();
  };

  /**
   * Set if the XML is valid
   * @param {Boolean} valid 
   */
  xmlIsValid(valid) {
    this.xmlHasErrors = valid;
    this.scope.$applyAsync();
  };

  doSaveGroupAgentConfig() {
    this.scope.$broadcast('saveXmlFile', {
      group: this.currentGroup.name,
      type: 'group'
    });
  };


  async reload(element, searchTerm, addOffset, start) {
    if (element === 'left') {
      if (!this.availableAgents.loadedAll) {
        this.multipleSelectorLoading = true;
        if (start) {
          this.selectedAgents.offset = 0;
        } else {
          this.availableAgents.offset += addOffset + 1;
        }
        try {
          await this.loadAllAgents(searchTerm, start);
        } catch (error) {
          this.errorHandler.handle(error, 'Error fetching all available agents');
        }
      }
    } else {
      if (!this.selectedAgents.loadedAll) {
        this.multipleSelectorLoading = true;
        this.selectedAgents.offset += addOffset + 1;
        await this.loadSelectedAgents(searchTerm);
      }
    }

    this.multipleSelectorLoading = false;
    this.scope.$applyAsync();
  };

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
  };

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
        this.availableAgents.data = this.availableAgents.data.concat(
          mapped
        );
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
  };

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
  };

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
  };

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
  };

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
        this.failedErrors = groupBy(failedErrors, 'message') || false;
        errorHandler.info(
          `Group has been updated but an error has occurred with ${failedIds.length} agents`,
          '',
          true
        );
      } else {
        this.errorHandler.info('Group has been updated');
      }
      this.addMultipleAgents(false);
      this.multipleSelectorLoading = false;
      await this.updateGroupInformation(null, {
        group: this.currentGroup.name
      });
    } catch (err) {
      this.multipleSelectorLoading = false;
      this.errorHandler.handle(err, 'Error applying changes');
    }
    this.scope.$applyAsync();
    return;
  };

  clearFailedErrors() {
    this.failedErrors = false;
  };

  checkLimit() {
    if (this.firstSelectedList) {
      const itemsToSave = this.getItemsToSave();
      this.currentAdding = itemsToSave.addedIds.length;
      this.currentDeleting = itemsToSave.deletedIds.length;
      this.moreThan500 =
        this.currentAdding > 500 || this.currentDeleting > 500;
    }
  };

  switchAddingGroup() {
    this.addingGroup = !this.addingGroup;
  };


  async deleteGroup(group) {
    try {
      await this.groupHandler.removeGroup(group.name);
    } catch (error) {
      this.errorHandler.handle(error.message || error);
    }
  };


  buildGroupsTableProps(items) {
    this.groupsTableProps = {
      items,
      createGroup: async name => {
        await this.groupHandler.createGroup(name);
      },
      goGroup: group => {
        this.loadGroup(group);
      },
      editGroup: group => {
        this.openGroupFromList(group);
      },
      deleteGroup: group => {
        this.deleteGroup(group);
      },
      export: () => {
        this.downloadCsv('/agents/groups');
      },
      refresh: () => {
        this.loadGroups();
      }
    };
  };

  /**
   * When clicking in the pencil icon this open the config group editor
   * @param {Group} group 
   */
  openGroupFromList(group) {
    this.editingFile = true;
    this.groupsSelectedTab = 'files';
    this.appState.setNavigation({ status: true });
    this.location.search('navigation', true);
    return this.loadGroup(group).then(() => this.editGroupAgentConfig());
  };
}
