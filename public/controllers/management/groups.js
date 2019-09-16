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

export function GroupsController(
  $scope,
  $location,
  apiReq,
  errorHandler,
  csvReq,
  appState,
  shareAgent,
  groupHandler,
  wzTableFilter,
  wazuhConfig,
  reportingService
) {
  $scope.addingGroup = false;
  $scope.$on('groupsIsReloaded', () => {
    $scope.groupsSelectedTab = false;
    $scope.editingFile = false;
    $scope.currentGroup = false;
    $scope.$emit('removeCurrentGroup');
    $scope.lookingGroup = false;
    $scope.$applyAsync();
  });

  $scope.load = true;

  /**
   * Get full data on CSV format from a path
   * @param {String} data_path path with data to convert
   */
  $scope.downloadCsv = async data_path => {
    try {
      errorHandler.info('Your download should begin automatically...', 'CSV');
      const currentApi = JSON.parse(appState.getCurrentAPI()).id;
      const output = await csvReq.fetch(
        data_path,
        currentApi,
        wzTableFilter.get()
      );
      const blob = new Blob([output], { type: 'text/csv' }); // eslint-disable-line

      FileSaver.saveAs(blob, 'groups.csv');

      return;
    } catch (error) {
      errorHandler.handle(error, 'Download CSV');
    }
    return;
  };

  /**
   * This perfoms a search by a given term
   * @param {String} term
   */
  $scope.search = term => {
    $scope.$broadcast('wazuhSearch', { term });
  };

  // Store a boolean variable to check if come from agents
  const globalAgent = shareAgent.getAgent();

  /**
   * This load at init some required data
   */
  const load = async () => {
    try {
      // If come from agents
      if (globalAgent) {
        const globalGroup = shareAgent.getSelectedGroup();
        // Get ALL groups
        const data = await apiReq.request('GET', '/agents/groups/', {
          limit: 1000
        });

        const filtered = data.data.data.items.filter(
          group => group.name === globalGroup
        );

        if (Array.isArray(filtered) && filtered.length) {
          // Load that our group
          $scope.loadGroup(filtered[0], true);
          $scope.lookingGroup = true;
          $scope.addingAgents = false;
        } else {
          throw Error(`Group ${globalGroup} not found`);
        }

        shareAgent.deleteAgent();
      }

      const configuration = wazuhConfig.getConfig();
      $scope.adminMode = !!(configuration || {}).admin;
      $scope.load = false;

      $scope.$applyAsync();
    } catch (error) {
      errorHandler.handle(error, 'Groups');
    }
    return;
  };

  load();

  $scope.toggle = () => ($scope.lookingGroup = true);

  /**
   * This navigate to a selected agent
   */
  $scope.showAgent = agent => {
    shareAgent.setAgent(agent);
    $location.search('tab', null);
    $location.path('/agents');
  };

  /**
   * This load the group information to a given agent
   */
  $scope.loadGroup = async (group, firstTime) => {
    try {
      if (!firstTime) $scope.lookingGroup = true;
      const count = await apiReq.request(
        'GET',
        `/agents/groups/${group.name}/files`,
        { limit: 1 }
      );
      $scope.totalFiles = count.data.data.totalItems;
      $scope.fileViewer = false;
      $scope.currentGroup = group;
      $location.search('currentGroup', group.name);
      if ($location.search() && $location.search().navigation) {
        appState.setNavigation({ status: true });
        $location.search('navigation', null);
      }
      $scope.$emit('setCurrentGroup', { currentGroup: $scope.currentGroup });
      $scope.fileViewer = false;
      $scope.$applyAsync();
    } catch (error) {
      errorHandler.handle(error, 'Groups');
    }
    return;
  };

  //listeners
  $scope.$on('wazuhShowGroup', (ev, parameters) => {
    ev.stopPropagation();
    $scope.groupsSelectedTab = 'agents';
    return $scope.loadGroup(parameters.group);
  });

  $scope.$on('wazuhShowGroupFile', (ev, parameters) => {
    ev.stopPropagation();
    if (
      ((parameters || {}).fileName || '').includes('agent.conf') &&
      $scope.adminMode
    ) {
      return $scope.editGroupAgentConfig();
    }
    return $scope.showFile(parameters.groupName, parameters.fileName);
  });

  const updateGroupInformation = async (event, parameters) => {
    try {
      if ($scope.currentGroup) {
        const result = await Promise.all([
          await apiReq.request('GET', `/agents/groups/${parameters.group}`, {
            limit: 1
          }),
          await apiReq.request('GET', `/agents/groups`, {
            search: parameters.group
          })
        ]);

        const [count, sums] = result.map(
          item => ((item || {}).data || {}).data || false
        );
        const updatedGroup = ((sums || {}).items || []).find(
          item => item.name === parameters.group
        );

        $scope.currentGroup.count = (count || {}).totalItems || 0;
        if (updatedGroup) {
          $scope.currentGroup.configSum = updatedGroup.configSum;
          $scope.currentGroup.mergedSum = updatedGroup.mergedSum;
        }
      }
    } catch (error) {
      errorHandler.handle(error, 'Groups');
    }
    $scope.$applyAsync();
    return;
  };

  $scope.$on('updateGroupInformation', updateGroupInformation);

  /**
   * This navigate back to agents overview
   */
  $scope.goBackToAgents = () => {
    $scope.groupsSelectedTab = 'agents';
    $scope.file = false;
    $scope.filename = false;
    $scope.$applyAsync();
  };

  /**
   * This navigate back to files
   */
  $scope.goBackFiles = () => {
    $scope.groupsSelectedTab = 'files';
    $scope.addingAgents = false;
    $scope.editingFile = false;
    $scope.file = false;
    $scope.filename = false;
    $scope.fileViewer = false;
    $scope.$applyAsync();
  };

  /**
   * This navigate back to groups
   */
  $scope.goBackGroups = () => {
    $scope.currentGroup = false;
    $scope.$emit('removeCurrentGroup');
    $scope.lookingGroup = false;
    $scope.editingFile = false;
    $scope.$applyAsync();
  };

  $scope.exportConfiguration = enabledComponents => {
    reportingService.startConfigReport(
      $scope.currentGroup,
      'groupConfig',
      enabledComponents
    );
  };

  /**
   * This show us a group file, for a given group and file
   */
  $scope.showFile = async (groupName, fileName) => {
    try {
      if ($scope.filename) $scope.filename = '';
      if (fileName === '../ar.conf') fileName = 'ar.conf';
      $scope.fileViewer = true;
      const tmpName = `/agents/groups/${groupName}/files/${fileName}`;
      const data = await apiReq.request('GET', tmpName, {});
      $scope.file = beautifier.prettyPrint(data.data.data);
      $scope.filename = fileName;

      $scope.$applyAsync();
    } catch (error) {
      errorHandler.handle(error, 'Groups');
    }
    return;
  };

  const fetchFile = async () => {
    try {
      const data = await apiReq.request(
        'GET',
        `/agents/groups/${$scope.currentGroup.name}/files/agent.conf`,
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

  $scope.editGroupAgentConfig = async () => {
    $scope.editingFile = true;
    try {
      $scope.fetchedXML = await fetchFile();
      $location.search('editingFile', true);
      appState.setNavigation({ status: true });
      $scope.$broadcast('fetchedFile', { data: $scope.fetchedXML });
    } catch (error) {
      $scope.fetchedXML = null;
      errorHandler.handle(error, 'Fetch file error');
    }
    $scope.$applyAsync();
  };

  $scope.closeEditingFile = () => {
    $scope.editingFile = false;
    appState.setNavigation({ status: true });
    $scope.$broadcast('closeEditXmlFile', {});
    $scope.groupsTabsProps.selectedTab = 'files';
    $scope.$applyAsync();
  };

  $scope.xmlIsValid = valid => {
    $scope.xmlHasErrors = valid;
    $scope.$applyAsync();
  };

  $scope.doSaveGroupAgentConfig = () => {
    $scope.$broadcast('saveXmlFile', {
      group: $scope.currentGroup.name,
      type: 'group'
    });
  };

  $scope.reload = async (element, searchTerm, addOffset, start) => {
    if (element === 'left') {
      if (!$scope.availableAgents.loadedAll) {
        $scope.multipleSelectorLoading = true;
        if (start) {
          $scope.selectedAgents.offset = 0;
        } else {
          $scope.availableAgents.offset += addOffset + 1;
        }
        try {
          await loadAllAgents(searchTerm, start);
        } catch (error) {
          errorHandler.handle(error, 'Error fetching all available agents');
        }
      }
    } else {
      if (!$scope.selectedAgents.loadedAll) {
        $scope.multipleSelectorLoading = true;
        $scope.selectedAgents.offset += addOffset + 1;
        await $scope.loadSelectedAgents(searchTerm);
      }
    }

    $scope.multipleSelectorLoading = false;
    $scope.$applyAsync();
  };

  $scope.loadSelectedAgents = async searchTerm => {
    try {
      let params = {
        offset: !searchTerm ? $scope.selectedAgents.offset : 0,
        select: ['id', 'name']
      };
      if (searchTerm) {
        params.search = searchTerm;
      }
      const result = await apiReq.request(
        'GET',
        `/agents/groups/${$scope.currentGroup.name}`,
        params
      );
      $scope.totalSelectedAgents = result.data.data.totalItems;
      const mapped = result.data.data.items.map(item => {
        return { key: item.id, value: item.name };
      });
      if (searchTerm) {
        $scope.selectedAgents.data = mapped;
        $scope.selectedAgents.loadedAll = true;
      } else {
        $scope.selectedAgents.data = $scope.selectedAgents.data.concat(mapped);
      }
      if (
        $scope.selectedAgents.data.length === 0 ||
        $scope.selectedAgents.data.length < 500 ||
        $scope.selectedAgents.offset >= $scope.totalSelectedAgents
      ) {
        $scope.selectedAgents.loadedAll = true;
      }
    } catch (error) {
      errorHandler.handle(error, 'Error fetching group agents');
    }
    $scope.selectedAgents.loaded = true;
  };

  const loadAllAgents = async (searchTerm, start) => {
    try {
      const params = {
        limit: 500,
        offset: !searchTerm ? $scope.availableAgents.offset : 0,
        select: ['id', 'name']
      };

      if (searchTerm) {
        params.search = searchTerm;
        $scope.availableAgents.offset = 0;
      }

      const req = await apiReq.request('GET', '/agents/', params);

      $scope.totalAgents = req.data.data.totalItems;

      const mapped = req.data.data.items
        .filter(item => {
          return (
            $scope.selectedAgents.data.filter(selected => {
              return selected.key == item.id;
            }).length == 0 && item.id !== '000'
          );
        })
        .map(item => {
          return { key: item.id, value: item.name };
        });

      if (searchTerm || start) {
        $scope.availableAgents.data = mapped;
      } else {
        $scope.availableAgents.data = $scope.availableAgents.data.concat(
          mapped
        );
      }

      if ($scope.availableAgents.data.length < 10 && !searchTerm) {
        if ($scope.availableAgents.offset >= $scope.totalAgents) {
          $scope.availableAgents.loadedAll = true;
        }
        if (!$scope.availableAgents.loadedAll) {
          $scope.availableAgents.offset += 499;
          await loadAllAgents();
        }
      }
    } catch (error) {
      errorHandler.handle(error, 'Error fetching all available agents');
    }
  };

  $scope.addMultipleAgents = async toggle => {
    try {
      $scope.addingAgents = toggle;
      if (toggle && !$scope.availableAgents.loaded) {
        $scope.availableAgents = {
          loaded: false,
          data: [],
          offset: 0,
          loadedAll: false
        };
        $scope.selectedAgents = {
          loaded: false,
          data: [],
          offset: 0,
          loadedAll: false
        };
        $scope.multipleSelectorLoading = true;
        while (!$scope.selectedAgents.loadedAll) {
          await $scope.loadSelectedAgents();
          $scope.selectedAgents.offset += 499;
        }
        $scope.firstSelectedList = [...$scope.selectedAgents.data];
        await loadAllAgents();
        $scope.multipleSelectorLoading = false;
      }
    } catch (error) {
      errorHandler.handle(error, 'Error adding agents');
    }
    $scope.$applyAsync();
    return;
  };

  const getItemsToSave = () => {
    const original = $scope.firstSelectedList;
    const modified = $scope.selectedAgents.data;
    $scope.deletedAgents = [];
    $scope.addedAgents = [];

    modified.forEach(mod => {
      if (original.filter(e => e.key === mod.key).length === 0) {
        $scope.addedAgents.push(mod);
      }
    });
    original.forEach(orig => {
      if (modified.filter(e => e.key === orig.key).length === 0) {
        $scope.deletedAgents.push(orig);
      }
    });

    const addedIds = [...new Set($scope.addedAgents.map(x => x.key))];
    const deletedIds = [...new Set($scope.deletedAgents.map(x => x.key))];

    return { addedIds, deletedIds };
  };

  /**
   * Re-group the given array depending on the property provided as parameter.
   * @param {*} collection Array<object>
   * @param {*} property String
   */
  const groupBy = (collection, property) => {
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

  $scope.saveAddAgents = async () => {
    const itemsToSave = getItemsToSave();
    const failedIds = [];

    try {
      $scope.multipleSelectorLoading = true;
      if (itemsToSave.addedIds.length) {
        const addResponse = await apiReq.request(
          'POST',
          `/agents/group/${$scope.currentGroup.name}`,
          { ids: itemsToSave.addedIds }
        );
        if (addResponse.data.data.failed_ids) {
          failedIds.push(...addResponse.data.data.failed_ids);
        }
      }
      if (itemsToSave.deletedIds.length) {
        const deleteResponse = await apiReq.request(
          'DELETE',
          `/agents/group/${$scope.currentGroup.name}`,
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
        $scope.failedErrors = groupBy(failedErrors, 'message') || false;
        errorHandler.info(
          `Group has been updated but an error has occurred with ${failedIds.length} agents`,
          '',
          true
        );
      } else {
        errorHandler.info('Group has been updated');
      }
      $scope.addMultipleAgents(false);
      $scope.multipleSelectorLoading = false;
      await updateGroupInformation(null, {
        group: $scope.currentGroup.name
      });
    } catch (err) {
      $scope.multipleSelectorLoading = false;
      errorHandler.handle(err, 'Error applying changes');
    }
    $scope.$applyAsync();
    return;
  };

  $scope.clearFailedErrors = () => {
    $scope.failedErrors = false;
  };

  $scope.checkLimit = () => {
    if ($scope.firstSelectedList) {
      const itemsToSave = getItemsToSave();
      $scope.currentAdding = itemsToSave.addedIds.length;
      $scope.currentDeleting = itemsToSave.deletedIds.length;
      $scope.moreThan500 =
        $scope.currentAdding > 500 || $scope.currentDeleting > 500;
    }
  };

  // Resetting the factory configuration
  $scope.$on('$destroy', () => {});

  $scope.$watch('lookingGroup', value => {
    $scope.availableAgents = {
      loaded: false,
      data: [],
      offset: 0,
      loadedAll: false
    };
    $scope.selectedAgents = {
      loaded: false,
      data: [],
      offset: 0,
      loadedAll: false
    };
    $scope.addMultipleAgents(false);
    if (!value) {
      $scope.file = false;
      $scope.filename = false;
    }
  });

  $scope.switchAddingGroup = () => {
    $scope.addingGroup = !$scope.addingGroup;
  };

  $scope.createGroup = async name => {
    try {
      $scope.addingGroup = false;
      await groupHandler.createGroup(name);
      errorHandler.info(`Group ${name} has been created`);
    } catch (error) {
      errorHandler.handle(error.message || error);
    }
    $scope.$broadcast('wazuhSearch', {});
  };

  $scope.groupsTabsProps = {
    clickAction: tab => {
      if (tab === 'agents') {
        $scope.goBackToAgents();
      } else if (tab === 'files') {
        $scope.goBackFiles();
      }
    },
    selectedTab: $scope.groupsSelectedTab || 'agents',
    tabs: [{ id: 'agents', name: 'Agents' }, { id: 'files', name: 'Content' }]
  };

  // Come from the pencil icon on the groups table
  $scope.$on('openGroupFromList', (ev, parameters) => {
    $scope.editingFile = true;
    $scope.groupsSelectedTab = 'files';
    appState.setNavigation({ status: true });
    $location.search('navigation', true);
    return $scope
      .loadGroup(parameters.group)
      .then(() => $scope.editGroupAgentConfig());
  });
}
