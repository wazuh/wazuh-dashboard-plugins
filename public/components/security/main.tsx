import React, { useState, useEffect } from 'react';
import store from '../../redux/store';
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
    withUserAuthorizationPrompt(null, ['administrator'])
)(() => {
    const [selectedTabId, setSelectedTabId] = useState('users');
    const [securityError, setSecurityError] = useState(false);


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
            {!securityError &&
                <EuiFlexGroup>
                    <EuiFlexItem>
                        <EuiTabs>{renderTabs()}</EuiTabs>
                        <EuiSpacer size='m'></EuiSpacer>
                        {selectedTabId === 'users' &&
                            <Users setSecurityError={setSecurityError}></Users>
                        }
                        {selectedTabId === 'roles' &&
                            <Roles></Roles>
                        }
                        {selectedTabId === 'policies' &&
                            <Policies></Policies>
                        }
                    </EuiFlexItem>
                </EuiFlexGroup>
            }
            {securityError &&
                <EuiFlexGroup alignItems="center" justifyContent="center">
                    <EuiPanel grow={false}>
                        <EuiEmptyPrompt
                            iconType="securityApp"
                            title={<h2>You need permission to manage users</h2>}
                            body={
                            <>
                                <p>Contact your system administrator.</p>
                            </>
                            }
                        />
                    </EuiPanel>

                </EuiFlexGroup>
            }
        </EuiPage>
    );
});