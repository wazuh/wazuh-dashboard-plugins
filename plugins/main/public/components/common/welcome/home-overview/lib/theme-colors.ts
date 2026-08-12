/**
 * Theme-aware replacements for `UI_COLOR_STATUS` (`common/constants.ts`), scoped to the
 * home-overview visualizations. Each value is a CSS custom property defined on `.wzHomeOverview`
 * (see `../home-overview.scss`) rather than a frozen hex literal, so it resolves to the correct
 * light/dark color per OSD's `theme:darkMode` setting instead of staying fixed regardless of
 * theme.
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
