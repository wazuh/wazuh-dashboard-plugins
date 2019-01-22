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
      targetName: '=targetName'
    },
    controller($scope, $document, errorHandler, groupHandler, rulesetHandler) {
      let firstTime = true;
      const checkXmlParseError = () => {
        try {
          const parser = new DOMParser(); // eslint-disable-line
          const xml = $scope.xmlCodeBox.getValue();
          const xmlDoc = parser.parseFromString(
            '<file>' + xml + '</file>',
            'text/xml'
          );
          $scope.validFn({
            valid:
              !!xmlDoc.getElementsByTagName('parsererror').length ||
              !xml ||
              !xml.length
          });
        } catch (error) {
          errorHandler.handle(error, 'Error validating XML');
        }
        if (!$scope.$$phase) $scope.$digest();
        return;
      };

      const autoFormat = () => {
        const totalLines = $scope.xmlCodeBox.lineCount();
        $scope.xmlCodeBox.autoFormatRange(
          { line: 0, ch: 0 },
          { line: totalLines - 1 }
        );
        $scope.xmlCodeBox.setCursor(0);
      };

      const saveFile = async params => {
        try {
          const content = $scope.xmlCodeBox.getValue().trim();
          if (params.type === 'group') {
            await groupHandler.sendConfiguration(params.group, content);
            errorHandler.info('Success. Group has been updated', '');
          } else if (params.type === 'rule') {
            await rulesetHandler.sendRuleConfiguration(params.rule, content);
            errorHandler.info('Success. Rules has been updated', '');
          } else if (params.type === 'decoder') {
            await rulesetHandler.sendDecoderConfiguration(params.decoder, content);
            errorHandler.info('Success. Decoders has been updated', '');
          }
        } catch (error) {
          errorHandler.handle(error, 'Send file error');
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
          $scope.xmlCodeBox.setValue(data || $scope.data);
          firstTime = false;
          setTimeout(() => { $scope.xmlCodeBox.refresh() }, 1);
          autoFormat();
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

      $scope.$on('saveXmlFile', (ev, params) => saveFile(params));
    },
    template
  };
});
