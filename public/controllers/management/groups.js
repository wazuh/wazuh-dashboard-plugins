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
import CodeMirror from '../../utils/codemirror/lib/codemirror';

export function GroupsController(
  $scope,
  $location,
  apiReq,
  errorHandler,
  csvReq,
  appState,
  shareAgent,
  $document,
  wzTableFilter,
  $timeout
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
    $scope.xmlCodeBox = CodeMirror.fromTextArea(
      $document[0].getElementById('xml_box'),
      {
        lineNumbers: true,
        matchClosing: true,
        matchBrackets: true,
        mode: 'text/xml',
        theme: 'ttcn',
        foldGutter: true,
        styleSelectedText: true,
        gutters: ['CodeMirror-foldgutter']
      }
    );
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

  const autoFormat = () => {
    var totalLines = $scope.xmlCodeBox.lineCount();
    var totalChars = $scope.xmlCodeBox.getTextArea().value.length;
    $scope.xmlCodeBox.autoFormatRange({ line: 0, ch: 0 }, { line: totalLines, ch: totalChars });
  }

  $scope.editGroupAgentConfig = (group, params) => {
    $timeout(function () { $scope.xmlCodeBox.refresh() });
    $scope.editingGroupAgentConfig = true;
    $scope.editingGroupAgentConfigItem = params.group;
    try {
      const xml = "<bookstore>\n<book>\n" +
        "<title>Everyday Italian</title>\n" +
        "<author>Giada De Laurentiis</author>\n" +
        "<year>2005</year>\n" +
        "</book>\n</bookstore>";
      $scope.xmlCodeBox.setValue(xml);
      autoFormat();
    } catch (error) {
      return false;
    }
  };
  $scope.$on('editGroupAgentConfig', (group, params) => $scope.editGroupAgentConfig(group, params));
  // Resetting the factory configuration
  $scope.$on('$destroy', () => { });

  $scope.$watch('lookingGroup', value => {
    if (!value) {
      $scope.file = false;
      $scope.filename = false;
    }
  });
}
