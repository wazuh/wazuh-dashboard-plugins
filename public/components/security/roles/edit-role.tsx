import React, { useState, useEffect } from 'react';
import {
    EuiButton,
    EuiTitle,
    EuiFlyout,
    EuiFlyoutHeader,
    EuiFlyoutBody,
    EuiForm,
    EuiFieldText,
    EuiFormRow,
    EuiSpacer,
    EuiFlexGroup,
    EuiFlexItem,
    EuiBadge,
    EuiComboBox,
} from '@elastic/eui';

import { ApiRequest } from '../../../react-services/api-request';
import { ErrorHandler } from '../../../react-services/error-handler';
import { EditRolesTable } from './edit-role-table';

const reservedRoles = ['administrator', 'readonly', 'users_admin', 'agents_readonly', 'agents_admin', 'cluster_readonly', 'cluster_admin'];


export const EditRole = ({ role, closeFlyout }) => {
    const [currentRole, setCurrentRole] = useState({});
    const [isReserved, setIsReserved] = useState(reservedRoles.includes(role.name))
    const [policies, setPolicies] = useState([]);
    const [selectedPolicies, setSelectedPolicies] = useState([]);
    const [selectedPoliciesError, setSelectedPoliciesError] = useState(false);
    const [assignedPolicies, setAssignedPolicies] = useState([]);

    async function getData() {
        try{
            const roleDataResponse = await ApiRequest.request(
                'GET',
                '/security/roles',            
                {
                    params: {
                        role_ids: role.id
                    }
                }
            );
            const roleData = (((roleDataResponse.data || {}).data || {}).affected_items || [])[0];
            setCurrentRole(roleData);
            const policies_request = await ApiRequest.request(
                'GET',
                '/security/policies',
                {}
            );
            const selectedPoliciesCopy = [];
            const policies = ((((policies_request || {}).data || {}).data || {}).affected_items || [])
                .map(x => {
                    const currentPolicy = { 'label': x.name, id: x.id, roles: x.roles, policy: x.policy };
                    if (roleData.policies.includes(x.id)) {
                        selectedPoliciesCopy.push(currentPolicy);
                        return false;
                    } else {
                        return currentPolicy
                    }
                });
            const filteredPolicies = policies.filter(item => item !== false);
            setAssignedPolicies(selectedPoliciesCopy)
            setPolicies(filteredPolicies);
        }catch(error){
            ErrorHandler.handle( error, 'Error');
        }
    }

    useEffect(() => {
        getData();
    }, []);



    const addPolicy = async () => {
        if (!selectedPolicies.length) {
            setSelectedPoliciesError(true);
            return;
        } else if (selectedPoliciesError) {
            setSelectedPoliciesError(false);
        }

        try {
            let roleId = currentRole.id;

            const policiesId = selectedPolicies.map(policy => {
                return policy.id;
            })
            const policyResult = await ApiRequest.request(
                'POST',
                `/security/roles/${roleId}/policies`,
                {
                    params: {
                        policy_ids: policiesId.toString()
                    }
                }
            );

            const policiesData = (policyResult.data || {}).data;
            if (policiesData.failed_items && policiesData.failed_items.length) {
                return;
            }
            ErrorHandler.info('Role was successfully updated with the selected policies');
            setSelectedPolicies([])
            await update();
        } catch (error) {
            ErrorHandler.handle(error, "There was an error");
        }
    }

    const update = async() => {
        await getData();
    }


    const onChangePolicies = selectedPolicies => {
        setSelectedPolicies(selectedPolicies);
    };


    return (
        <EuiFlyout
            onClose={() => closeFlyout(false)}>
            <EuiFlyoutHeader hasBorder={false}>
                <EuiTitle size="m">
                    <h2>
                        Edit {role.name} role &nbsp;
                        {isReserved &&
                            <EuiBadge color='primary'>Reserved</EuiBadge>
                        }
                    </h2>
                </EuiTitle>
            </EuiFlyoutHeader>
            <EuiFlyoutBody><EuiForm component="form" style={{ padding: 24 }}>
                <EuiFlexGroup>
                    <EuiFlexItem grow={true}>
                        <EuiFormRow label="Policies"
                            isInvalid={selectedPoliciesError}
                            error={'At least one policy must be selected.'}
                            helpText="Assign policies to the role.">
                            <EuiComboBox
                                placeholder="Select policies"
                                options={policies}
                                isDisabled={isReserved}
                                selectedOptions={selectedPolicies}
                                onChange={onChangePolicies}
                                isClearable={true}
                                data-test-subj="demoComboBox"
                            />
                        </EuiFormRow>
                    </EuiFlexItem>
                    <EuiFlexItem grow={true}>
                        <EuiButton style={{ marginTop: 20, maxWidth: 45 }} isDisabled={isReserved} fill onClick={addPolicy}>
                            Add policy
                    </EuiButton>

                    </EuiFlexItem>
                </EuiFlexGroup>


                <EuiSpacer />
            </EuiForm>
                <div style={{ margin: 20 }}>
                    <EditRolesTable policies={assignedPolicies} role={role} onChange={update} isDisabled={isReserved}/>
                </div>
            </EuiFlyoutBody>
        </EuiFlyout>

    )
};