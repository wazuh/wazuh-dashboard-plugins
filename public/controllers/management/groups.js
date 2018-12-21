/*
 * Wazuh app - Management groups controller
 * Copyright (C) 2018 Wazuh, Inc.
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
  $rootScope,
  $scope,
  $location,
  apiReq,
  genericReq,
  errorHandler,
  csvReq,
  appState,
  shareAgent,
  $document,
  $timeout,
  wzTableFilter
) {
  $scope.$on('groupsIsReloaded', () => {
    $scope.currentGroup = false;
    $scope.lookingGroup = false;
    if (!$scope.$$phase) $scope.$digest();
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

      $scope.load = false;

      if (!$scope.$$phase) $scope.$digest();
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
      $scope.fileViewer = false;
      if (!$scope.$$phase) $scope.$digest();
    } catch (error) {
      errorHandler.handle(error, 'Groups');
    }
    return;
  };

  //listeners
  $scope.$on('wazuhShowGroup', (event, parameters) => {
    return $scope.loadGroup(parameters.group);
  });

  $scope.$on('wazuhShowGroupFile', (event, parameters) => {
    return $scope.showFile(parameters.groupName, parameters.fileName);
  });

  $scope.$on('updateGroupInformation', async (event, parameters) => {
    try {
      const result = await apiReq.request(
        'GET',
        `/agents/groups/${parameters.group}`,
        { limit: 1 }
      );
      $scope.currentGroup.count = result.data.data.totalItems;
      $scope.currentGroup.agents = result.data.data.items;
    } catch (error) {
      errorHandler.handle(error, 'Groups');
    }
    if (!$scope.$$phase) $scope.$digest();
    return;
  });

  /**
 * This navigate back to agents overview
 */
  $scope.goBackToAgents = () => {
    $scope.groupsSelectedTab = 'agents';
    $scope.file = false;
    $scope.filename = false;
    if (!$scope.$$phase) $scope.$digest();
  };

  /**
   * This navigate back to files
   */
  $scope.goBackFiles = () => {
    $scope.groupsSelectedTab = 'files';
    $scope.addingAgents = false;
    $scope.file = false;
    $scope.filename = false;
    $scope.fileViewer = false;
    if (!$scope.$$phase) $scope.$digest();
  };

  /**
   * This navigate back to groups
   */
  $scope.goBackGroups = () => {
    $scope.currentGroup = false;
    $scope.lookingGroup = false;
    if (!$scope.$$phase) $scope.$digest();
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

      if (!$scope.$$phase) $scope.$digest();
    } catch (error) {
      errorHandler.handle(error, 'Groups');
    }
    return;
  };

  $scope.editGroupAgentConfig = (group) => {
    $rootScope.$emit('editXmlFile', { 'target': group });
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
        await $scope.loadAllAgents(searchTerm, start);
      }
    } else {
      if (!$scope.selectedAgents.loadedAll) {
        $scope.multipleSelectorLoading = true;
        $scope.selectedAgents.offset += addOffset + 1;
        await $scope.loadSelectedAgents(searchTerm);
      }
    }
    $timeout(function () {
      $scope.multipleSelectorLoading = false;
    }, 100);
  }

  $scope.loadSelectedAgents = async (searchTerm) => {
    try {
      let params = { 'offset': !searchTerm ? $scope.selectedAgents.offset : 0 };
      if (searchTerm) {
        params.search = searchTerm;
      }
      const result = await apiReq.request('GET',
        `/agents/groups/${$scope.currentGroup.name}`,
        params);
      const mapped = result.data.data.items.map(function (item) {
        return { 'key': item.id, 'value': item.name };
      });
      if (searchTerm) {
        $scope.selectedAgents.data = mapped;
        $scope.selectedAgents.loadedAll = true;
      } else {
        $scope.selectedAgents.data = $scope.selectedAgents.data.concat(mapped);
      }
      if ($scope.selectedAgents.data.length === 0 || $scope.selectedAgents.data.length < 500) {
        $scope.selectedAgents.loadedAll = true;
      }
    } catch (error) {
      errorHandler.handle(error, 'Error fetching group agents');
    }
    $scope.selectedAgents.loaded = true;
  }

  $scope.loadAllAgents = async (searchTerm, start) => {
    try {
      let params = { 'offset': !searchTerm ? $scope.availableAgents.offset : 0 };
      if (searchTerm) {
        params.search = searchTerm;
        $scope.availableAgents.offset = 0;
      }
      const req = await apiReq.request('GET',
        '/agents/',
        params);
      $scope.totalAgents = req.data.data.totalItems;
      const mapped = req.data.data.items.filter(function (item) {
        return $scope.selectedAgents.data.filter(function (selected) {
          return selected.key == item.id;
        }).length == 0 && item.id !== '000';
      }).map(function (item) {
        return { 'key': item.id, 'value': item.name };
      });
      if (searchTerm || start) {
        $scope.availableAgents.data = mapped;
      } else {
        $scope.availableAgents.data = $scope.availableAgents.data.concat(mapped);
      }
      if ($scope.availableAgents.data.length === 0 && !searchTerm) {
        if ($scope.availableAgents.offset >= $scope.totalAgents) {
          $scope.availableAgents.loadedAll = true;
        }
        if (!$scope.availableAgents.loadedAll) {
          $scope.availableAgents.offset += 499;
          await $scope.loadAllAgents();
        }
      }
    } catch (error) {
      errorHandler.handle(error, 'Error fetching all available agents');
    }
  }

  $scope.addMultipleAgents = async (toggle) => {
    $scope.addingAgents = toggle;
    if (toggle && !$scope.availableAgents.loaded) {
      $scope.availableAgents = { 'loaded': false, 'data': [], 'offset': 0, 'loadedAll': false };
      $scope.selectedAgents = { 'loaded': false, 'data': [], 'offset': 0, 'loadedAll': false };
      $scope.multipleSelectorLoading = true;
      while (!$scope.selectedAgents.loadedAll) {
        await $scope.loadSelectedAgents();
        $scope.selectedAgents.offset += 499;
      }
      $scope.firstSelectedList = [...$scope.selectedAgents.data];
      await $scope.loadAllAgents();
      $timeout(function () {
        $scope.multipleSelectorLoading = false;
      }, 100);
    }
  };

  $scope.saveAddAgents = async (agents) => {
    const original = $scope.firstSelectedList;
    const modified = agents;
    $scope.deletedAgents = [];
    $scope.addedAgents = [];

    modified.forEach(function (mod) {
      if (original.filter(e => e.key === mod.key).length === 0) {
        $scope.addedAgents.push(mod);
      }
    });
    original.forEach(function (orig) {
      if (modified.filter(e => e.key === orig.key).length === 0) {
        $scope.deletedAgents.push(orig);
      }
    });

    const addedIds = $scope.addedAgents.map(x => x.key);
    const deletedIds = $scope.deletedAgents.map(x => x.key);
    const failedIds = [];

    try {
      $scope.multipleSelectorLoading = true;
      if (addedIds.length) {
        const addResponse = await apiReq.request('POST', `/agents/group/${$scope.currentGroup.name}`, { 'ids': addedIds });
        if (addResponse.data.failed_ids) {
          failedIds.push(...addResponse.data.data.failed_ids)
        }
      }
      if (deletedIds.length) {
        /* const deleteResponse = await apiReq.request('DELETE', `/agents/group/${$scope.currentGroup.name}`, { 'ids': deletedIds });
        if(deleteResponse.data.failed_ids){
          failedIds.push(...deleteResponse.data.data.failed_ids)
        } */
      }

      if (failedIds.length) {
        errorHandler.info(
          `Warning. Group has been updated but an error has occurred with the following agents ${failedIds}`,
          '', true
        );
      } else {
        errorHandler.info(
          'Success. Group has been updated',
          ''
        );
      }
      $scope.addMultipleAgents(false);
    } catch (err) {
      errorHandler.handle(err, 'Error applying changes');
    }
    $timeout(function () {
      $scope.multipleSelectorLoading = false;
    }, 100);
    console.log('Added: ' + $scope.addedAgents.map(x => x.key) + " - Deleted: " + $scope.deletedAgents.map(x => x.key));
  }

  // Resetting the factory configuration
  $scope.$on('$destroy', () => { });

  $scope.$watch('lookingGroup', value => {
    $scope.availableAgents = { 'loaded': false, 'data': [], 'offset': 0, 'loadedAll': false };
    $scope.selectedAgents = { 'loaded': false, 'data': [], 'offset': 0, 'loadedAll': false };
    $scope.addMultipleAgents(false);
    $rootScope.$emit('closeEditXmlFile', {});
    if (!value) {
      $scope.file = false;
      $scope.filename = false;
    }
  });
}
