import React, { useState, useEffect } from 'react';
import store from '../../redux/store';
import {
    EuiPage,
    EuiFlexGroup,
    EuiFlexItem,
    EuiPanel,
    EuiTabs,
    EuiTab,
    EuiSpacer,
} from '@elastic/eui';
import { updateGlobalBreadcrumb } from '../../redux/actions/globalBreadcrumbActions';
import { Users } from './users/users';
import { Roles } from './roles/roles';

const tabs = [
    {
        id: 'users',
        name: 'Users',
        disabled: false,
    },
    {
        id: 'roles',
        name: 'Roles',
        disabled: false,
    },
];

export const WzSecurity = () => {
    const [selectedTabId, setSelectedTabId] = useState('users');

    useEffect(() => {
        const breadcrumb = [{ text: '' }, { text: 'Security' }];
        store.dispatch(updateGlobalBreadcrumb(breadcrumb));
    }, []);

    const onSelectedTabChanged = id => {
        setSelectedTabId(id);
    };

    const renderTabs = () => {
        return tabs.map((tab, index) => (
            <EuiTab
                {...(tab.href && { href: tab.href, target: '_blank' })}
                onClick={() => onSelectedTabChanged(tab.id)}
                isSelected={tab.id === selectedTabId}
                disabled={tab.disabled}
                key={index}>
                {tab.name}
            </EuiTab>
        ));
    };

    return (
        <EuiPage>
            <EuiFlexGroup>
                <EuiFlexItem>
                    <EuiTabs>{renderTabs()}</EuiTabs>
                    <EuiSpacer size='m'></EuiSpacer>
                    {selectedTabId === 'users' &&
                        <Users></Users>
                    }
                    {selectedTabId === 'roles' &&
                        <Roles></Roles>
                    }
                </EuiFlexItem>
            </EuiFlexGroup>
        </EuiPage>
    );
};