import React, { useMemo } from 'react';
import { EuiInMemoryTable, EuiSpacer } from '@elastic/eui';
import { sortBy } from 'lodash';

export function flatten(obj: any) {
  return Object.entries(obj).map(([key, value]) => ({
    key,
    value: JSON.stringify(value),
  }));
}

const columns = [
  {
    field: 'key',
    name: 'Key',
  },
  {
    field: 'value',
    name: 'Value',
  },
];

export const AssetViewer: React.FC<{
  content: string;
}> = ({ content }) => {
  const flattenContent = useMemo(
    () => sortBy(flatten(content), 'key'),
    [content],
  );

  const search = {
    box: {
      incremental: true,
      schema: true,
    },
  };
  return (
    <>
      <EuiSpacer />
      <EuiInMemoryTable
        search={search}
        items={flattenContent}
        columns={columns}
      ></EuiInMemoryTable>
    </>
  );
};
