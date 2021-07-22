import React from 'react';
import { EuiFlexGroup, EuiFlexItem, EuiButtonEmpty, EuiTitle } from '@elastic/eui';
import { SecurityAlerts } from '../../../visualize/components';

export const OfficeDrilldown = ({ changeView, rows = [], ...props }) => {

  return <>
    <EuiFlexGroup>
      <EuiFlexItem grow={false}>
        <div><EuiButtonEmpty onClick={()=>changeView()} iconType={"sortLeft"}></EuiButtonEmpty></div>
      </EuiFlexItem>
      <EuiFlexItem grow={false}>
        <EuiTitle size="s">
          <h3>User Activity</h3>
        </EuiTitle>
        <p>wazuh@wazuh.com</p>
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
    <EuiFlexGroup>
      <SecurityAlerts />
    </EuiFlexGroup> 
  </>
}