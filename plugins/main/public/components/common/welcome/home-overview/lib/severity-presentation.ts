import { SeverityBand } from '../interfaces/types';
import { i18n } from '@osd/i18n';
import { HOME_OVERVIEW_COLOR, HOME_OVERVIEW_TEXT_COLOR } from './theme-colors';

export interface SeverityPresentation {
  band: SeverityBand;
  label: string;
  color: string;
}

/**
 * Label and color per band, shared by every severity visualization. Colors come from
 * `HOME_OVERVIEW_COLOR` (theme-aware CSS custom properties) rather than the frozen hex in
 * `UI_COLOR_STATUS`.
 */
export const SEVERITY_PRESENTATION: SeverityPresentation[] = [
  {
    band: 'critical',
    label: i18n.translate('wazuh.homeOverview.severity.critical', {
      defaultMessage: 'Critical severity',
    }),
    color: HOME_OVERVIEW_COLOR.danger,
  },
  {
    band: 'high',
    label: i18n.translate('wazuh.homeOverview.severity.high', {
      defaultMessage: 'High severity',
    }),
    color: HOME_OVERVIEW_COLOR.warning,
  },
  {
    band: 'medium',
    label: i18n.translate('wazuh.homeOverview.severity.medium', {
      defaultMessage: 'Medium severity',
    }),
    color: HOME_OVERVIEW_COLOR.info,
  },
  {
    band: 'low',
    label: i18n.translate('wazuh.homeOverview.severity.low', {
      defaultMessage: 'Low severity',
    }),
    color: HOME_OVERVIEW_COLOR.success,
  },
  {
    band: 'informational',
    label: i18n.translate('wazuh.homeOverview.severity.informational', {
      defaultMessage: 'Informational severity',
    }),
    color: HOME_OVERVIEW_TEXT_COLOR.text,
  },
];
