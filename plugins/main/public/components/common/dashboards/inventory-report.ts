import { IndexPattern } from '../../../../../../src/plugins/data/common';

const REPORT_AGENT_NAME_FIELD = 'wazuh.agent.name';
const REPORT_DATE_FIELD = 'state.modified_at';

/**
 * Columns of the inventory report: the endpoint name first, the visible columns, and the date the
 * state was taken last. Fields missing from the index pattern are left out.
 */
export const getInventoryReportFields = (
  visibleColumns: string[],
  indexPattern: Pick<IndexPattern, 'fields'>,
): string[] =>
  [
    REPORT_AGENT_NAME_FIELD,
    ...visibleColumns.filter(
      field => field !== REPORT_AGENT_NAME_FIELD && field !== REPORT_DATE_FIELD,
    ),
    REPORT_DATE_FIELD,
  ].filter(field => indexPattern.fields.getByName(field));

/**
 * File name of an inventory export, taken from the table id:
 * `it-hygiene-inventory-packages` → `packages`, `fim-files-inventory` → `fim-files`.
 */
export const getInventoryExportFileName = (tableId: string): string =>
  tableId.replace(/^it-hygiene-inventory-/, '').replace(/-inventory$/, '');
