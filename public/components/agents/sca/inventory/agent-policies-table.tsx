import React from 'react';
import { TableWzAPI } from '../../../common/tables/table-wz-api';

type Props = {
  columns: any[];
  rowProps?: any;
  agent: { [key in string]: any };
  tableProps?: any;
};

export default function SCAPoliciesTable(props: Props) {
  const { columns, rowProps, agent, tableProps } = props;

  const getPoliciesRowProps = (item: any, idx: string) => {
    return {
      'data-test-subj': `sca-row-${idx}`,
      className: 'customRowClass',
      onClick: rowProps ? () => rowProps(item) : null
    }
  }

  return (
    <>
      <TableWzAPI 
        tableInitialSortingField="policy_id"
        endpoint={`/sca/${agent.id}`} 
        tableColumns={columns} 
        rowProps={getPoliciesRowProps}
        { ...tableProps}
        />
    </>
  );
}
