
import React, { useState, useEffect } from 'react';
import {
    EuiButton,
    EuiTitle,
    EuiFlyout,
    EuiFlyoutHeader,
    EuiFlyoutBody,
    EuiForm,
    EuiFormRow,
    EuiSpacer,
    EuiFlexGroup,
    EuiFlexItem,
    EuiBadge,
    EuiSuperSelect,
    EuiText,
    EuiInMemoryTable,
    EuiFieldText,
} from '@elastic/eui';
import { WzRequest } from '../../../react-services/wz-request';
import { ErrorHandler } from '../../../react-services/error-handler';


export const EditPolicyFlyout = ({ policy, closeFlyout }) => {
    const isReserved = policy.id < 27;
    const [actionValue, setActionValue] = useState('');
    const [addedActions, setAddedActions] = useState([]);
    const [availableResources, setAvailableResources] = useState([]);
    const [availableActions, setAvailableActions] = useState([]);
    const [actions, setActions] = useState([]);
    const [addedResources, setAddedResources] = useState([]);
    const [resources, setResources] = useState([]);
    const [resourceValue, setResourceValue] = useState('');
    const [resourceIdentifierValue, setResourceIdentifierValue] = useState('');
    const [effectValue, setEffectValue] = useState();

    useEffect(() => {
        getData();
        initData();
    }, []);
    
    useEffect(() => { loadResources() }, [addedActions,availableActions]);

    const updatePolicy = async() => {
        try{
            const actions = addedActions.map(item => item.action)
            const resources = addedResources.map(item => item.resource)
            const response = await WzRequest.apiReq(
                'PUT',
                `/security/policies/${policy.id}`,
                {
                    "policy": {
                      "actions": actions,
                      "resources": resources,
                      "effect": effectValue
                    }
                }
            );

            const data = (response.data || {}).data;
            if (data.failed_items && data.failed_items.length) {
                return;
            }
            ErrorHandler.info('Role was successfully updated with the selected policies');
            closeFlyout();
        }catch(error){ 
            ErrorHandler.handle(error, 'Unexpected error');
         }
    }


    async function getData() {
        const resources_request = await WzRequest.apiReq(
            'GET',
            '/security/resources',
            {}
        );
        const actions_request = await WzRequest.apiReq(
            'GET',
            '/security/actions',
            {}
        );
        const resources_data = ((resources_request || {}).data || []);
        setAvailableResources(resources_data);
        
        const actions_data = ((actions_request || {}).data || []);
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
                                {(availableResources[x] || {}).description}
                            </p>
                        </EuiText>
                    </>
                )
            }
        });
        setResources(resources);
    }

    const initData = () => {
        const policies = ((policy || {}).policy || {}).actions || [];
        const initPolicies = policies.map(item => {
            return {action: item}
        })
        setAddedActions(initPolicies)

        const resources = ((policy || {}).policy || {}).resources || [];
        const initResources = resources.map(item => {
            return {resource: item}
        })
        setAddedResources(initResources)

        setEffectValue(policy.policy.effect)
    };


    const onEffectValueChange = value => {
        setEffectValue(value);
    };

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




    const onChangeActionValue = async (value) => {
        setActionValue(value);
    };

    const addAction = () => {
        if (!addedActions.filter(x => x.action === actionValue).length) {
            setAddedActions(addedActions =>
                [...addedActions,
                { action: actionValue }
                ])
        }
        setActionValue('');
    };

    const removeAction = (action) => {
        setAddedActions(addedActions.filter(x => x !== action));
    };

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
                    enabled: () => !isReserved,
                    color: 'danger',
                    icon: 'trash',
                    onClick: (action) => removeAction(action),
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
                    enabled: () => !isReserved,
                    icon: 'trash',
                    onClick: (resource) => removeResource(resource),
                },
            ],
        }
    ];


    const onChangeResourceValue = async (value) => {
        setResourceValue(value);
        setResourceIdentifierValue('');
    };

    const getIdentifier = () => {
        const keys = (Object.keys(availableResources) || []);
        return (keys[resourceValue] || ':').split(':')[1];
    }

    const onChangeResourceIdentifierValue = async (e) => {
        setResourceIdentifierValue(e.target.value);
    };

    const removeResource = (resource) => {
        setAddedResources(addedResources.filter(x => x !== resource));
    }


    const addResource = () => {
        if (!addedResources.filter(x => x.resource === `${resourceValue}:${resourceIdentifierValue}`).length) {
            setAddedResources(addedResources =>
                [...addedResources,
                { resource: `${resourceValue}:${resourceIdentifierValue}` }
                ])
        }
        setResourceIdentifierValue('');
    }

    return (
        <EuiFlyout
            onClose={() => closeFlyout(false)}>
            <EuiFlyoutHeader hasBorder={false}>
                <EuiTitle size="m">
                    <h2>
                        Edit policy {policy.name}&nbsp;&nbsp;
                        {isReserved &&
                            <EuiBadge color='primary'>Reserved</EuiBadge>
                        }
                    </h2>
                </EuiTitle>
            </EuiFlyoutHeader>
            <EuiFlyoutBody><EuiForm component="form" style={{ padding: 24 }}>
                <EuiFormRow label="Policy name"
                    helpText="Introduce a name for this new policy.">
                    <EuiFieldText
                        placeholder=""
                        disabled={isReserved}
                        value={policy.name}
                        readOnly={true}
                        onChange={() => { }}
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
                                disabled={isReserved}
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
                                disabled={!actionValue || isReserved}
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
                                disabled={!addedActions.length || isReserved}
                            />
                        </EuiFormRow>
                    </EuiFlexItem>
                    <EuiFlexItem>
                        <EuiFormRow label="Resource identifier"
                            helpText="Introduce the resource identifier. Type * for all.">
                            <EuiFieldText
                                placeholder={getIdentifier()}
                                value={resourceIdentifierValue}
                                onChange={e => onChangeResourceIdentifierValue(e)}
                                disabled={!resourceValue || isReserved}
                            />
                        </EuiFormRow>
                    </EuiFlexItem>
                    <EuiFlexItem grow={false}>
                        <EuiFormRow hasEmptyLabelSpace>
                            <EuiButton
                                onClick={() => addResource()}
                                iconType="plusInCircle"
                                disabled={!resourceIdentifierValue || isReserved}
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
                    disabled={isReserved}
                    onClick={updatePolicy}
                    fill>
                    Apply
                </EuiButton>
            </EuiForm>
            </EuiFlyoutBody>
        </EuiFlyout>)
};