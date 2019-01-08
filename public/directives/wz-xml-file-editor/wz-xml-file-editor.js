/*
 * Wazuh app - Wazuh XML file editor
 * Copyright (C) 2018 Wazuh, Inc.
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
      saveFn: '&'
    },
    controller($scope, $timeout, apiReq, $document, errorHandler) {
      $($document[0]).ready(function () {
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
        $scope.xmlCodeBox.on('change', () => {
          checkXmlParseError();
        });
        const checkXmlParseError = () => {
          try {
            const parser = new DOMParser(); // eslint-disable-line
            const xml = $scope.xmlCodeBox.getValue();
            const xmlDoc = parser.parseFromString(xml, 'text/xml');
            $timeout(function () {
              $scope.validFn({ valid: !!xmlDoc.getElementsByTagName('parsererror').length })
            }, 50);
          } catch (error) {
            errorHandler.handle(error, 'Error validating XML');
          }
        };
      });

      const autoFormat = () => {
        const totalLines = $scope.xmlCodeBox.lineCount();
        $scope.xmlCodeBox.autoFormatRange(
          { line: 0, ch: 0 },
          { line: totalLines - 1 }
        );
        $scope.xmlCodeBox.setCursor(0);
      };

      const saveFile = () => {
        try {
          autoFormat();
          const content = $scope.xmlCodeBox.getValue().trim();
          $scope.saveFn({ content: content });
        } catch (error) {
          errorHandler.handle(error, 'Send file error');
        }
        if (!$scope.$$phase) $scope.$digest();
        return;
      };

      const editXmlFile = async (item, params) => {
        $scope.targetName = params.target.name;
        $scope.xmlCodeBox.setValue(params.data);
        $scope.xmlCodeBox.refresh();
        autoFormat();
        if (!$scope.$$phase) $scope.$digest();
      };
      $scope.$on('editXmlFile', (item, params) =>
        editXmlFile(item, params)
      );
      $scope.$on('saveXmlFile', () =>
        saveFile()
      );
    },
    template
  };
});
