import React, { useState } from 'react';
import { EuiFlexGroup, EuiFlexItem, EuiPanel, EuiTitle, EuiButtonIcon } from '@elastic/eui';

export const OfficeBody = ({ changeView, rows = [] }) => {

  const [expandedVis, setExpandedVis] = useState(false);

  const toggleExpand = id => {
    setExpandedVis(expandedVis === id ? false : id);
  };

  return <>
    {
      rows.map((row, key) => {
        return <EuiFlexGroup key={key} className={'wz-margin-0'} style={{
          height: row.height || (150 + 'px')
        }}>
          {
            row.columns.map((column, key) => {
              const growthFactor = Math.max((column.width ? parseInt(column.width / 10) : 1), 1);

              return <EuiFlexItem key={key} grow={growthFactor}>
                <EuiPanel paddingSize={'s'} className={expandedVis === vis.id ? 'fullscreen h-100' : 'h-100'}>
                  <EuiTitle>
                    {vis.title}
                  </EuiTitle>
                  <EuiButtonIcon
                    color="text"
                    style={{ padding: '0px 6px', height: 30 }}
                    onClick={() => toggleExpand(vis.id)}
                    iconType="expand"
                    aria-label="Expand"
                  />
                  <div style={{ height: '100%' }}><column.component onRowClick={() => changeView('drilldown')} />
                  </div></EuiPanel>
              </EuiFlexItem>
            })
          }
        </EuiFlexGroup>
      })
    }
  </>
}