import React, { useState, useEffect } from 'react';
import {
    EuiPage,
    EuiFlexGroup,
    EuiFlexItem,
    EuiTabs,
    EuiTab,
    EuiPanel,
    EuiEmptyPrompt,
    EuiSpacer,
} from '@elastic/eui';
import { Users } from './users/users';
import { Roles } from './roles/roles';
import { Policies } from './policies/policies';
import { withReduxProvider, withGlobalBreadcrumb, withUserAuthorizationPrompt } from '../common/hocs';
import { compose } from 'redux';
import { WAZUH_ROLE_ADMINISTRATOR_NAME } from '../../../util/constants';

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
    {
        id: 'policies',
        name: 'Policies',
        disabled: false,
    },
];

export const WzSecurity = compose(
    withReduxProvider,
    withGlobalBreadcrumb([{ text: '' }, { text: 'Security' }]),
    withUserAuthorizationPrompt(null, [WAZUH_ROLE_ADMINISTRATOR_NAME])
)(() => {
    // Get the initial tab when the component is initiated
    const securityTabRegExp = new RegExp(`tab=(${tabs.map(tab => tab.id).join('|')})`);
    const tab = window.location.href.match(securityTabRegExp);

    const [selectedTabId, setSelectedTabId] = useState(tab && tab[1] || 'users');

    const listenerLocationChanged = () => {
        const tab = window.location.href.match(securityTabRegExp);
        setSelectedTabId(tab && tab[1] || 'users')
    }
    // This allows to redirect to a Security tab if you click a Security link in menu when you're already in a Security section 
    useEffect(() => {
        window.addEventListener('popstate', listenerLocationChanged)
        return () => window.removeEventListener('popstate', listenerLocationChanged);
    });
    
    const onSelectedTabChanged = id => {
        window.location.href = window.location.href.replace(`tab=${selectedTabId}`, `tab=${id}`);
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
                    {selectedTabId === 'policies' &&
                        <Policies></Policies>
                    }
                </EuiFlexItem>
            </EuiFlexGroup>
        </EuiPage>
    );
});