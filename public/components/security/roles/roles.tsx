import React, { useState, useEffect } from 'react';
import {
    EuiPageContent,
    EuiPageContentHeader,
    EuiPageContentHeaderSection,
    EuiPageContentBody,
    EuiButton,
    EuiTitle,
    EuiFlyout,
    EuiOverlayMask,
    EuiFlyoutHeader,
    EuiFlyoutBody,
    EuiForm,
    EuiFormRow,
    EuiSpacer,
    EuiFieldText,
    EuiComboBox
} from '@elastic/eui';
import { RolesTable } from './roles-table';
import { ApiRequest } from '../../../react-services/api-request'

export const Roles = () => {
    const [isFlyoutVisible, setIsFlyoutVisible] = useState(false);
    const [roleName, setRoleName] = useState('');
    const [policies, setPolicies] = useState('');

    const onChangeRoleName = e => {
        setRoleName(e.target.value);
    };

    async function getData() {
        const request = await ApiRequest.request(
            'GET',
            '/security/policies',
            {}
        );
        const policies = ((((request || {}).data || {}).data || {}).affected_items || [])
            .map(x => { return { 'label': x.name } });
        setPolicies(policies);
    }

    useEffect(() => {
        getData();
    }, []);

    const [selectedPolicies, setSelectedRole] = useState([]);

    const onChangePolicies = selectedPolicies => {
        setSelectedRole(selectedPolicies);
    };

    let flyout;
    if (isFlyoutVisible) {
        flyout = (
            <EuiOverlayMask onClick={(e) => {
                e.target.className === 'euiOverlayMask' &&
                    setIsFlyoutVisible(false)
            }}>
                <EuiFlyout
                    onClose={() => setIsFlyoutVisible(false)}>
                    <EuiFlyoutHeader hasBorder={false}>
                        <EuiTitle size="m">
                            <h2>New role</h2>
                        </EuiTitle>
                    </EuiFlyoutHeader>
                    <EuiFlyoutBody>
                        <EuiForm component="form" style={{ padding: 24 }}>
                            <EuiFormRow label="Role name"
                                helpText="Introduce a name for this new role.">
                                <EuiFieldText
                                    placeholder=""
                                    value={roleName}
                                    onChange={e => onChangeRoleName(e)}
                                    aria-label=""
                                />
                            </EuiFormRow>
                            <EuiFormRow label="Policies"
                                helpText="Assign policies to the role.">
                                <EuiComboBox
                                    placeholder="Select policies"
                                    options={policies}
                                    selectedOptions={selectedPolicies}
                                    onChange={onChangePolicies}
                                    isClearable={true}
                                    data-test-subj="demoComboBox"
                                />
                            </EuiFormRow>
                            <EuiSpacer />
                            <EuiButton type="submit" fill>
                                Create role
                                    </EuiButton>
                        </EuiForm>
                    </EuiFlyoutBody>
                </EuiFlyout>
            </EuiOverlayMask >
        );
    }

    return (
        <EuiPageContent>
            <EuiPageContentHeader>
                <EuiPageContentHeaderSection>
                    <EuiTitle>
                        <h2>Roles</h2>
                    </EuiTitle>
                </EuiPageContentHeaderSection>
                <EuiPageContentHeaderSection>
                    <div>
                        <EuiButton
                            onClick={() => setIsFlyoutVisible(true)}>
                            Create role
                                </EuiButton>
                        {flyout}
                    </div>
                </EuiPageContentHeaderSection>
            </EuiPageContentHeader>
            <EuiPageContentBody>
                <RolesTable></RolesTable>
            </EuiPageContentBody>
        </EuiPageContent>
    );
};