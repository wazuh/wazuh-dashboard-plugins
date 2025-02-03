import React from 'react';

export function idExtractor(table: { [x: string]: any }): string[] {
  return Object.values(table)
    .flatMap(panel => {
      if (!panel.explicitInput?.savedVis?.data?.aggs) {
        console.warn(`No aggs found in panel ${panel.explicitInput?.id}`);
        return [];
      }
      return panel.explicitInput.savedVis.data.aggs;
    })
    .map(agg => {
      return agg.params?.field;
    })
    .filter(Boolean);
}

export function compareColumnsValue(knownColumns, columnsToCompare) {
  const unmatchedColumns = columnsToCompare.filter(
    column =>
      !knownColumns.some(
        knowColumn =>
          knowColumn.name === column.id ||
          knowColumn.name === column.name ||
          knowColumn.name === column.field ||
          knowColumn.name === column,
      ),
  );
  return unmatchedColumns.length === 0
    ? true
    : `These columns don't match: ${unmatchedColumns
        .map(column => column.id || column.name || column.field || column)
        .join(', ')}`;
}
