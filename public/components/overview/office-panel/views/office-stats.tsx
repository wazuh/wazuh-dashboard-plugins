import { EuiDescriptionList, EuiFlexItem, EuiFlexGroup, EuiTitle } from '@elastic/eui';
import moduleLogo from '../../../../assets/office365.svg';
import React from 'react';


export const OfficeStats = ({ listItems = [] }) => {
    const logoStyle = { width: 30 };
    return (
        <EuiFlexGroup direction={'column'} alignItems={'flexStart'}>
            <EuiFlexItem>
                <EuiFlexGroup>
                    <EuiFlexItem>
                        <img alt="moduleLogo" src={moduleLogo} style={logoStyle} />
                    </EuiFlexItem>
                    <EuiFlexItem>
                        <EuiTitle size={"xs"}><h4>Office 365</h4></EuiTitle>
                    </EuiFlexItem>
                </EuiFlexGroup>
            </EuiFlexItem>
            <EuiFlexItem>
                <EuiDescriptionList
                    listItems={listItems}
                    compressed
                />
            </EuiFlexItem>
        </EuiFlexGroup>
    );
};
