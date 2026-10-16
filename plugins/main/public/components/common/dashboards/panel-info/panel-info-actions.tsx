import React from 'react';
import { EuiButtonIcon, EuiToolTip } from '@elastic/eui';
import {
  EmbeddableContext,
  PANEL_NOTIFICATION_TRIGGER,
} from '../../../../../../../src/plugins/embeddable/public';
import {
  createAction,
  UiActionsSetup,
} from '../../../../../../../src/plugins/ui_actions/public';
import { reactToUiComponent } from '../../../../../../../src/plugins/opensearch_dashboards_react/public';
import './panel-info-actions.scss';

export interface PanelInfo {
  savedObjectId: string;
  getLabel: () => string;
  getContent: () => string;
}

export const PanelInfoButton = ({
  savedObjectId,
  getLabel,
  getContent,
}: PanelInfo) => (
  <EuiToolTip content={getContent()} position='top'>
    <EuiButtonIcon
      iconType='iInCircle'
      color='subdued'
      aria-label={getLabel()}
      data-test-subj={`wzPanelInfo-${savedObjectId}`}
    />
  </EuiToolTip>
);

export const createPanelInfoAction = (info: PanelInfo) =>
  createAction({
    id: `WAZUH_PANEL_INFO_${info.savedObjectId}`,
    type: '',
    getDisplayName: info.getLabel,
    getIconType: () => 'iInCircle',
    // The panel header renders MenuItem without the panel context, so each panel gets its own action.
    MenuItem: reactToUiComponent(() => <PanelInfoButton {...info} />),
    isCompatible: context =>
      Promise.resolve(
        (context as EmbeddableContext).embeddable?.getInput()?.savedObjectId ===
          info.savedObjectId,
      ),
    execute: async () => {},
  });

export const registerPanelInfoActions = (
  uiActions: UiActionsSetup,
  infos: PanelInfo[],
) => {
  infos.forEach(info => {
    const action = createPanelInfoAction(info);
    uiActions.registerAction(action);
    uiActions.attachAction(PANEL_NOTIFICATION_TRIGGER, action.id);
  });
};
