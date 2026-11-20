import { getWazuhCheckUpdatesServices } from '../../plugin-services';

/**
 * Logs through the plugin logger. The plugin services are unavailable in some contexts
 * (early in the lifecycle, some tests), so logging never throws.
 */
export function safeLog(level: 'error' | 'warn', message: string): void {
  try {
    getWazuhCheckUpdatesServices().logger[level](message);
  } catch {
    // Logger itself unavailable; nothing more we can safely do here.
  }
}
