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
import { WzRequest } from '../../../react-services/wz-request';
import { EditPolicyFlyout } from './edit-policy';
import { CreatePolicyFlyout } from './create-policy';


export const Policies = () => {
  const [resources, setResources] = useState([]);
  const [availableResources, setAvailableResources] = useState([]);
  const [availableActions, setAvailableActions] = useState([]);
  const [addedActions, setAddedActions] = useState([]);
  const [actions, setActions] = useState([]);
  const [policies, setPolicies] = useState('');
  const [loading, setLoading] = useState(false);
  const [isCreatingPolicy, setIsCreatingPolicy] = useState(false);
  const [isEditingPolicy, setIsEditingPolicy] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState('');
  const [creatingPolicy, setCreatingPolicy] = useState('');

  useEffect(() => { loadResources() }, [addedActions]);

  const getPolicies = async () => {
    setLoading(true);
    const request = await WzRequest.apiReq(
      'GET',
      '/security/policies',
      {}
    );
    const policies = (((request || {}).data || {}).data || {}).affected_items || [];
    setPolicies(policies);
    setLoading(false);
  }

  useEffect(() => {
    getPolicies();
  }, []);

  const editPolicy = (item) => {
    setEditingPolicy(item);
    setIsEditingPolicy(true);
  }

  const createPolicy = (item) => {
    setCreatingPolicy(item);
    setIsCreatingPolicy(true);
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
                {availableResources[x].description}
              </p>
            </EuiText>
          </>
        )
      }
    });
    setResources(resources);
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
    const resources_data = ((resources_request || {}).data || []).data || {};
    setAvailableResources(resources_data);

    const actions_data = ((actions_request || {}).data || []).data || {};
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

  const closeEditingFlyout = async () => {
    setIsEditingPolicy(false);
    await getPolicies();
  };
  
  const closeCreatingFlyout = async () => {
    setIsCreatingPolicy(false);
    await getPolicies();
  };


  let editFlyout;
  if (isEditingPolicy) {
    editFlyout = (
      <EditPolicyFlyout closeFlyout={closeEditingFlyout} policy={editingPolicy} />
    )
  }
  let flyout;
  if (isCreatingPolicy) {
    flyout = (
      <CreatePolicyFlyout closeFlyout={closeCreatingFlyout}/>
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
         { 
          !loading
          &&
          <div>
            <EuiButton
              onClick={() => setIsCreatingPolicy(true)}>
              Create policy
            </EuiButton>
            {flyout}
            {editFlyout}
          </div>          
        }
        </EuiPageContentHeaderSection>
      </EuiPageContentHeader>
      <EuiPageContentBody>
        <PoliciesTable loading={loading} policies={policies} editPolicy={editPolicy} updatePolicies={getPolicies}></PoliciesTable>
      </EuiPageContentBody>
    </EuiPageContent>
  );
};