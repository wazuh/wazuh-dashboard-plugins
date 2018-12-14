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

  $scope.search = term => {
    $scope.$broadcast('wazuhSearch', { term });
  };

  // Store a boolean variable to check if come from agents
  const globalAgent = shareAgent.getAgent();

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
          $scope.availableAgents = { 'loaded': false, 'data': [], 'offset': 0 };
          $scope.selectedAgents = { 'loaded': false, 'data': [], 'offset': 0 };
          $scope.searchBarModel = [];
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

  $scope.showAgent = agent => {
    shareAgent.setAgent(agent);
    $location.search('tab', null);
    $location.path('/agents');
  };

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

  $scope.goBackToAgents = () => {
    $scope.groupsSelectedTab = 'agents';
    $scope.file = false;
    $scope.filename = false;
    if (!$scope.$$phase) $scope.$digest();
  };

  $scope.goBackFiles = () => {
    $scope.groupsSelectedTab = 'files';
    $scope.file = false;
    $scope.filename = false;
    $scope.fileViewer = false;
    if (!$scope.$$phase) $scope.$digest();
  };

  $scope.goBackGroups = () => {
    $scope.currentGroup = false;
    $scope.lookingGroup = false;
    if (!$scope.$$phase) $scope.$digest();
  };

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

  $scope.loadSearchBarModel = async () => {
    const api = JSON.parse(appState.getCurrentAPI()).id;
    const clusterInfo = appState.getClusterInfo();
    const firstUrlParam =
      clusterInfo.status === 'enabled' ? 'cluster' : 'manager';
    const secondUrlParam = clusterInfo[firstUrlParam];

    const pattern = appState.getCurrentPattern();

    const data = await Promise.all([
      genericReq.request('GET', '/api/agents-unique/' + api, {}),
      genericReq.request(
        'GET',
        `/elastic/top/${firstUrlParam}/${secondUrlParam}/agent.name/${pattern}`
      )
    ]);
    const unique = data[0].data.result;
    $scope.searchBarModel = {
      'status': ['Active', 'Disconnected', 'Never connected'],
      'group': unique.groups,
      'node_name': unique.nodes,
      'version': unique.versions,
      'os.platform': unique.osPlatforms.map(x => x.platform),
      'os.version': unique.osPlatforms.map(x => x.version),
      'os.name': unique.osPlatforms.map(x => x.name),
    };
    $scope.searchBarModel['os.name'] = Array.from(new Set($scope.searchBarModel['os.name']));
    $scope.searchBarModel['os.version'] = Array.from(new Set($scope.searchBarModel['os.version']));
    $scope.searchBarModel['os.platform'] = Array.from(new Set($scope.searchBarModel['os.platform']));
  }

  $scope.reload = async (element, addOffset) => {
    $scope.multipleSelectorLoading = true;
    if (element === 'left') {
      $scope.availableAgents.offset += addOffset + 1;
      await $scope.loadAllAgents();
    } else {
      $scope.selectedAgents.offset += addOffset + 1;
      await $scope.loadSelectedAgents();
    }
    $timeout(function () {
      $scope.multipleSelectorLoading = false;
    }, 100);
  }

  $scope.loadSelectedAgents = async () => {
    try {
      const result = await apiReq.request('GET', `/agents/groups/${$scope.currentGroup.name}`, { offset: $scope.selectedAgents.offset });
      const mapped = result.data.data.items.map(function (item) {
        return { 'key': item.id, 'value': item.name };
      });
      $scope.selectedAgents.data = $scope.selectedAgents.data.concat(mapped);
    } catch (error) {
      errorHandler.handle(error, 'Error fetching group agents');
    }
    $scope.selectedAgents.loaded = true;
  }

  $scope.loadAllAgents = async () => {
    try {
      const req = await apiReq.request('GET', '/agents/', { offset: $scope.availableAgents.offset });
      const mapped = req.data.data.items.filter(function (item) {
        return $scope.selectedAgents.data.filter(function (selected) {
          return selected.key == item.id;
        }).length == 0 && item.id !== '000';
      }).map(function (item) {
        return { 'key': item.id, 'value': item.name };
      });
      $scope.availableAgents.data = $scope.availableAgents.data.concat(mapped);
    } catch (error) {
      errorHandler.handle(error, 'Error fetching all available agents');
    }
    $scope.availableAgents.loaded = true;
  }

  $scope.addMultipleAgents = async (toggle) => {
    $scope.addingAgents = toggle;
    if (toggle && !$scope.availableAgents.loaded) {
      //await $scope.loadSearchBarModel();
      $scope.multipleSelectorLoading = true;
      await $scope.loadSelectedAgents();
      await $scope.loadAllAgents();
      $timeout(function () {
        $scope.multipleSelectorLoading = false;
      }, 100);
    }
  };

  $scope.saveAddAgents = async (agents) => {
    alert('saved ' + agents);
  }

  // Resetting the factory configuration
  $scope.$on('$destroy', () => { });

  $scope.$watch('lookingGroup', value => {
    $scope.availableAgents = { 'loaded': false, 'data': [], 'offset': 0 };
    $scope.selectedAgents = { 'loaded': false, 'data': [], 'offset': 0 };
    $scope.addMultipleAgents(false);
    $rootScope.$emit('closeEditXmlFile', {});
    if (!value) {
      $scope.file = false;
      $scope.filename = false;
    }
  });
}
