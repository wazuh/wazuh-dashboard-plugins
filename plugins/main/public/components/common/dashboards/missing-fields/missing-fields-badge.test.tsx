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

const dashboard = { getInput: () => ({ panels: {} }) };

const contextFor = (savedObjectId?: string, type = 'visualization') =>
  ({
    embeddable: {
      type,
      getInput: () => ({ savedObjectId }),
      parent: dashboard,
    },
  } as unknown as EmbeddableContext & ActionExecutionMeta);

const post = jest.fn();
const reportFor = (id: string): MissingFieldsReport => ({ ...report, id });

// Reports are cached by id, so each test uses its own ids.
beforeEach(() => {
  post.mockReset().mockImplementation((_path, { body }) =>
    Promise.resolve({
      reports: JSON.parse(body)
        .ids.filter((id: string) => id.startsWith('legacy'))
        .map(reportFor),
    }),
  );
  jest
    .mocked(getHttp)
    .mockReturnValue({ post } as unknown as ReturnType<typeof getHttp>);
});

describe('getMissingFieldsReport', () => {
  it('sends one request for the panels that render together', async () => {
    const [legacy, ok] = await Promise.all([
      getMissingFieldsReport('legacy-1', 'visualization', dashboard),
      getMissingFieldsReport('ok-1', 'visualization', dashboard),
    ]);

    expect(post).toHaveBeenCalledTimes(1);
    expect(JSON.parse(post.mock.calls[0][1].body)).toEqual({
      ids: ['legacy-1', 'ok-1'],
    });
    expect(legacy).toEqual(reportFor('legacy-1'));
    expect(ok).toBeUndefined();
  });

  it('matches the report on the type of the object', async () => {
    expect(
      await getMissingFieldsReport('legacy-2', 'search', dashboard),
    ).toBeUndefined();
  });

  it('reuses a report on the same dashboard and checks again on a new one', async () => {
    await getMissingFieldsReport('legacy-3', 'visualization', dashboard);
    await getMissingFieldsReport('legacy-3', 'visualization', dashboard);
    expect(post).toHaveBeenCalledTimes(1);

    await getMissingFieldsReport('legacy-3', 'visualization', {});
    expect(post).toHaveBeenCalledTimes(2);
  });

  it('splits large batches into requests the route accepts', async () => {
    const ids = Array.from({ length: 501 }, (_, i) => `legacy-4-${i}`);

    const reports = await Promise.all(
      ids.map(id => getMissingFieldsReport(id, 'visualization', dashboard)),
    );

    expect(
      post.mock.calls.map(([, { body }]) => JSON.parse(body).ids.length),
    ).toEqual([500, 1]);
    expect(reports.every(Boolean)).toBe(true);
  });

  it('logs a failed request, reports nothing and retries next time', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    post.mockRejectedValueOnce(new Error('403'));

    expect(
      await getMissingFieldsReport('legacy-5', 'visualization', dashboard),
    ).toBeUndefined();
    expect(warn).toHaveBeenCalledTimes(1);
    expect(
      await getMissingFieldsReport('legacy-5', 'visualization', dashboard),
    ).toEqual(reportFor('legacy-5'));
    warn.mockRestore();
  });
});

describe('createMissingFieldsBadgeAction', () => {
  it('shows only on visualization and saved search panels that use missing fields', async () => {
    const action = createMissingFieldsBadgeAction();

    expect(await action.isCompatible(contextFor('legacy-6'))).toBe(true);
    expect(await action.isCompatible(contextFor('ok-6'))).toBe(false);
    expect(await action.isCompatible(contextFor())).toBe(false);
    expect(await action.isCompatible(contextFor('legacy-7', 'map'))).toBe(
      false,
    );
    expect(post.mock.calls.map(([, { body }]) => body)).not.toContainEqual(
      expect.stringContaining('legacy-7'),
    );
  });

  it('shows on panels that failed to render, using the dashboard panel type', async () => {
    const context = {
      embeddable: {
        id: 'panel-1',
        type: 'error',
        getInput: () => ({ savedObjectId: 'legacy-9' }),
        parent: {
          getInput: () => ({ panels: { 'panel-1': { type: 'search' } } }),
        },
      },
    } as unknown as EmbeddableContext & ActionExecutionMeta;
    post.mockResolvedValueOnce({
      reports: [{ ...reportFor('legacy-9'), type: 'search' }],
    });

    expect(await createMissingFieldsBadgeAction().isCompatible(context)).toBe(
      true,
    );
  });

  it('opens the list of missing fields without a new request', async () => {
    const openModal = jest.fn(() => ({ close: jest.fn() }));
    jest.mocked(getOverlays).mockReturnValue({
      openModal,
    } as unknown as ReturnType<typeof getOverlays>);
    const action = createMissingFieldsBadgeAction();

    await action.isCompatible(contextFor('legacy-8'));
    await action.execute(contextFor('legacy-8'));

    expect(openModal).toHaveBeenCalledTimes(1);
    expect(post).toHaveBeenCalledTimes(1);
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
