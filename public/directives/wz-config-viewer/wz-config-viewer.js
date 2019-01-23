/*
 * Wazuh app - Wazuh config viewer directive
 * Copyright (C) 2015-2019 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import template from './wz-config-viewer.html';
import { uiModules } from 'ui/modules';
import CodeMirror from '../../utils/codemirror/lib/codemirror';

const app = uiModules.get('app/wazuh', []);

class WzConfigViewer {
  constructor() {
    this.restrict = 'E';
    this.scope = {
      getjson: '&',
      getxml: '&',
      jsoncontent: '=',
      xmlcontent: '='
    };
    this.template = template;
  }

  controller($scope, $document) {
    const setJsonBox = () => {
      $scope.jsonCodeBox = CodeMirror.fromTextArea(
        $document[0].getElementById('json_box'),
        {
          lineNumbers: true,
          matchClosing: true,
          matchBrackets: true,
          mode: { name: 'javascript', json: true },
          readOnly: true,
          theme: 'ttcn',
          foldGutter: true,
          styleSelectedText: true,
          gutters: ['CodeMirror-foldgutter']
        }
      );
    };
    const setXmlBox = () => {
      $scope.xmlCodeBox = CodeMirror.fromTextArea(
        $document[0].getElementById('xml_box'),
        {
          lineNumbers: true,
          matchClosing: true,
          matchBrackets: true,
          mode: 'text/xml',
          readOnly: true,
          theme: 'ttcn',
          foldGutter: true,
          styleSelectedText: true,
          gutters: ['CodeMirror-foldgutter']
        }
      );
    };

    const init = () => {
      setJsonBox();
      setXmlBox();
    };

    const refreshJsonBox = json => {
      $scope.jsoncontent = json;
      setJsonBox();
      if ($scope.jsoncontent != false) {
        $scope.jsonCodeBox.setValue($scope.jsoncontent);
        setTimeout(function() {
          $scope.jsonCodeBox.refresh();
        }, 1);
      }
    };

    const refreshXmlBox = xml => {
      $scope.xmlcontent = xml;
      setXmlBox();
      if ($scope.xmlcontent != false) {
        $scope.xmlCodeBox.setValue($scope.xmlcontent);
        setTimeout(function() {
          $scope.xmlCodeBox.refresh();
        }, 1);
      }
    };

    $scope.callgetjson = () => $scope.getjson();

    $scope.callgetxml = () => $scope.getxml();

    $scope.$on('JSONContentReady', (ev, params) => {
      refreshJsonBox(params.data);
    });

    $scope.$on('XMLContentReady', (ev, params) => {
      refreshXmlBox(params.data);
    });

    init();
  }
}

app.directive('wzConfigViewer', () => new WzConfigViewer());
