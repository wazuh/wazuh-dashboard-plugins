import { scaPanelInfos } from '../../../overview/sca/utils/result-definitions';
import { PanelInfo } from './panel-info-actions';

/**
 * Info buttons shown in the header of the dashboard panels, registered once by the plugin.
 * A module adds its own list by importing it here and spreading it into this array.
 */
export const panelInfos: PanelInfo[] = [...scaPanelInfos];
