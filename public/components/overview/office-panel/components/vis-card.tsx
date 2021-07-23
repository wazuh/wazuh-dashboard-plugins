import React, { useState } from 'react';
import { EuiFlexGroup, EuiFlexItem, EuiPanel, EuiTitle, EuiButtonIcon } from '@elastic/eui';
import KibanaVis from '../../../../kibana-integrations/kibana-vis';

export const VisCard = ({ changeView = () => { }, title = 'Vis Title', id, width, tab, ...props }) => {

  const [expandedVis, setExpandedVis] = useState(false);

  const toggleExpand = id => {
    setExpandedVis(expandedVis === id ? false : id);
  };
  
  return <> <EuiFlexItem grow={width}>
    <EuiPanel paddingSize={'s'} className={expandedVis === id ? 'fullscreen h-100' : 'h-100'}>
      <EuiFlexGroup direction={'column'} className={'h-100'}>
        <EuiFlexItem grow={false}>
          <EuiFlexGroup justifyContent="spaceBetween">
            <EuiFlexItem>{title && <EuiTitle size={'xxs'}><h4>{title}</h4></EuiTitle>}</EuiFlexItem>
            <EuiFlexItem grow={false} >
              <EuiButtonIcon
                color="text"
                style={{ padding: '0px 6px', height: 30 }}
                onClick={() => toggleExpand(id)}
                iconType="expand"
                aria-label="Expand"
              />
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiFlexItem>
        <EuiFlexItem grow={true}>
          <div className={'h-100'}><KibanaVis visID={id} tab={tab} onRowClick={() => changeView('drilldown')} {...props} /></div>
        </EuiFlexItem>
      </EuiFlexGroup>
    </EuiPanel>
  </EuiFlexItem>
  </>
}