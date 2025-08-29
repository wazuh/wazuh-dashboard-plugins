import $ from 'jquery';
import { DynamicHeight } from '../../../../utils/dynamic-height';

/**
 * Enable the draggable separator between editors to resize columns.
 */
export function setupResizableColumns(doc: Document) {
  $('.wz-dev-column-separator').mousedown(function (e) {
    e.preventDefault();
    $('.wz-dev-column-separator').addClass('active');
    const leftOrigWidth = $('#wz-dev-left-column').width() as number;
    const rightOrigWidth = $('#wz-dev-right-column').width() as number;
    $(doc).on('mousemove', function (e: any) {
      const leftWidth = e.pageX;
      const rightWidth = leftOrigWidth - leftWidth;
      $('#wz-dev-left-column').css('width', leftWidth);
      $('#wz-dev-right-column').css('width', rightOrigWidth + rightWidth);
    });
  });

  $(doc).on('mouseup', function () {
    $('.wz-dev-column-separator').removeClass('active');
    $(doc).off('mousemove');
  });
}

/**
 * Hook window resize to keep the devtools area sized correctly.
 */
export function setupDynamicHeight(win: Window) {
  const dynamicHeight = () => DynamicHeight.dynamicHeightDevTools(win);
  win.onresize = dynamicHeight;
  dynamicHeight();
}
