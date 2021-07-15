import React from 'react';
import { EuiPageBody, EuiFlexGroup, EuiFlexItem, EuiBasicTable, EuiPanel, EuiTitle, Random } from '@elastic/eui';


export const ModuleBody = ({ children, ...props }) => {
    
    return (
        <EuiFlexGroup >
            <EuiFlexItem>
                {children}
                
            </EuiFlexItem>
        </EuiFlexGroup>
    )
}