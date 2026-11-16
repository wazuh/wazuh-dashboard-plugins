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
  SAVED_OBJECTS_MISSING_FIELDS_ROUTE,
} from '../../../../../common/saved-objects-missing-fields';
import { getHttp, getOverlays } from '../../../../kibana-services';

export const MISSING_FIELDS_BADGE_ACTION = 'WAZUH_MISSING_FIELDS_BADGE';
// Dashboard panels mount over a few ticks; one request covers them all.
const BATCH_WINDOW_MS = 50;

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

let batch: {
  ids: Set<string>;
  reports: Promise<MissingFieldsReport[]>;
} | null = null;

/** The report of one panel. Panels that render together share one request. */
export function getMissingFieldsReport(
  id: string,
): Promise<MissingFieldsReport | undefined> {
  if (!batch) {
    const ids = new Set<string>();
    const reports = new Promise(resolve =>
      setTimeout(resolve, BATCH_WINDOW_MS),
    ).then(() => {
      batch = null;
      return getHttp()
        .post(SAVED_OBJECTS_MISSING_FIELDS_ROUTE, {
          body: JSON.stringify({ ids: [...ids] }),
        })
        .then(({ reports }) => reports as MissingFieldsReport[])
        .catch(() => []);
    });
    batch = { ids, reports };
  }
  batch.ids.add(id);

  return batch.reports.then(reports =>
    reports.find(report => report.id === id),
  );
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
          defaultMessage='{title} uses fields that the {indexPattern} index pattern does not have, so it shows no data:'
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

// Panels that fail to render become error embeddables, which keep their input.
const getSavedObjectId = (context: unknown): string | undefined =>
  (
    (context as EmbeddableContext)?.embeddable?.getInput() as
      | { savedObjectId?: string }
      | undefined
  )?.savedObjectId;

export const createMissingFieldsBadgeAction = () =>
  createAction({
    id: MISSING_FIELDS_BADGE_ACTION,
    type: '',
    getDisplayName: () =>
      i18n.translate('wazuh.missingFieldsBadge.label', {
        defaultMessage: 'Missing fields',
      }),
    getIconType: () => 'alert',
    isCompatible: async context => {
      const id = getSavedObjectId(context);
      return Boolean(id && (await getMissingFieldsReport(id)));
    },
    execute: async context => {
      const id = getSavedObjectId(context);
      const report = id && (await getMissingFieldsReport(id));
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
