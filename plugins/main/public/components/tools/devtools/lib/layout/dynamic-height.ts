import { DynamicHeight } from '../../../../../utils/dynamic-height';

/**
 * Hook window resize to keep the devtools area sized correctly.
 */
export function setupDynamicHeight(win: Window) {
  const dynamicHeight = () => DynamicHeight.dynamicHeightDevTools(win);
  win.onresize = dynamicHeight;
  dynamicHeight();
}
