import React from 'react';
import { sanitizeFormattedValue } from './sanitize-formatted-value';

export const IndexPatternFormattedField = ({ indexPattern, doc, field }) => {
  // Format the value using the field formatter
  // https://github.com/opensearch-project/OpenSearch-Dashboards/blob/2.16.0/src/plugins/discover/public/application/components/data_grid/data_grid_table_cell_value.tsx#L80-L89
  const formattedValue = indexPattern.formatField(doc, field);
  if (typeof formattedValue === 'undefined') {
    return <span>-</span>;
  } else {
    const sanitizedCellValue = sanitizeFormattedValue(formattedValue);
    return (
      // eslint-disable-next-line react/no-danger
      <span dangerouslySetInnerHTML={{ __html: sanitizedCellValue }} />
    );
  }
};
