import React, { useState, useEffect, Fragment } from 'react';
import store from '../../redux/store';
import {
    EuiIcon,
    EuiTabs,
    EuiTab,
    EuiSpacer,
} from '@elastic/eui';
import { updateGlobalBreadcrumb } from '../../redux/actions/globalBreadcrumbActions';

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
        <Fragment>
            <EuiTabs>{renderTabs()}</EuiTabs>
        </Fragment>
    );
};