import $ from 'jquery';
import { DynamicHeight } from '../../../../utils/dynamic-height';

/**
 * Enable the draggable separator between editors to resize columns.
 */
export function setupResizableColumns(doc: Document) {
  $('.wz-dev-column-separator').on('mousedown', function (e) {
    e.preventDefault();
    $('.wz-dev-column-separator').addClass('active');
    // Capture initial state to compute deltas instead of using absolute pageX
    const startX = e.pageX;
    const leftOrigWidth = ($('#wz-dev-left-column').width() as number) || 0;
    const rightOrigWidth = ($('#wz-dev-right-column').width() as number) || 0;

    $(doc).on('mousemove', function (ev: any) {
      const dx = ev.pageX - startX; // movement relative to initial click
      const newLeftWidth = leftOrigWidth + dx;
      const newRightWidth = rightOrigWidth - dx;

      // Apply widths; CSS min/max-width will clamp if needed
      $('#wz-dev-left-column').css('width', newLeftWidth);
      $('#wz-dev-right-column').css('width', newRightWidth);
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
