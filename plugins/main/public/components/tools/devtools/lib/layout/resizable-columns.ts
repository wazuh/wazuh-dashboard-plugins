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
    const leftOrigWidth =
      ($(`#${EDITOR_MIRRORS.LEFT_COLUMN_ID}`).width() as number) || 0;
    const rightOrigWidth =
      ($(`#${EDITOR_MIRRORS.RIGHT_COLUMN_ID}`).width() as number) || 0;

    $(doc).on('mousemove', function (ev: any) {
      const dx = ev.pageX - startX;
      const newLeftWidth = leftOrigWidth + dx;
      const newRightWidth = rightOrigWidth - dx;
      $(`#${EDITOR_MIRRORS.LEFT_COLUMN_ID}`).css('width', newLeftWidth);
      $(`#${EDITOR_MIRRORS.RIGHT_COLUMN_ID}`).css('width', newRightWidth);
    });
  });

  $(doc).on('mouseup', function () {
    $(`#${EDITOR_MIRRORS.SEPARATOR_ID}`).removeClass('active');
    $(doc).off('mousemove');
  });
}
