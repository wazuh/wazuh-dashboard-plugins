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

app.directive('wzXmlFileEditor', function() {
  return {
    restrict: 'E',
    scope: {
      fileName: '@fileName'
    },
    controller($scope, $timeout, apiReq, $document, errorHandler) {
      $($document[0]).ready(function() {
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
        $scope.xmlHasErrors = false;
        $scope.xmlCodeBox.on('change', () => {
          checkXmlParseError();
        });
        const checkXmlParseError = () => {
          try {
            const parser = new DOMParser(); // eslint-disable-line
            const xml = $scope.xmlCodeBox.getValue();
            const xmlDoc = parser.parseFromString(xml, 'text/xml');
            $timeout(function() {
              $scope.xmlHasErrors = !!xmlDoc.getElementsByTagName('parsererror').length
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

      $scope.saveFile = async () => {
        try {
          autoFormat()
          const content = $scope.xmlCodeBox.getValue().trim();
   
          await apiReq.request(
            'POST',
            `/agents/groups/${$scope.targetName}/configuration`,
            { content, origin: 'xmleditor' }
          );
          $scope.$emit('updateGroupInformation', {
            group: $scope.targetName
          });
          await $timeout(500);
        } catch (error) {
          errorHandler.handle(error, 'Send file error');
        }
        $scope.editingFile = false;
        if (!$scope.$$phase) $scope.$digest();
        return;
      };

      const fetchFile = async () => {
        try {
          const data = await apiReq.request(
            'GET',
            `/agents/groups/${$scope.targetName}/files/agent.conf`,
            {format: 'xml'}
          );

          const xml = ((data || {}).data || {}).data || false;
          if(!xml) {
            throw new Error('Could not fetch agent.conf file')
          }
          return xml;
        } catch (error) {
          return Promise.reject(error);
        }
      };

      $scope.editXmlFile = async (item, params) => {
        $scope.editingFile = true;
        $scope.loadingFile = true;
        $scope.targetName = params.target.name;
        try {
          const fetchedXML = await fetchFile();
          $scope.xmlCodeBox.setValue(fetchedXML);
          autoFormat();
          $timeout(function() {
            $scope.xmlCodeBox.refresh();
          }, 100);
        } catch (error) {
          errorHandler.handle(error, 'Fetch file error');
        }
        $scope.loadingFile = false;
      };
      $scope.$on('editXmlFile', (item, params) =>
        $scope.editXmlFile(item, params)
      );
      $scope.$on('closeEditXmlFile', () => ($scope.editingFile = false));
    },
    template
  };
});
