/*
 * Wazuh app - Helper class for div heights
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
export class DynamicHeight {
  /**
   * Calculates dynamically the height
   * @param {String} classElement
   * @param {Number} extraHeight
   */
  static dynamicHeight(classElement, extraHeight, isLogs = false) {
    let editorContainer;
    const codeMirror = $('.CodeMirror');
    const interval = setInterval(() => {
      editorContainer = $(`.${classElement}`);
      if (editorContainer.length) {
        clearInterval(interval);
        setTimeout(() => {
          const windows = $(window).height();
          const offsetTop = DynamicHeight.getPosition(editorContainer[0]).y;
          const bottom = isLogs ? 75 : 20;
          const headerContainer = $('.wzXmlEditorHeader');
          const headerContainerHeight =
            headerContainer.height() + extraHeight
              ? headerContainer.height() + extraHeight
              : isLogs
              ? 0
              : 80;
          editorContainer.height(windows - (offsetTop + bottom));
          codeMirror.length
            ? $(`.${classElement} .CodeMirror`).height(
                windows - (offsetTop + bottom + headerContainerHeight)
              )
            : $(`.${classElement}`).height(
                windows - (offsetTop + bottom + headerContainerHeight)
              );
        }, 1);
      }
    }, 100);
  }

  /**
   * Calculate the dynamic height for the XML editor
   */
  static dynamicHeightXmlEditor() {
    let editorContainer;
    const interval = setInterval(() => {
      editorContainer = $('.wzXmlEditor');
      if (editorContainer.length) {
        clearInterval(interval);
        setTimeout(() => {
          const editorContainer = $('.wzXmlEditor');
          const headerContainer = $('#wzXmlEditorHeader');
          const windows = $(window).height();
          const offsetTop = DynamicHeight.getPosition(editorContainer[0]).y;
          editorContainer.height(windows - (offsetTop + 20));
          $('.wzXmlEditorBody .CodeMirror').css({
            height: 'calc(100% - ' + (headerContainer.height() - 22) + 'px)'
          });
        }, 1);
      }
    }, 100);
  }

  /**
   * Calculate the dynamic height for the XML editor
   */
  static dynamicHeightStatic(classElement, staticHeight) {
    let editorContainer;
    const interval = setInterval(() => {
      editorContainer = $(classElement);
      if (editorContainer.length) {
        clearInterval(interval);
        setTimeout(() => {
          const editorContainer = $(classElement);
          const offsetTop = DynamicHeight.getPosition(editorContainer[0]).y;
          $(classElement).css({
            height: 'calc(100vh - ' + (offsetTop + staticHeight + 2) + 'px)'
          });
        }, 1);
      }
    }, 100);
  }

  /**
   * Calculates the dynamic height for the dev tools
   * @param {Object} self
   * @param {Object} window
   */
  static dynamicHeightDevTools(self, window) {
    let devToolsElement;
    const interval = setInterval(() => {
      devToolsElement = $('#wz-dev-left-column');
      if (devToolsElement) {
        clearInterval(interval);
        setTimeout(() => {
          const windows = $(window).height();
          $('#wz-dev-left-column').height(
            windows -
              (DynamicHeight.getPosition($('#wz-dev-left-column')[0]).y + 20)
          );
          $('.wz-dev-column-separator').height(
            windows -
              (DynamicHeight.getPosition($('.wz-dev-column-separator')[0]).y +
                20)
          );
          $('#wz-dev-right-column').height(
            windows -
              (DynamicHeight.getPosition($('#wz-dev-right-column')[0]).y + 20)
          );
          $('.wz-dev-column-separator span').height(
            windows -
              (DynamicHeight.getPosition($('.wz-dev-column-separator span')[0])
                .y +
                20)
          );
        }, 1);
      }
    });
  }

  static getPosition(element) {
    let xPosition = 0;
    let yPosition = 0;

    while (element) {
      xPosition += element.offsetLeft - element.scrollLeft + element.clientLeft;
      yPosition += element.offsetTop - element.scrollTop + element.clientTop;
      element = element.offsetParent;
    }

    return { x: xPosition, y: yPosition };
  }
}
