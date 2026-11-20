import React from 'react';
import {
  EuiButton,
  EuiModalBody,
  EuiModalFooter,
  EuiModalHeader,
  EuiModalHeaderTitle,
  EuiSpacer,
  EuiText,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { FormattedMessage } from '@osd/i18n/react';
import {
  EmbeddableContext,
  PANEL_BADGE_TRIGGER,
} from '../../../../../../../src/plugins/embeddable/public';
import {
  createAction,
  UiActionsSetup,
} from '../../../../../../../src/plugins/ui_actions/public';
import { toMountPoint } from '../../../../../../../src/plugins/opensearch_dashboards_react/public';
import {
  FieldUsage,
  MissingFieldsReport,
  SAVED_OBJECTS_MISSING_FIELDS_MAX_IDS,
  SAVED_OBJECTS_MISSING_FIELDS_ROUTE,
} from '../../../../../common/saved-objects-missing-fields';
import { getHttp, getOverlays } from '../../../../kibana-services';

export const MISSING_FIELDS_BADGE_ACTION = 'WAZUH_MISSING_FIELDS_BADGE';
// Dashboard panels mount over a few ticks; one request covers them all.
const BATCH_WINDOW_MS = 50;
const SCANNED_TYPES = ['visualization', 'search'];

const getUsageLabels = (): Record<FieldUsage, string> => ({
  query: i18n.translate('wazuh.missingFieldsBadge.usage.query', {
    defaultMessage: 'query',
  }),
  filter: i18n.translate('wazuh.missingFieldsBadge.usage.filter', {
    defaultMessage: 'filter',
  }),
  aggregation: i18n.translate('wazuh.missingFieldsBadge.usage.aggregation', {
    defaultMessage: 'aggregation',
  }),
  column: i18n.translate('wazuh.missingFieldsBadge.usage.column', {
    defaultMessage: 'column',
  }),
  sort: i18n.translate('wazuh.missingFieldsBadge.usage.sort', {
    defaultMessage: 'sort',
  }),
});

async function fetchReports(ids: string[]): Promise<MissingFieldsReport[]> {
  const chunks: string[][] = [];
  for (let i = 0; i < ids.length; i += SAVED_OBJECTS_MISSING_FIELDS_MAX_IDS) {
    chunks.push(ids.slice(i, i + SAVED_OBJECTS_MISSING_FIELDS_MAX_IDS));
  }
  const responses = await Promise.all(
    chunks.map(chunk =>
      getHttp().post(SAVED_OBJECTS_MISSING_FIELDS_ROUTE, {
        body: JSON.stringify({ ids: chunk }),
      }),
    ),
  );

  return responses.flatMap(({ reports }) => reports as MissingFieldsReport[]);
}

let batch: {
  ids: Set<string>;
  reports: Promise<MissingFieldsReport[]>;
} | null = null;

function requestReports(id: string): Promise<MissingFieldsReport[]> {
  if (!batch) {
    const ids = new Set<string>();
    const reports = new Promise(resolve => setTimeout(resolve, BATCH_WINDOW_MS))
      .then(() => {
        batch = null;
        return fetchReports([...ids]);
      })
      .catch(error => {
        console.warn(
          'Could not check the fields of the dashboard panels',
          error,
        );
        throw error;
      });
    batch = { ids, reports };
  }
  batch.ids.add(id);

  return batch.reports;
}

// Panels re-check the badge on every query, time range or refresh change, so reports are
// kept per dashboard: opening or reloading a dashboard creates a new one and checks again.
const cache = new WeakMap<
  object,
  Map<string, Promise<MissingFieldsReport | undefined>>
>();

/**
 * The report of one visualization or saved search on a dashboard (`scope`). Panels that
 * render together share one request.
 */
export function getMissingFieldsReport(
  id: string,
  type: string,
  scope: object,
): Promise<MissingFieldsReport | undefined> {
  if (!cache.has(scope)) {
    cache.set(scope, new Map());
  }
  const reports = cache.get(scope)!;
  const key = `${type}:${id}`;
  if (!reports.has(key)) {
    reports.set(
      key,
      requestReports(id).then(
        found => found.find(report => report.id === id && report.type === type),
        () => {
          reports.delete(key);
          return undefined;
        },
      ),
    );
  }

  return reports.get(key)!;
}

export const MissingFieldsList = ({
  report,
}: {
  report: MissingFieldsReport;
}) => {
  const usageLabels = getUsageLabels();

  return (
    <EuiText size='s'>
      <p>
        <FormattedMessage
          id='wazuh.missingFieldsBadge.modal.summary'
          defaultMessage='{title} uses fields that the {indexPattern} index pattern does not have, so it may show no data or wrong data:'
          values={{
            title: <strong>{report.title}</strong>,
            indexPattern: <code>{report.indexPatternTitle}</code>,
          }}
        />
      </p>
      <ul data-test-subj='wzMissingFieldsList'>
        {report.missing.map(({ field, usedIn }) => (
          <li key={field}>
            <FormattedMessage
              id='wazuh.missingFieldsBadge.modal.field'
              defaultMessage='{field} in {usage}'
              values={{
                field: <code>{field}</code>,
                usage: usedIn.map(usage => usageLabels[usage]).join(', '),
              }}
            />
          </li>
        ))}
      </ul>
      <EuiSpacer size='s' />
      <p>
        <FormattedMessage
          id='wazuh.missingFieldsBadge.modal.remediation'
          defaultMessage='Edit it to use fields that exist. If a field exists in the indexer, refresh the field list of the index pattern in Dashboards Management > Index patterns.'
        />
      </p>
    </EuiText>
  );
};

function openMissingFieldsModal(report: MissingFieldsReport) {
  const modal = getOverlays().openModal(
    toMountPoint(
      <>
        <EuiModalHeader>
          <EuiModalHeaderTitle>
            <FormattedMessage
              id='wazuh.missingFieldsBadge.modal.title'
              defaultMessage='Missing fields'
            />
          </EuiModalHeaderTitle>
        </EuiModalHeader>
        <EuiModalBody>
          <MissingFieldsList report={report} />
        </EuiModalBody>
        <EuiModalFooter>
          <EuiButton fill onClick={() => modal.close()}>
            <FormattedMessage
              id='wazuh.missingFieldsBadge.modal.close'
              defaultMessage='Close'
            />
          </EuiButton>
        </EuiModalFooter>
      </>,
    ),
  );
}

// Panels that fail to render become error embeddables: they keep their input, and the
// dashboard keeps the panel type.
function getPanelReport(
  context: unknown,
): Promise<MissingFieldsReport | undefined> {
  const embeddable = (context as EmbeddableContext)?.embeddable;
  const id = (embeddable?.getInput() as { savedObjectId?: string } | undefined)
    ?.savedObjectId;
  const panels = (
    embeddable?.parent?.getInput() as
      | { panels?: Record<string, { type?: string }> }
      | undefined
  )?.panels;
  const type = panels?.[embeddable.id]?.type ?? embeddable?.type;

  return id && SCANNED_TYPES.includes(type)
    ? getMissingFieldsReport(id, type, embeddable.parent ?? embeddable)
    : Promise.resolve(undefined);
}

export const createMissingFieldsBadgeAction = () =>
  createAction({
    id: MISSING_FIELDS_BADGE_ACTION,
    type: '',
    getDisplayName: () =>
      i18n.translate('wazuh.missingFieldsBadge.label', {
        defaultMessage: 'Missing fields',
      }),
    getIconType: () => 'alert',
    isCompatible: async context => Boolean(await getPanelReport(context)),
    execute: async context => {
      const report = await getPanelReport(context);
      if (report) {
        openMissingFieldsModal(report);
      }
    },
  });

export const registerMissingFieldsBadgeAction = (uiActions: UiActionsSetup) => {
  const action = createMissingFieldsBadgeAction();
  uiActions.registerAction(action);
  uiActions.attachAction(PANEL_BADGE_TRIGGER, action.id);
};
