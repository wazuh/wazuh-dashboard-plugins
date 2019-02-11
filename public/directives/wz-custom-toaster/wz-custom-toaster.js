/*
 * Wazuh app - Custom Toaster directive
 * Copyright (C) 2015-2019 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import { uiModules } from 'ui/modules';
import templateReloadManager from './wz-custom-toaster-reload-manager.html';

const app = uiModules.get('app/wazuh', []);

class WzCustomToaster {
  constructor() {
    this.restrict = 'E';
    this.scope = {};
  }
  controller($scope, $mdDialog) {
    const init = async (msg, target, confirm, close) => {
      const confirmDialog = $mdDialog.confirm({
        controller: function (
          $scope,
          $mdDialog
        ) {
          $scope.target = target;
          $scope.msg = msg;
          $scope.closeDialog = () => {
            $mdDialog.hide();
            $('body').removeClass('md-dialog-body');
            if (close)
              close();
          };
          $scope.confirmDialog = async () => {
            $mdDialog.hide();
            $scope.$applyAsync();
            confirm(target);
          };
        },
        template: templateReloadManager,
        hasBackdrop: false,
        clickOutsideToClose: true,
        disableParentScroll: true
      });
      $('body').addClass('md-dialog-body');
      $mdDialog.show(confirmDialog);
    }

    $scope.$on('showCustomToaster', (ev, params) => {
      init(params.msg, params.target, params.confirmDialogFn, params.closeDialogFn);
    });
  }
}

app.directive('wzCustomToaster', () => new WzCustomToaster());


