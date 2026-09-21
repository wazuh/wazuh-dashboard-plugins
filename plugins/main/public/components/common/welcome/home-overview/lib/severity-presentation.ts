import { SeverityBand } from '../interfaces/types';
import { i18n } from '@osd/i18n';
import { HOME_OVERVIEW_COLOR, HOME_OVERVIEW_TEXT_COLOR } from './theme-colors';

export interface SeverityPresentation {
  band: SeverityBand;
  readonly label: string;
  color: string;
}

/**
 * Label and color per band, shared by every severity visualization. Colors come from
 * `HOME_OVERVIEW_COLOR` (theme-aware CSS custom properties) rather than the frozen hex in
 * `UI_COLOR_STATUS`.
 *
 * Labels are getters so `i18n.translate` runs when the tile renders, after the locale
 * catalog is applied. Evaluating at module load freezes English defaultMessages (and
 * leaves a leftover "severity" if the browser later translates only the adjective).
 */
export const SEVERITY_PRESENTATION: SeverityPresentation[] = [
  {
    band: 'critical',
    get label() {
      return i18n.translate('wazuh.homeOverview.severity.critical', {
        defaultMessage: 'Critical severity',
      });
    },
    color: HOME_OVERVIEW_COLOR.danger,
  },
  {
    band: 'high',
    get label() {
      return i18n.translate('wazuh.homeOverview.severity.high', {
        defaultMessage: 'High severity',
      });
    },
    color: HOME_OVERVIEW_COLOR.warning,
  },
  {
    band: 'medium',
    get label() {
      return i18n.translate('wazuh.homeOverview.severity.medium', {
        defaultMessage: 'Medium severity',
      });
    },
    color: HOME_OVERVIEW_COLOR.info,
  },
  {
    band: 'low',
    get label() {
      return i18n.translate('wazuh.homeOverview.severity.low', {
        defaultMessage: 'Low severity',
      });
    },
    color: HOME_OVERVIEW_COLOR.success,
  },
  {
    band: 'informational',
    get label() {
      return i18n.translate('wazuh.homeOverview.severity.informational', {
        defaultMessage: 'Informational severity',
      });
    },
    color: HOME_OVERVIEW_TEXT_COLOR.text,
  },
];
