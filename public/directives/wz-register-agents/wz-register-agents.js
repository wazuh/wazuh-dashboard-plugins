/*
 * Wazuh app - Wazuh XML file editor
 * Copyright (C) 2015-2019 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import template from './wz-register-agents.html';
import { uiModules } from 'ui/modules';

const app = uiModules.get('app/wazuh', []);

class WzRegisterAgents {
  /**
   * Class constructor
   */
  constructor() {
    this.template = template;
  }
  controller(
    $scope,
    $document,
    $location,
    appState,
    errorHandler,
    apiReq
  ) {
    const load = async () => {
      $scope.registerObj = {
        selectedSystem: 0,
        selectedSystemTab: 'linux',
        currentStep: 0,
        systems: [
          {
            /* linux */
            steps: [
              {
                title: 'Add the agent to the manager',
              },
              {
                title: 'Import the key to the agent',
                code: '# /var/ossec/bin/manage_agents -i '
              },
              {
                title: 'Edit the Wazuh agent configuration to add the Wazuh manager IP',
              },
              {
                title: 'Restart the agent'
              }
            ]
          },
          {
            /* windows */
            steps: [
              {
                title: 'Register the agent',
              }
            ]
          }
        ]
      };
    };
    load();

    $scope.nextStep = (type) => {
      type === 'linux' ?
        $scope.registerObj.currentStep++ : $scope.registerObj.windows.currentStep++;
    }
    $scope.addAgent = async () => {
      try {
        $scope.addingAgent = true;
        const data = await apiReq.request('POST', '/agents', {
          name: $scope.registerObj.systems[$scope.registerObj.selectedSystem].steps[0].agentName,
          ip: $scope.registerObj.systems[$scope.registerObj.selectedSystem].steps[0].agentIP
        });
        if (!(((data || {}).data || {}).data || {}).key) {
          throw new Error("No agent key received");
        } else {
          $scope.registerObj.systems[$scope.registerObj.selectedSystem].steps[1].key = data.data.data.key;
          $scope.registerObj.systems[$scope.registerObj.selectedSystem].steps[1].systems[$scope.registerObj.selectedSystem].code += data.data.data.key;
          $scope.registerObj.systems[$scope.registerObj.selectedSystem].steps[3].id = data.data.data.id;
        }
        $scope.addingAgent = false;
        $scope.nextStep('linux');
        $scope.$applyAsync();
      } catch (error) {
        $scope.addingAgent = false;
        errorHandler.handle(error, 'Adding agent error.');
      }
      return;
    }

    $scope.restartAgent = async () => {
      $scope.restartingAgent = true;
      try {
        const data = await apiReq.request(
          'PUT',
          `/agents/${$scope.registerObj.systems[$scope.registerObj.selectedSystem].steps[3].id}/restart`,
          {}
        );
        const result = ((data || {}).data || {}).data || false;
        if (!result) {
          throw new Error('Unexpected error restarting agent');
        }
        errorHandler.info(`Success. Agent ${$scope.registerObj.systems[$scope.registerObj.selectedSystem].steps[0].agentName} has been registered.`);
        $scope.restartingAgent = false;
        $scope.$broadcast('wazuhSearch', { term: '' });
        if (($scope.$parent || {}).registerNewAgent) {
          $scope.$parent.registerNewAgent = false;
        }
        $scope.$applyAsync();
        load();
      } catch (error) {
        errorHandler.handle(error, '');
        $scope.restartingAgent = false;
      }
      $scope.$applyAsync();
    };

    $scope.setSystem = (system) => {
      $scope.registerObj.selectedSystemTab = system;
      switch (system) {
        case 'linux':
          $scope.registerObj.selectedSystem = 0;
          break;
        case 'windows':
          $scope.registerObj.selectedSystem = 1;
          break;
        case 'osx':
          $scope.registerObj.selectedSystem = 2;
          break;
      }
    }
  }
}

app.directive('wzRegisterAgents', () => new WzRegisterAgents());