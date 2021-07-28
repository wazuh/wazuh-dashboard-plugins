import React from 'react';
import { EuiFlexGroup } from '@elastic/eui';

export const VisConfigLayout = ({ rowClickHandler, rows = [] }) => {

  return <>
    {
      rows.map((row, key) => {
        return <EuiFlexGroup key={key} className={'wz-margin-0'} style={{
          height: row.height || ('unset')
        }}>
          {
            row.columns.map((column, key) => {
              const growthFactor = Math.max((column.width ? parseInt(column.width / 10) : 1), 1);
              return <column.component width={growthFactor} key={key} onRowClick={rowClickHandler} />
            })
          }
        </EuiFlexGroup>
      })
    }
  </>
}
