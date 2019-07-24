/*
 * Wazuh app - Wazuh register agents
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
    this.restrict = 'E';
    this.scope = {
      reload: '&'
    };
  }
  controller($scope, wazuhConfig, errorHandler, apiReq) {
    const configuration = wazuhConfig.getConfig();
    $scope.adminMode = !!(configuration || {}).admin;
    const load = async () => {
      $scope.registerObj = {
        selectedSystem: 0,
        selectedSystemTab: 'linux',
        currentStep: 0,
        systems: [
          {
            /* Linux */
            steps: [
              {
                title: 'Add the agent to the manager'
              },
              {
                title: 'Import the key to the agent',
                code: '/var/ossec/bin/manage_agents -i '
              },
              {
                title:
                  'Edit the Wazuh agent configuration to add the Wazuh manager IP'
              },
              {
                title: 'Restart the agent'
              }
            ]
          },
          {
            /* Windows */
            steps: [
              {
                title: 'Register the agent'
              }
            ]
          },
          {
            /* OSX */
            steps: [
              {
                title: 'Register the agent'
              },
              {
                title:
                  'Edit the Wazuh agent configuration to add the Wazuh manager IP'
              },
              {
                title: 'Restart the agent',
                code: '/Library/Ossec/bin/ossec-control restart'
              }
            ]
          }
        ]
      };
    };
    load();

    $scope.nextStep = () => {
      $scope.registerObj.currentStep++;
      if (
        $scope.registerObj.currentStep >=
        $scope.registerObj.systems[$scope.registerObj.selectedSystem].steps
          .length
      ) {
        $scope.restartingAgent = false;
        $scope.reload();
        load();
      }
      $scope.$applyAsync();
    };
    $scope.addAgent = async () => {
      try {
        $scope.addingAgent = true;
        const data = await apiReq.request('POST', '/agents', {
          name:
            $scope.registerObj.systems[$scope.registerObj.selectedSystem]
              .steps[0].agentName,
          ip:
            $scope.registerObj.systems[$scope.registerObj.selectedSystem]
              .steps[0].agentIP
        });
        if (!(((data || {}).data || {}).data || {}).key) {
          throw new Error('No agent key received');
        } else {
          $scope.registerObj.systems[
            $scope.registerObj.selectedSystem
          ].steps[1].key = data.data.data.key;
          $scope.registerObj.systems[
            $scope.registerObj.selectedSystem
          ].steps[1].code += data.data.data.key;
          $scope.registerObj.systems[
            $scope.registerObj.selectedSystem
          ].steps[3].id = data.data.data.id;
        }
        $scope.addingAgent = false;
        $scope.nextStep();
      } catch (error) {
        $scope.addingAgent = false;
        errorHandler.handle(error.message || error);
      }
      $scope.$applyAsync();
      return;
    };

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
        errorHandler.info(
          `Success. Agent ${$scope.registerObj.systems[$scope.registerObj.selectedSystem].steps[0].agentName} has been registered.`
        );
        $scope.nextStep();
      } catch (error) {
        errorHandler.handle(error.message || error);
        $scope.restartingAgent = false;
      }
      $scope.$applyAsync();
    };

    $scope.setSystem = system => {
      $scope.registerObj.currentStep = 0;
      load();
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
    };
  }
}

app.directive('wzRegisterAgents', () => new WzRegisterAgents());
