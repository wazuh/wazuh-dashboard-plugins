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
      xmlcontent: '=',
      hideHeader: '=',
      noLocal: '='
    };
    this.template = template;
  }

  controller($scope, $document) {
    const setJsonBox = () => {
      $scope.jsonCodeBox = CodeMirror.fromTextArea(
        $document[0].getElementById('viewer_json_box'),
        {
          lineNumbers: true,
          autoRefresh: true,
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
        $document[0].getElementById('viewer_xml_box'),
        {
          lineNumbers: true,
          lineWrapping: true,
          autoRefresh: true,
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
      bindXmlListener();
    };

    $(window).on('resize', function() {
      dynamicHeight();
    });

    const dynamicHeight = () => {
      setTimeout(function() {
        const editorContainer = $('.configViewer');
        const windows = $(window).height();
        const offsetTop = getPosition(editorContainer[0]).y;
        editorContainer.height(windows - (offsetTop + 20));
      }, 1);
    };

    const refreshJsonBox = json => {
      $scope.jsoncontent = json;
      if (!$scope.jsonCodeBox) {
        setJsonBox();
      }
      if ($scope.jsoncontent != false) {
        $scope.jsonCodeBox.setValue($scope.jsoncontent.replace(/\\\\/g, '\\'));
        setTimeout(function() {
          $scope.jsonCodeBox.refresh();
          $scope.$applyAsync();
          window.dispatchEvent(new Event('resize'));
        }, 200);
      }
    };

    const refreshXmlBox = xml => {
      $scope.xmlcontent = xml;
      if (!$scope.xmlCodeBox) {
        setXmlBox();
      }
      if ($scope.xmlcontent != false) {
        $scope.xmlCodeBox.setValue($scope.xmlcontent);
        setTimeout(function() {
          $scope.xmlCodeBox.refresh();
          $scope.$applyAsync();
          window.dispatchEvent(new Event('resize'));
        }, 200);
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

    const bindXmlListener = () => {
      var scrollElement = $scope.xmlCodeBox.getScrollerElement();
      $(scrollElement).bind('scroll', function(e) {
        var element = $(e.currentTarget)[0];
        if (element.scrollHeight - element.scrollTop === element.clientHeight) {
          $scope.$emit('scrolledToBottom', {
            lines: $scope.xmlCodeBox.lineCount()
          });
        }
      });
    };

    $scope.$on('viewerScrollBottom', (ev, params) => {
      var t = $scope.xmlCodeBox.charCoords(
        { line: params.line, ch: 0 },
        'local'
      ).top;
      var middleHeight =
        $scope.xmlCodeBox.getScrollerElement().offsetHeight / 2;
      $scope.xmlCodeBox.scrollTo(null, t - middleHeight - 10);
    });

    $scope.$on('doRefresh', (ev, params) => {
      if (params.type === 'xml') {
        $scope.xmlCodeBox.refresh();
      } else {
        $scope.jsonCodeBox.refresh();
      }
    });

    function getPosition(element) {
      var xPosition = 0;
      var yPosition = 0;

      while (element) {
        xPosition +=
          element.offsetLeft - element.scrollLeft + element.clientLeft;
        yPosition += element.offsetTop - element.scrollTop + element.clientTop;
        element = element.offsetParent;
      }

      return { x: xPosition, y: yPosition };
    }
  }
}

app.directive('wzConfigViewer', () => new WzConfigViewer());
