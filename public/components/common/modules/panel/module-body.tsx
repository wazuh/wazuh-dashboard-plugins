import React from 'react';
import { EuiPageBody, EuiFlexGroup, EuiFlexItem, EuiBasicTable, EuiPanel, EuiTitle, Random } from '@elastic/eui';


export const ModuleBody = ({ vizList = [], ...props }) => {

    return (
        <EuiFlexGroup >
            {vizList.map((Component, key) => <EuiFlexItem key={key}>
                <Component />
            </EuiFlexItem>)}
        </EuiFlexGroup>
    )
}