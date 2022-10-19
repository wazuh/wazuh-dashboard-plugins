import { EuiBasicTable } from '@elastic/eui';
import React from 'react';

type Props = {
  policies: any[];
  columns: any[];
  rowProps?: any;
  loading?: boolean;
};

export default function SCAPoliciesTable(props: Props) {
  const { policies, columns, rowProps, loading = false } = props;

  const getPoliciesRowProps = (item, idx) => {
    return {
      'data-test-subj': `sca-row-${idx}`,
      className: 'customRowClass',
      onClick: rowProps ? () => rowProps(item) : null
    }
  }

  return (
    <>
      <EuiBasicTable loading={loading} items={policies} columns={columns} rowProps={getPoliciesRowProps} />
    </>
  );
}
