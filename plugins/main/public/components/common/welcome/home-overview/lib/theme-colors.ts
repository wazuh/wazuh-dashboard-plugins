import { API_NAME_AGENT_STATUS } from '../../../../../../common/constants';

/**
 * Theme-aware replacements for `UI_COLOR_STATUS` (`common/constants.ts`). Each value is a CSS
 * custom property defined on `:root` (see `public/styles/theme-colors.scss`) rather than a
 * frozen hex literal, so it resolves to the correct light/dark color per OSD's `theme:darkMode`
 * setting instead of staying fixed regardless of theme.
 */
export const HOME_OVERVIEW_COLOR = {
  success: 'var(--wz-ho-success)',
  danger: 'var(--wz-ho-danger)',
  warning: 'var(--wz-ho-warning)',
  info: 'var(--wz-ho-info)',
  disabled: 'var(--wz-ho-disabled)',
  failed: 'var(--wz-ho-failed)',
} as const;

/** AA-contrast-boosted variants (OUI's `makeHighContrastColor` tokens) for status colors rendered
 * as text rather than a bar/tile fill. */
export const HOME_OVERVIEW_TEXT_COLOR = {
  /** Same value as EuiLink's `color="text"` — the default for EuiStat tiles with no
   * status color, so they match the linked KPI numbers rendered next to them. */
  text: 'var(--wz-ho-text)',
  success: 'var(--wz-ho-success-text)',
  danger: 'var(--wz-ho-danger-text)',
  warning: 'var(--wz-ho-warning-text)',
  info: 'var(--wz-ho-info-text)',
  disabled: 'var(--wz-ho-disabled-text)',
  failed: 'var(--wz-ho-failed-text)',
} as const;

/** Low-alpha washes for the score gauge's threshold zones. */
export const HOME_OVERVIEW_COLOR_TINT = {
  danger: 'var(--wz-ho-danger-tint)',
  warning: 'var(--wz-ho-warning-tint)',
  success: 'var(--wz-ho-success-tint)',
} as const;

/** Theme-neutral chrome shared by every proportional bar/list. */
export const HOME_OVERVIEW_CHROME = {
  trackBackground: 'var(--wz-ho-track-background)',
  hairline: `1px solid var(--wz-ho-hairline)`,
} as const;

/**
 * Agent-status colors, aligned with the "Findings (last 24 hours)" severity colors so both
 * visualizations read as one palette: Active↔Low, Disconnected↔Critical, Pending↔High. Used by
 * both the Home page "Agents by status" bar and the Endpoint Summary "Agents by status" chart.
 */
export const HOME_OVERVIEW_AGENT_STATUS_COLOR = {
  [API_NAME_AGENT_STATUS.ACTIVE]: HOME_OVERVIEW_COLOR.success,
  [API_NAME_AGENT_STATUS.DISCONNECTED]: HOME_OVERVIEW_COLOR.danger,
  [API_NAME_AGENT_STATUS.PENDING]: HOME_OVERVIEW_COLOR.warning,
  [API_NAME_AGENT_STATUS.NEVER_CONNECTED]: HOME_OVERVIEW_COLOR.disabled,
} as const;
