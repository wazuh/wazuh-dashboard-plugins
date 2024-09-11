import { EuiDataGridColumnCellActionProps } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import React from 'react';
import {
  IFieldType,
  IndexPattern,
} from '../../../../../../src/plugins/data/common';
import { FILTER_OPERATOR } from '../data-source';

// https://github.com/opensearch-project/OpenSearch-Dashboards/blob/2.13.0/src/plugins/discover/public/application/components/data_grid/data_grid_table_cell_actions.tsx
export function getCellActions(
  field: IFieldType,
  indexPattern: IndexPattern,
  rows: any[],
  onFilter: (
    columndId: string,
    value: any,
    operation: FILTER_OPERATOR.IS | FILTER_OPERATOR.IS_NOT,
  ) => void,
) {
  let cellActions:
    | (({
        rowIndex,
        columnId,
        Component,
      }: EuiDataGridColumnCellActionProps) => React.JSX.Element)[]
    | undefined = undefined;
  if (field.filterable) {
    cellActions = [
      ({ rowIndex, columnId, Component }: EuiDataGridColumnCellActionProps) => {
        const filterForValueText = i18n.translate('discover.filterForValue', {
          defaultMessage: 'Filter for value',
        });
        const filterForValueLabel = i18n.translate(
          'discover.filterForValueLabel',
          {
            defaultMessage: 'Filter for value: {value}',
            values: { value: columnId },
          },
        );

        return (
          <Component
            onClick={() => {
              const row = rows[rowIndex];
              const flattened = indexPattern.flattenHit(row);

              if (flattened) {
                onFilter(columnId, flattened[columnId], FILTER_OPERATOR.IS);
              }
            }}
            iconType='plusInCircle'
            aria-label={filterForValueLabel}
            data-test-subj='filterForValue'
          >
            {filterForValueText}
          </Component>
        );
      },
      ({ rowIndex, columnId, Component }: EuiDataGridColumnCellActionProps) => {
        const filterOutValueText = i18n.translate('discover.filterOutValue', {
          defaultMessage: 'Filter out value',
        });
        const filterOutValueLabel = i18n.translate(
          'discover.filterOutValueLabel',
          {
            defaultMessage: 'Filter out value: {value}',
            values: { value: columnId },
          },
        );

        return (
          <Component
            onClick={() => {
              const row = rows[rowIndex];
              const flattened = indexPattern.flattenHit(row);

              if (flattened) {
                onFilter(columnId, flattened[columnId], FILTER_OPERATOR.IS_NOT);
              }
            }}
            iconType='minusInCircle'
            aria-label={filterOutValueLabel}
            data-test-subj='filterOutValue'
          >
            {filterOutValueText}
          </Component>
        );
      },
    ];
  }
  return cellActions;
}
