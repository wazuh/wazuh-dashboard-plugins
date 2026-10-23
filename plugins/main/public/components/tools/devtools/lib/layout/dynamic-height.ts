import { DynamicHeight } from '../../../../../utils/dynamic-height';
import { EDITOR_MIRRORS } from '../../constants';

const APP_WRAPPER_ID = 'app-wrapper';

/**
 * Hook window resize and bottom bar changes to keep the devtools area sized
 * correctly.
 */
export function setupDynamicHeight(win: Window) {
  const dynamicHeight = () => DynamicHeight.dynamicHeightDevTools(win);
  win.onresize = dynamicHeight;
  dynamicHeight();

  // The bottom bars (CTI registration, new release) are children of the app
  // wrapper and can appear or be dismissed after the columns are set up.
  const appWrapper = win.document.getElementById(APP_WRAPPER_ID);

  if (!appWrapper || typeof MutationObserver === 'undefined') {
    return;
  }

  const observer = new MutationObserver(() => {
    // Dev Tools was unmounted: stop observing and avoid polling for columns
    // that no longer exist.
    if (!win.document.getElementById(EDITOR_MIRRORS.LEFT_COLUMN_ID)) {
      observer.disconnect();

      return;
    }

    dynamicHeight();
  });

  observer.observe(appWrapper, { childList: true });
}
