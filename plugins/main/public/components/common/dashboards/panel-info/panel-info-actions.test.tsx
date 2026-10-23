import '@testing-library/jest-dom';
import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { EmbeddableContext } from '../../../../../../../src/plugins/embeddable/public';
import type { UiActionsSetup } from '../../../../../../../src/plugins/ui_actions/public';
import {
  createPanelInfoAction,
  PanelInfo,
  PanelInfoButton,
  registerPanelInfoActions,
} from './panel-info-actions';

const info: PanelInfo = {
  savedObjectId: 'check_score',
  getLabel: () => 'About the score',
  getContent: () => 'Score definition',
};

const contextFor = (savedObjectId?: string) =>
  ({
    embeddable: { getInput: () => ({ savedObjectId }) },
  } as unknown as EmbeddableContext);

describe('createPanelInfoAction', () => {
  it('is compatible only with the panel of its saved object', async () => {
    const action = createPanelInfoAction(info);

    expect(await action.isCompatible(contextFor('check_score'))).toBe(true);
    expect(await action.isCompatible(contextFor('check_result_passed'))).toBe(
      false,
    );
    expect(await action.isCompatible(contextFor())).toBe(false);
  });
});

describe('registerPanelInfoActions', () => {
  it('registers and attaches one action per panel to the notification trigger', () => {
    const uiActions = { registerAction: jest.fn(), attachAction: jest.fn() };

    registerPanelInfoActions(uiActions as unknown as UiActionsSetup, [
      info,
      { ...info, savedObjectId: 'check_result_failed' },
    ]);

    expect(uiActions.registerAction).toHaveBeenCalledTimes(2);
    expect(uiActions.attachAction.mock.calls).toEqual([
      ['PANEL_NOTIFICATION_TRIGGER', 'WAZUH_PANEL_INFO_check_score'],
      ['PANEL_NOTIFICATION_TRIGGER', 'WAZUH_PANEL_INFO_check_result_failed'],
    ]);
  });
});

describe('PanelInfoButton', () => {
  it('shows the definition when the button gets keyboard focus', async () => {
    render(<PanelInfoButton {...info} />);

    const button = screen.getByRole('button', { name: 'About the score' });
    fireEvent.focus(button);

    await waitFor(() =>
      expect(screen.getByText('Score definition')).toBeInTheDocument(),
    );
  });
});
