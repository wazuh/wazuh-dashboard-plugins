import $ from 'jquery';
import { EDITOR_MIRRORS } from '../../constants';

/**
 * Enable the draggable separator between editors to resize columns.
 */
export function setupResizableColumns(doc: Document) {
  $(`#${EDITOR_MIRRORS.SEPARATOR_ID}`).on('mousedown', function (e) {
    e.preventDefault();
    $(`#${EDITOR_MIRRORS.SEPARATOR_ID}`).addClass('active');
    const startX = e.pageX;
    const leftOrigWidth = ($('#wz-dev-left-column').width() as number) || 0;
    const rightOrigWidth = ($('#wz-dev-right-column').width() as number) || 0;

    $(doc).on('mousemove', function (ev: any) {
      const dx = ev.pageX - startX;
      const newLeftWidth = leftOrigWidth + dx;
      const newRightWidth = rightOrigWidth - dx;
      $('#wz-dev-left-column').css('width', newLeftWidth);
      $('#wz-dev-right-column').css('width', newRightWidth);
    });
  });

  $(doc).on('mouseup', function () {
    $(`#${EDITOR_MIRRORS.SEPARATOR_ID}`).removeClass('active');
    $(doc).off('mousemove');
  });
}

