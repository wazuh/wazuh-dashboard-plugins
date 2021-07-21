import React from 'react';
import { EuiFlexGroup, EuiFlexItem, EuiButtonEmpty } from '@elastic/eui';

export const OfficeDrilldown = ({ changeView, rows = [], ...props }) => {

  return <>
    <EuiFlexGroup>
      <EuiFlexItem grow={false}>
        <div><EuiButtonEmpty onClick={()=>changeView()} iconType={"sortLeft"}>Go Back</EuiButtonEmpty></div>
      </EuiFlexItem>
    </EuiFlexGroup>
    {
      rows.map((row, key) => {
        return <EuiFlexGroup key={key} style={{
          height: row.height || (150 + 'px')
        }}>
          {
            row.columns.map((column, key) => {
              const growthFactor = Math.max((column.width ? parseInt(column.width / 10) : 1), 1);
                
                return <EuiFlexItem key={key} grow={growthFactor}>
                  <column.component onRowClick={()=>changeView('main')}/>
                </EuiFlexItem>
            })
          }
        </EuiFlexGroup>
      })
    }
  </>
}