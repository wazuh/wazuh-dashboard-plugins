import {
  EuiDataGridColumn,
  EuiDataGridColumnCellActionProps,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import React from 'react';
import {
  IFieldType,
  IndexPattern,
} from '../../../../../../src/plugins/data/common';
import { FILTER_OPERATOR } from '../data-source/pattern/pattern-data-source-filter-manager';

export const filterIsAction = (
  indexPattern: IndexPattern,
  rows: any[],
  pageSize: number,
  onFilter: (
    field: string,
    operation: FILTER_OPERATOR.IS | FILTER_OPERATOR.IS_NOT,
    value?: any,
  ) => void,
) => {
  return ({
    rowIndex,
    columnId: field,
    Component,
  }: EuiDataGridColumnCellActionProps) => {
    const filterForValueText = i18n.translate('discover.filterForValue', {
      defaultMessage: 'Filter for value',
    });
    const filterForValueLabel = i18n.translate('discover.filterForValueLabel', {
      defaultMessage: 'Filter for value: {value}',
      values: { value: field },
    });

    const handleClick = () => {
      const row = rows[rowIndex % pageSize];
      const flattened = indexPattern.flattenHit(row);

      if (flattened) {
        onFilter(field, FILTER_OPERATOR.IS, flattened[field]);
      }
    };

    return (
      <Component
        onClick={handleClick}
        iconType='plusInCircle'
        aria-label={filterForValueLabel}
        data-test-subj='filterForValue'
      >
        {filterForValueText}
      </Component>
    );
  };
};

export const filterIsNotAction =
  (
    indexPattern: IndexPattern,
    rows: any[],
    pageSize: number,
    onFilter: (
      field: string,
      operation: FILTER_OPERATOR.IS | FILTER_OPERATOR.IS_NOT,
      value?: any,
    ) => void,
  ) =>
  ({
    rowIndex,
    columnId: field,
    Component,
  }: EuiDataGridColumnCellActionProps) => {
    const filterOutValueText = i18n.translate('discover.filterOutValue', {
      defaultMessage: 'Filter out value',
    });
    const filterOutValueLabel = i18n.translate('discover.filterOutValueLabel', {
      defaultMessage: 'Filter out value: {value}',
      values: { value: field },
    });

    const handleClick = () => {
      const row = rows[rowIndex % pageSize];
      const flattened = indexPattern.flattenHit(row);

      if (flattened) {
        onFilter(field, FILTER_OPERATOR.IS_NOT, flattened[field]);
      }
    };

    return (
      <Component
        onClick={handleClick}
        iconType='minusInCircle'
        aria-label={filterOutValueLabel}
        data-test-subj='filterOutValue'
      >
        {filterOutValueText}
      </Component>
    );
  };

// https://github.com/opensearch-project/OpenSearch-Dashboards/blob/2.13.0/src/plugins/discover/public/application/components/data_grid/data_grid_table_cell_actions.tsx
export function cellFilterActions(
  field: IFieldType,
  indexPattern: IndexPattern,
  rows: any[],
  pageSize: number,
  onFilter: (
    field: string,
    operation: FILTER_OPERATOR.IS | FILTER_OPERATOR.IS_NOT,
    value: any,
  ) => void,
) {
  if (!field.filterable) return;

  return [
    filterIsAction(indexPattern, rows, pageSize, onFilter),
    filterIsNotAction(indexPattern, rows, pageSize, onFilter),
  ] as EuiDataGridColumn['cellActions'];
}
