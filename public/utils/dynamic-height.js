export class DynamicHeight {

  constructor() {
  }

  /**
  * Calculates dynamically the height 
  * @param {String} classElement 
  * @param {Number} extraHeight 
  */
  dynamicHeight(classElement, extraHeight, isLogs = false) {
    let editorContainer;
    const codeMirror = $('.CodeMirror');
    const interval = setInterval(() => {
      editorContainer = $(`.${classElement}`);
      if (editorContainer.length) {
        clearInterval(interval);
        setTimeout(() => {
          const windows = $(window).height();
          const offsetTop = this.getPosition(editorContainer[0]).y;
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
            ?
            $(`.${classElement} .CodeMirror`).height(
              windows - (offsetTop + bottom + headerContainerHeight)
            )
            :
            $(`.${classElement}`).height(
              windows - (offsetTop + bottom + headerContainerHeight)
            );
        }, 1);
      }
    }, 100);
  }

  /**
   * Calculate the dynamic height for the XML editor
   */
  dynamicHeightXmlEditor() {
    let editorContainer;
    const interval = setInterval(() => {
      editorContainer = $('.wzXmlEditor');
      if (editorContainer.length) {
        clearInterval(interval);
        setTimeout(() => {
          const editorContainer = $('.wzXmlEditor');
          const headerContainer = $('#wzXmlEditorHeader');
          const windows = $(window).height();
          const offsetTop = this.getPosition(editorContainer[0]).y;
          editorContainer.height(windows - (offsetTop + 20));
          $('.wzXmlEditorBody .CodeMirror').css({
            height: 'calc(100% - ' + (headerContainer.height() - 22) + 'px)'
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
  dynamicHeightDevTools(self, window) {
    let devToolsElement;
    const interval = setInterval(() => {
      devToolsElement = $('#wz-dev-left-column');
      if (devToolsElement) {
        clearInterval(interval);
        setTimeout(() => {
          const windows = $(window).height();
          $('#wz-dev-left-column').height(
            windows - (this.getPosition($('#wz-dev-left-column')[0]).y + 20)
          );
          $('.wz-dev-column-separator').height(
            windows - (this.getPosition($('.wz-dev-column-separator')[0]).y + 20)
          );
          $('#wz-dev-right-column').height(
            windows - (this.getPosition($('#wz-dev-right-column')[0]).y + 20)
          );
          $('.wz-dev-column-separator span').height(
            windows -
            (this.getPosition($('.wz-dev-column-separator span')[0]).y + 20)
          );
        }, 1);
      }
    });
  }

  getPosition(element) {
    let xPosition = 0;
    let yPosition = 0;

    while (element) {
      xPosition +=
        element.offsetLeft - element.scrollLeft + element.clientLeft;
      yPosition += element.offsetTop - element.scrollTop + element.clientTop;
      element = element.offsetParent;
    }

    return { x: xPosition, y: yPosition };
  }
}