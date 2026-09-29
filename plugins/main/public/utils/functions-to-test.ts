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
