import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { I18nProvider } from '@osd/i18n/react';
import type { EmbeddableContext } from '../../../../../../../src/plugins/embeddable/public';
import type {
  ActionExecutionMeta,
  UiActionsSetup,
} from '../../../../../../../src/plugins/ui_actions/public';
import type { MissingFieldsReport } from '../../../../../common/saved-objects-missing-fields';
import { getHttp, getOverlays } from '../../../../kibana-services';
import {
  createMissingFieldsBadgeAction,
  getMissingFieldsReport,
  MissingFieldsList,
  registerMissingFieldsBadgeAction,
} from './missing-fields-badge';

jest.mock('../../../../kibana-services', () => ({
  getHttp: jest.fn(),
  getOverlays: jest.fn(),
}));

const report: MissingFieldsReport = {
  id: 'legacy',
  type: 'visualization',
  title: 'Alerts by rule group',
  indexPatternId: 'findings',
  indexPatternTitle: 'wazuh-findings-v5*',
  missing: [
    { field: 'rule.groups', usedIn: ['query', 'aggregation'] },
    { field: 'timestamp', usedIn: ['sort'] },
  ],
};

const contextFor = (savedObjectId?: string) =>
  ({
    embeddable: { getInput: () => ({ savedObjectId }) },
  } as unknown as EmbeddableContext & ActionExecutionMeta);

const post = jest.fn();

beforeEach(() => {
  post.mockReset().mockResolvedValue({ reports: [report] });
  jest
    .mocked(getHttp)
    .mockReturnValue({ post } as unknown as ReturnType<typeof getHttp>);
});

describe('getMissingFieldsReport', () => {
  it('sends one request for the panels that render together', async () => {
    const [legacy, ok] = await Promise.all([
      getMissingFieldsReport('legacy'),
      getMissingFieldsReport('ok'),
    ]);

    expect(post).toHaveBeenCalledTimes(1);
    expect(JSON.parse(post.mock.calls[0][1].body)).toEqual({
      ids: ['legacy', 'ok'],
    });
    expect(legacy).toEqual(report);
    expect(ok).toBeUndefined();
  });

  it('reports nothing when the request fails', async () => {
    post.mockRejectedValue(new Error('403'));

    expect(await getMissingFieldsReport('legacy')).toBeUndefined();
  });
});

describe('createMissingFieldsBadgeAction', () => {
  it('shows only on panels whose object uses missing fields', async () => {
    const action = createMissingFieldsBadgeAction();

    expect(await action.isCompatible(contextFor('legacy'))).toBe(true);
    expect(await action.isCompatible(contextFor('ok'))).toBe(false);
    expect(await action.isCompatible(contextFor())).toBe(false);
  });

  it('opens the list of missing fields', async () => {
    const openModal = jest.fn(() => ({ close: jest.fn() }));
    jest.mocked(getOverlays).mockReturnValue({
      openModal,
    } as unknown as ReturnType<typeof getOverlays>);

    await createMissingFieldsBadgeAction().execute(contextFor('legacy'));

    expect(openModal).toHaveBeenCalledTimes(1);
  });
});

describe('registerMissingFieldsBadgeAction', () => {
  it('attaches the action to the panel badge trigger', () => {
    const uiActions = { registerAction: jest.fn(), attachAction: jest.fn() };

    registerMissingFieldsBadgeAction(uiActions as unknown as UiActionsSetup);

    expect(uiActions.attachAction).toHaveBeenCalledWith(
      'PANEL_BADGE_TRIGGER',
      'WAZUH_MISSING_FIELDS_BADGE',
    );
  });
});

describe('MissingFieldsList', () => {
  it('names the object, the index pattern, and each field with its usage', () => {
    render(
      <I18nProvider>
        <MissingFieldsList report={report} />
      </I18nProvider>,
    );

    expect(screen.getByText('Alerts by rule group')).toBeInTheDocument();
    expect(screen.getByText('wazuh-findings-v5*')).toBeInTheDocument();
    const items = screen.getAllByRole('listitem').map(li => li.textContent);
    expect(items).toEqual([
      'rule.groups in query, aggregation',
      'timestamp in sort',
    ]);
  });
});
