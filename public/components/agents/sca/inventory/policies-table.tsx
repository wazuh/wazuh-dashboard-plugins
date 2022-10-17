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

  const handleOnClick = (policy_id) => {
    rowProps(policy_id)
  }

  const getPoliciesRowProps = (item, idx) => {
    return {
      'data-test-subj': `sca-row-${idx}`,
      className: 'customRowClass',
      //This logic is necessary because when you click on a row in the table, it redirects you to a url that receives
      //a parameter and displays the desired table.
      onClick: rowProps ? () => handleOnClick(item.policy_id) : () => console.log('no row'),
    };
  };

  return (
    <>
      <EuiBasicTable items={policies} columns={columns} rowProps={getPoliciesRowProps} />
    </>
  );
}
