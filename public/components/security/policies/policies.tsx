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
    EuiText,
    EuiFieldText,
    EuiFlexGroup,
    EuiFlexItem,
    EuiInMemoryTable
} from '@elastic/eui';
import { PoliciesTable } from './policies-table';
import { ApiRequest } from '../../../react-services/api-request';

export const Policies = () => {
    const [isFlyoutVisible, setIsFlyoutVisible] = useState(false);
    const [resources, setResources] = useState([]);
    const [resourceValue, setResourceValue] = useState('');
    const [resourceIdentifierValue, setResourceIdentifierValue] = useState('');
    const [availableResources, setAvailableResources] = useState([]);
    const [availableActions, setAvailableActions] = useState([]);
    const [addedActions, setAddedActions] = useState([]);
    const [addedResources, setAddedResources] = useState([]);
    const [actions, setActions] = useState([]);
    const [actionValue, setActionValue] = useState('');
    const [policyName, setPolicyName] = useState('');

    useEffect(() => { loadResources() }, [addedActions]);

    const onChangePolicyName = e => {
        setPolicyName(e.target.value);
    };

    const onChangeResourceValue = async (value) => {
        setResourceValue(value);
        setResourceIdentifierValue('');
    };

    const onChangeResourceIdentifierValue = async (e) => {
        setResourceIdentifierValue(e.target.value);
    };

    const loadResources = () => {
        let allResources = [];
        addedActions.forEach(x => {
            const res = (availableActions[x.action] || {})['resources'];
            allResources = allResources.concat(res);
        });
        const allResourcesSet = new Set(allResources);
        const resources = Array.from(allResourcesSet).map((x, idx) => {
            return {
                id: idx,
                value: x,
                inputDisplay: x,
                dropdownDisplay: (
                    <>
                        <strong>{x}</strong>
                        <EuiText size="s" color="subdued">
                            <p className="euiTextColor--subdued">
                                {availableResources[x].description}
                            </p>
                        </EuiText>
                    </>
                )
            }
        });
        setResources(resources);
    }

    const onChangeActionValue = async (value) => {
        setActionValue(value);
    };
    async function getData() {
        const resources_request = await ApiRequest.request(
            'GET',
            '/security/resources',
            {}
        );
        const actions_request = await ApiRequest.request(
            'GET',
            '/security/actions',
            {}
        );
        const resources_data = ((resources_request || {}).data || []);
        console.log(resources_data)
        setAvailableResources(resources_data);

        const actions_data = ((actions_request || {}).data || []);
        console.log(actions_data)
        setAvailableActions(actions_data);
        const actions = Object.keys(actions_data)
            .map((x, idx) => {
                return {
                    id: idx,
                    value: x,
                    inputDisplay: x,
                    dropdownDisplay: (
                        <>
                            <strong>{x}</strong>
                            <EuiText size="s" color="subdued">
                                <p className="euiTextColor--subdued">
                                    {actions_data[x].description}
                                </p>
                            </EuiText>
                        </>
                    )
                }
            });
        setActions(actions);
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

    const getIdentifier = () => {
        const keys = (Object.keys(availableResources) || []);
        return (keys[resourceValue] || ':').split(':')[1];
    }

    const addResource = () => {
        setAddedResources(addedResources =>
            [...addedResources,
            { resource: `${resourceValue}:${resourceIdentifierValue}` }
            ])
        setResourceIdentifierValue('');
    }

    const addAction = () => {
        if (!addedActions.filter(x => x.action === actionValue).length) {
            setAddedActions(addedActions =>
                [...addedActions,
                { action: actionValue }
                ])
        }
        setActionValue('');
    }

    const actions_columns = [
        {
            field: 'action',
            name: 'Actions',
            sortable: true,
            truncateText: true,
        },
        {
            name: '',
            actions: [
                {
                    name: 'Remove',
                    description: 'Remove this action',
                    type: 'icon',
                    color: 'danger',
                    icon: 'trash',
                    onClick: () => '',
                },
            ],
        }
    ];

    const resources_columns = [
        {
            field: 'resource',
            name: 'Resources',
            sortable: true,
            truncateText: true,
        },
        {
            name: '',
            actions: [
                {
                    name: 'Remove',
                    description: 'Remove this resource',
                    type: 'icon',
                    color: 'danger',
                    icon: 'trash',
                    onClick: () => '',
                },
            ],
        }
    ];

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
                            <EuiSpacer></EuiSpacer>
                            <EuiFlexGroup>
                                <EuiFlexItem>
                                    <EuiFormRow label="Action"
                                        helpText="Set an action where the policy will be carried out.">
                                        <EuiSuperSelect
                                            options={actions}
                                            valueOfSelected={actionValue}
                                            onChange={value => onChangeActionValue(value)}
                                            itemLayoutAlign="top"
                                            hasDividers
                                        />
                                    </EuiFormRow>
                                </EuiFlexItem>
                                <EuiFlexItem></EuiFlexItem>
                                <EuiFlexItem grow={false}>
                                    <EuiFormRow hasEmptyLabelSpace>
                                        <EuiButton
                                            onClick={() => addAction()}
                                            iconType="plusInCircle"
                                            disabled={!actionValue}
                                        >Add</EuiButton>
                                    </EuiFormRow>
                                </EuiFlexItem>
                            </EuiFlexGroup>
                            {!!addedActions.length &&
                                <>
                                    <EuiSpacer size='s'></EuiSpacer>
                                    <EuiFlexGroup>
                                        <EuiFlexItem>
                                            <EuiInMemoryTable
                                                items={addedActions}
                                                columns={actions_columns}
                                            />
                                        </EuiFlexItem>
                                    </EuiFlexGroup>
                                </>
                            }
                            <EuiSpacer></EuiSpacer>
                            <EuiFlexGroup>
                                <EuiFlexItem>
                                    <EuiFormRow label="Resource"
                                        helpText="Select the resource to which this policy is directed.">
                                        <EuiSuperSelect
                                            options={resources}
                                            valueOfSelected={resourceValue}
                                            onChange={value => onChangeResourceValue(value)}
                                            itemLayoutAlign="top"
                                            hasDividers
                                            disabled={!addedActions.length}
                                        />
                                    </EuiFormRow>
                                </EuiFlexItem>
                                <EuiFlexItem>
                                    <EuiFormRow label="Resource identifier"
                                        helpText="Introduce the resource identificator. * for all.">
                                        <EuiFieldText
                                            placeholder={getIdentifier()}
                                            value={resourceIdentifierValue}
                                            onChange={e => onChangeResourceIdentifierValue(e)}
                                            disabled={!resourceValue}
                                        />
                                    </EuiFormRow>
                                </EuiFlexItem>
                                <EuiFlexItem grow={false}>
                                    <EuiFormRow hasEmptyLabelSpace>
                                        <EuiButton
                                            onClick={() => addResource()}
                                            iconType="plusInCircle"
                                            disabled={!resourceIdentifierValue}
                                        >Add</EuiButton>
                                    </EuiFormRow>
                                </EuiFlexItem>
                            </EuiFlexGroup>
                            {!!addedResources.length &&
                                <>
                                    <EuiSpacer size='s'></EuiSpacer>
                                    <EuiFlexGroup>
                                        <EuiFlexItem>
                                            <EuiInMemoryTable
                                                items={addedResources}
                                                columns={resources_columns}
                                            />
                                        </EuiFlexItem>
                                    </EuiFlexGroup>
                                </>
                            }
                            <EuiSpacer></EuiSpacer>
                            <EuiFormRow label="Select an effect"
                                helpText="Select an effect.">
                                <EuiSuperSelect
                                    options={effectOptions}
                                    valueOfSelected={effectValue}
                                    onChange={value => onEffectValueChange(value)}
                                />
                            </EuiFormRow>
                            <EuiSpacer />
                            <EuiButton
                                type="submit"
                                disabled={!policyName || !addedActions.length || !addedResources.length || !effectValue}
                                fill>
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