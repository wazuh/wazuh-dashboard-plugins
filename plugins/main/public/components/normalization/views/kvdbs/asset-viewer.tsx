import React, { useMemo } from 'react';
import { EuiInMemoryTable, EuiSpacer } from '@elastic/eui';
import { sortBy } from 'lodash';

export function flatten(
  obj: any,
  parentKey: string = '',
  result: { key: string; value: any }[] = [],
) {
  for (let key in obj) {
    let newKey = parentKey ? `${parentKey}.${key}` : key;
    if (Array.isArray(obj[key])) {
      obj[key].forEach((val, i) => {
        result.push({ key: `${newKey}[${i}]`, value: val });
      });
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      flatten(obj[key], newKey, result);
    } else {
      result.push({ key: newKey, value: obj[key] });
    }
  }
  return result;
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
