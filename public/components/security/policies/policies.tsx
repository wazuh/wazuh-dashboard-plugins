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
    EuiSuperSelect,
    EuiComboBox,
    EuiText,
    EuiFieldText
} from '@elastic/eui';
import { PoliciesTable } from './policies-table';
import { ApiRequest } from '../../../react-services/api-request';

export const Policies = () => {
    const [isFlyoutVisible, setIsFlyoutVisible] = useState(false);
    const [resources, setResources] = useState([]);
    const [resourceValue, setResourceValue] = useState('');
    const [actions, setActions] = useState([]);
    const [actionValue, setActionValue] = useState('');
    const [policyName, setPolicyName] = useState('');

    const onChangePolicyName = e => {
        setPolicyName(e.target.value);
    };

    const onChangeResourceValue = async (value) => {
        setResourceValue(value);
        const actions_request = await ApiRequest.request(
            'GET',
            '/security/actions',
            {}
        );
        console.log(actions_request)
    };
    const onChangeActionValue = async (value) => {
        setActionValue(value);
    };
    async function getData() {
        const resources_request = await ApiRequest.request(
            'GET',
            '/security/resources',
            {}
        );
        const resources_data = ((resources_request || {}).data || []);
        const resources = Object.keys(resources_data)
            .map((x, idx) => {
                return {
                    value: idx,
                    inputDisplay: x,
                    dropdownDisplay: (
                        <>
                            <strong>{x}</strong>
                            <EuiText size="s" color="subdued">
                                <p className="euiTextColor--subdued">
                                    {resources_data[x].description}
                                </p>
                            </EuiText>
                        </>
                    )
                }
            });
        setResources(resources);
    }

    useEffect(() => {
        getData();
    }, []);

    const effectOptions = [
        {
            value: 'allow',
            inputDisplay: 'Allow'
        },
        {
            value: 'deny',
            inputDisplay: 'Deny'
        },
    ];

    const [effectValue, setEffectValue] = useState();

    const onEffectValueChange = value => {
        setEffectValue(value);
    };

    const rolesOptions = [
        {
            label: 'Admin'
        },
        {
            label: 'Read',
        },
        {
            label: 'Viewer',
        },
        {
            label: 'Wazuh',
        }
    ];

    const [selectedRoles, setSelectedRole] = useState([]);

    const onChangeRoles = selectedRoles => {
        setSelectedRole(selectedRoles);
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
                            <h2>New policy</h2>
                        </EuiTitle>
                    </EuiFlyoutHeader>
                    <EuiFlyoutBody>
                        <EuiForm component="form" style={{ padding: 24 }}>
                            <EuiFormRow label="Policy name"
                                helpText="Introduce a name for this new policy.">
                                <EuiFieldText
                                    placeholder=""
                                    value={policyName}
                                    onChange={e => onChangePolicyName(e)}
                                    aria-label=""
                                />
                            </EuiFormRow>
                            <EuiFormRow label="Resources"
                                helpText="Select the resource to which this policy is directed.">
                                <EuiSuperSelect
                                    options={resources}
                                    valueOfSelected={resourceValue}
                                    onChange={value => onChangeResourceValue(value)}
                                    itemLayoutAlign="top"
                                    hasDividers
                                />
                            </EuiFormRow>
                            <EuiFormRow label="Select an effect"
                                helpText="Select an effect.">
                                <EuiSuperSelect
                                    options={effectOptions}
                                    valueOfSelected={effectValue}
                                    onChange={value => onEffectValueChange(value)}
                                />
                            </EuiFormRow>
                            <EuiFormRow label="Actions"
                                helpText="Assign actions to the policy.">
                                <EuiComboBox
                                    placeholder="Select actions"
                                    options={rolesOptions}
                                    selectedOptions={selectedRoles}
                                    onChange={onChangeRoles}
                                    isClearable={true}
                                />
                            </EuiFormRow>
                            <EuiSpacer />
                            <EuiButton type="submit" fill>
                                Create policy
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
                        <h2>Policies</h2>
                    </EuiTitle>
                </EuiPageContentHeaderSection>
                <EuiPageContentHeaderSection>
                    <div>
                        <EuiButton
                            onClick={() => setIsFlyoutVisible(true)}>
                            Create policy
                                </EuiButton>
                        {flyout}
                    </div>
                </EuiPageContentHeaderSection>
            </EuiPageContentHeader>
            <EuiPageContentBody>
                <PoliciesTable></PoliciesTable>
            </EuiPageContentBody>
        </EuiPageContent>
    );
};