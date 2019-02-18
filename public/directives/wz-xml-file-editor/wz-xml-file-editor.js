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

import template from './wz-xml-file-editor.html';
import CodeMirror from '../../utils/codemirror/lib/codemirror';
import { uiModules } from 'ui/modules';

const app = uiModules.get('app/wazuh', []);

app.directive('wzXmlFileEditor', function () {
  return {
    restrict: 'E',
    scope: {
      fileName: '@fileName',
      validFn: '&',
      data: '=data',
      targetName: '=targetName',
      closeFn: '&'
    },
    controller(
      $scope,
      $rootScope,
      $document,
      $location,
      appState,
      $mdDialog,
      errorHandler,
      groupHandler,
      rulesetHandler,
      configHandler,
      apiReq
    ) {
      /**
       * Custom .replace method. Instead of using .replace which
       * evaluates regular expressions.
       * Alternative using split + join, same result.
       */
      String.prototype.xmlReplace = function (str, newstr) {
        return this.split(str).join(newstr);
      };

      let firstTime = true;
      const parser = new DOMParser(); // eslint-disable-line

      /**
       * Escape "&" characters.
       * @param {*} text
       */
      const replaceIllegalXML = text => {
        const oDOM = parser.parseFromString(text, 'text/html');
        const lines = oDOM.documentElement.textContent.split('\n');

        for (const line of lines) {
          const sanitized = line.trim().xmlReplace('&', '&amp;');

          /**
           * Do not remove this condition. We don't want to replace
           * non-sanitized lines.
           */
          if (!line.includes(sanitized)) {
            text = text.xmlReplace(line.trim(), sanitized);
          }
        }
        return text;
      };

      // Block function if there is another check in progress
      let checkingXmlError = false;
      const checkXmlParseError = () => {
        if (checkingXmlError) return;
        checkingXmlError = true;
        try {
          const text = $scope.xmlCodeBox.getValue();
          let xml = replaceIllegalXML(text);
          xml = xml.replace(/..xml.+\?>/, '');
          const xmlDoc = parser.parseFromString(
            `<file>${xml}</file>`,
            'text/xml'
          );

          $scope.validFn({
            valid:
              !!xmlDoc.getElementsByTagName('parsererror').length ||
              !xml ||
              !xml.length
          });

          if (xmlDoc.getElementsByTagName('parsererror').length) {
            const xmlFullError = xmlDoc.getElementsByTagName('parsererror')[0]
              .innerText;
            $scope.xmlError = xmlFullError.match('error\\s.+\n')[0];
          } else {
            $scope.xmlError = false;
          }
        } catch (error) {
          errorHandler.handle(error, 'Error validating XML');
        }
        checkingXmlError = false;
        if (!$scope.$$phase) $scope.$digest();
        return;
      };

      const autoFormat = xml => {
        var reg = /(>)\s*(<)(\/*)/g;
        var wsexp = / *(.*) +\n/g;
        var contexp = /(<.+>)(.+\n)/g;
        xml = xml
          .replace(reg, '$1\n$2$3')
          .replace(wsexp, '$1\n')
          .replace(contexp, '$1\n$2');
        var formatted = '';
        var lines = xml.split('\n');
        var indent = 0;
        var lastType = 'other';
        var transitions = {
          'single->single': 0,
          'single->closing': -1,
          'single->opening': 0,
          'single->other': 0,
          'closing->single': 0,
          'closing->closing': -1,
          'closing->opening': 0,
          'closing->other': 0,
          'opening->single': 1,
          'opening->closing': 0,
          'opening->opening': 1,
          'opening->other': 1,
          'other->single': 0,
          'other->closing': -1,
          'other->opening': 0,
          'other->other': 0
        };

        for (var i = 0; i < lines.length; i++) {
          var ln = lines[i];
          if (ln.match(/\s*<\?xml/)) {
            formatted += ln + '\n';
            continue;
          }
          var single = Boolean(ln.match(/<.+\/>/)); // is this line a single tag? ex. <br />
          var closing = Boolean(ln.match(/<\/.+>/)); // is this a closing tag? ex. </a>
          var opening = Boolean(ln.match(/<[^!].*>/)); // is this even a tag (that's not <!something>)
          var type = single
            ? 'single'
            : closing
              ? 'closing'
              : opening
                ? 'opening'
                : 'other';
          var fromTo = lastType + '->' + type;
          lastType = type;
          var padding = '';

          indent += transitions[fromTo];
          for (var j = 0; j < indent; j++) {
            padding += '\t';
          }
          if (fromTo == 'opening->closing')
            formatted = formatted.substr(0, formatted.length - 1) + ln + '\n';
          // substr removes line break (\n) from prev loop
          else formatted += padding + ln + '\n';
        }
        return formatted.trim();
      };

      const validateAfterSent = async (node = false) => {
        try {
          const isCluster = appState.getClusterInfo().status === 'enabled';
          let validation = false;
          if (node) {
            validation = await apiReq.request(
              'GET',
              `/cluster/${node}/configuration/validation`,
              {}
            );
          } else {
            validation = isCluster
              ? await apiReq.request(
                'GET',
                `/cluster/configuration/validation`,
                {}
              )
              : await apiReq.request(
                'GET',
                `/manager/configuration/validation`,
                {}
              );

          }
          const data = ((validation || {}).data || {}).data || {};
          const isOk = data.status === 'OK';
          if (!isOk && Array.isArray(data.details)) {
            const str = data.details.join();
            throw new Error(str);
          }
          return true;
        } catch (error) {
          errorHandler.handle(error, 'Error');
          throw new Error(error);
        }
      };

      const saveFile = async params => {
        let close = true;
        const warnMsg =
          'File has been updated, but there are errors in the configuration';
        try {
          const text = $scope.xmlCodeBox.getValue();
          const xml = replaceIllegalXML(text);
          if (params.group) {
            await groupHandler.sendConfiguration(params.group, xml);
            try {
              await validateAfterSent();
            } catch (err) {
              params.showRestartManager = 'warn';
              close = false;
            }
            const msg = 'Success. Group has been updated';
            params.showRestartManager
              ? params.showRestartManager !== 'warn'
                ? showRestartDialog(msg, params.showRestartManager)
                : errorHandler.handle(warnMsg, '', true)
              : errorHandler.info(msg, '');
            $scope.$emit('configurationSuccess');
          } else if (params.rule) {
            await rulesetHandler.sendRuleConfiguration(params.rule, xml);
            try {
              await validateAfterSent();
            } catch (err) {
              params.showRestartManager = 'warn';
              close = false;
            }
            const msg = 'Success. Rules updated';
            params.showRestartManager
              ? params.showRestartManager !== 'warn'
                ? showRestartDialog(msg, params.showRestartManager)
                : errorHandler.handle(warnMsg, '', true)
              : errorHandler.info(msg, '');
          } else if (params.decoder) {
            await rulesetHandler.sendDecoderConfiguration(params.decoder, xml);
            try {
              await validateAfterSent();
            } catch (err) {
              params.showRestartManager = 'warn';
              close = false;
            }
            const msg = 'Success. Decoders has been updated';
            params.showRestartManager
              ? params.showRestartManager !== 'warn'
                ? showRestartDialog(msg, params.showRestartManager)
                : errorHandler.handle(warnMsg, '', true)
              : errorHandler.info(msg, '');
          } else if (params.node) {
            await configHandler.saveNodeConfiguration(params.node, xml);
            try {
              await validateAfterSent(params.node);
            } catch (err) {
              params.showRestartManager = 'warn';
              close = false;
            }
            const msg = `Success. Node (${
              params.node
              }) configuration has been updated`;
            params.showRestartManager
              ? params.showRestartManager !== 'warn'
                ? showRestartDialog(msg, params.node)
                : errorHandler.handle(warnMsg, '', true)
              : errorHandler.info(msg, '');
          } else if (params.manager) {
            await configHandler.saveManagerConfiguration(xml);
            try {
              await validateAfterSent();
            } catch (err) {
              params.showRestartManager = 'warn';
              close = false;
            }
            const msg = 'Success. Manager configuration has been updated';
            params.showRestartManager
              ? params.showRestartManager !== 'warn'
                ? showRestartDialog(msg, params.showRestartManager)
                : errorHandler.handle(warnMsg, '', true)
              : errorHandler.info(msg, '');
          }
          if (close) $scope.closeFn({ reload: true });
        } catch (error) {
          errorHandler.handle(error, 'Error');
        }
        return;
      };

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

      const init = (data = false) => {
        try {
          $scope.xmlError = false;
          $scope.xmlCodeBox.setValue(autoFormat(data || $scope.data));
          firstTime = false;
          setTimeout(() => {
            $scope.xmlCodeBox.refresh();
          }, 1);
        } catch (error) {
          errorHandler.handle(error, 'Fetching original file');
        }
      };

      init();

      // Refresh content if it's not the very first time we are loading data
      $scope.$on('fetchedFile', (ev, params) => {
        if (!firstTime) {
          init(params.data);
        }
      });

      $scope.xmlCodeBox.on('change', () => {
        checkXmlParseError();
      });

      const showRestartDialog = async (msg, target) => {
        const confirm = $mdDialog.confirm({
          controller: function (
            $scope,
            scope,
            errorHandler,
            rootScope,
            $mdDialog,
            configHandler,
            apiReq
          ) {
            $scope.closeDialog = () => {
              $mdDialog.hide();
              $('body').removeClass('md-dialog-body');
            };
            $scope.confirmDialog = async () => {
              rootScope.$emit('setRestarting', {});
              scope.$applyAsync();
              $mdDialog.hide();
              const clusterStatus = await apiReq.request(
                'GET',
                '/cluster/status',
                {}
              );
              if (
                target !== 'cluster' &&
                target !== 'manager' &&
                (clusterStatus.data.data.enabled === 'no' ||
                  clusterStatus.data.data.running === 'no')
              ) {
                target = 'manager';
              }
              if (target === 'manager') {
                try {
                  const data = await configHandler.restartManager();
                  $('body').removeClass('md-dialog-body');
                  errorHandler.info(
                    'It may take a few seconds...',
                    data.data.data
                  );
                  rootScope.$emit('removeRestarting', {});
                  scope.$applyAsync();
                } catch (error) {
                  errorHandler.handle(
                    error.message || error,
                    'Error restarting manager'
                  );
                  rootScope.$emit('removeRestarting', {});
                }
              } else if (target === 'cluster') {
                try {
                  const data = await configHandler.restartCluster();
                  $('body').removeClass('md-dialog-body');
                  errorHandler.info(
                    'It may take a few seconds...',
                    data.data.data
                  );
                  rootScope.$emit('removeRestarting', {});
                  scope.$applyAsync();
                } catch (error) {
                  errorHandler.handle(
                    error.message || error,
                    'Error restarting cluster'
                  );
                  rootScope.$emit('removeRestarting', {});
                }
              } else {
                try {
                  const data = await configHandler.restartNode(target);
                  $('body').removeClass('md-dialog-body');
                  errorHandler.info(
                    'It may take a few seconds...',
                    data.data.data
                  );
                  rootScope.$emit('removeRestarting', {});
                  scope.$applyAsync();
                } catch (error) {
                  errorHandler.handle(
                    error.message || error,
                    'Error restarting node'
                  );
                  rootScope.$emit('removeRestarting', {});
                }
              }
            };
          },
          template:
            '<md-dialog class="modalTheme euiToast euiToast--success euiGlobalToastListItem">' +
            '<md-dialog-content>' +
            '<div class="euiToastHeader">' +
            '<i class="fa fa-check"></i>' +
            '<span class="euiToastHeader__title">' +
            `${msg}` +
            `. Do you want to restart the ${target} now?` +
            '</span>' +
            '</div>' +
            '</md-dialog-content>' +
            '<md-dialog-actions>' +
            '<button class="md-primary md-cancel-button md-button ng-scope md-default-theme md-ink-ripple" type="button" ng-click="closeDialog()">I will do it later</button>' +
            `<button class="md-primary md-confirm-button md-button md-ink-ripple md-default-theme" type="button" ng-click="confirmDialog()">Restart ${target}</button>` +
            '</md-dialog-actions>' +
            '</md-dialog>',
          hasBackdrop: false,
          clickOutsideToClose: true,
          disableParentScroll: true,
          locals: {
            scope: $scope,
            errorHandler: errorHandler,
            rootScope: $rootScope
          }
        });
        $('body').addClass('md-dialog-body');
        $mdDialog.show(confirm);
      };

      $scope.$on('saveXmlFile', (ev, params) => saveFile(params));

      $scope.$on('$destroy', function () {
        $location.search('editingFile', null);
        appState.setNavigation({ status: true });
      });
    },
    template
  };
});
