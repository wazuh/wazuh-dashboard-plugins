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

export function clusterQExtractor(table: { [x: string]: any }): string[] {
  return Object.values(table)
    .flatMap(panel => {
      if (!panel.explicitInput?.savedVis?.params?.expression) {
        console.warn(`No expression found in panel ${panel.explicitInput?.id}`);
        return [];
      }
      return panel.explicitInput.savedVis.params.expression;
    })
    .flatMap(exp => {
      const matches = [...exp.matchAll(/q="(.*?)"/g)];
      return matches.map(match => {
        const valorQ = match[1];
        if (!valorQ) return '';
        const primeraCondicion = valorQ.split('AND')[0].trim();
        const nombreCampo = primeraCondicion.split(':')[0].trim();
        return nombreCampo;
      });
    })
    .filter(Boolean);
}

export function compareColumnsValue(
  knownColumns: { [x: string]: any }[],
  columnsToCompare: any[],
): true | string {
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
