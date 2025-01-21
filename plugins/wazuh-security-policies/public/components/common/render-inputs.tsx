import React from 'react';
import { EuiBasicTable } from '@elastic/eui';

const inputArray = (input: any) => {
  const inputs = input.map((item: any) => {
    Object.entries(item).map(([key, value]) => ({ key, value }));
  });
  const columns = [
    {
      field: 'key',
      name: 'Fields',
    },
    {
      field: 'value',
      name: 'Conditions',
    },
  ];

  return <EuiBasicTable items={inputs} columns={columns} />;
};

export const renderInputs = input => inputArray(input);
