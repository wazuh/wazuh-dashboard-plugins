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
  EuiSuperSelect,
  EuiInMemoryTable,
  EuiConfirmModal,
  EuiOverlayMask,
  EuiOutsideClickDetector,
  EuiFieldText,
  EuiText,
} from '@elastic/eui';
import { WzRequest } from '../../../react-services/wz-request';
import { ErrorHandler } from '../../../react-services/error-handler';
import { UI_LOGGER_LEVELS } from '../../../../common/constants';
import { UI_ERROR_SEVERITIES } from '../../../react-services/error-orchestrator/types';
import { getErrorOrchestrator } from '../../../react-services/common-services';
import { WzFlyout } from '../../common/flyouts';
import { i18n } from '@kbn/i18n';

const Name1 = i18n.translate('wazuh.components.security.policies.Name1', {
  defaultMessage: 'Actions',
});
const Name2 = i18n.translate('wazuh.components.security.policies.Name2', {
  defaultMessage: 'Remove',
});
const Name3 = i18n.translate('wazuh.components.security.policies.Name3', {
  defaultMessage: 'Resources',
});
const Name4 = i18n.translate('wazuh.components.security.policies.Name4', {
  defaultMessage: 'Resources',
});
const Name5 = i18n.translate('wazuh.components.security.policies.Name5', {
  defaultMessage: 'Remove',
});
const Descp1 = i18n.translate('wazuh.components.security.policies.Descp1', {
  defaultMessage: 'Remove this action',
});
const Descp2 = i18n.translate('wazuh.components.security.policies.Descp2', {
  defaultMessage: 'Remove this resource',
});
export const CreatePolicyFlyout = ({ closeFlyout }) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [resources, setResources] = useState([]);
  const [resourceValue, setResourceValue] = useState('');
  const [resourceIdentifierValue, setResourceIdentifierValue] = useState('');
  const [availableResources, setAvailableResources] = useState([]);
  const [addedActions, setAddedActions] = useState([]);
  const [availableActions, setAvailableActions] = useState([]);
  const [addedResources, setAddedResources] = useState([]);
  const [actions, setActions] = useState([]);
  const [actionValue, setActionValue] = useState('');
  const [policyName, setPolicyName] = useState('');
  const [policies, setPolicies] = useState('');
  const [loading, setLoading] = useState(false);
  const [effectValue, setEffectValue] = useState();
  const [hasChanges, setHasChanges] = useState(false);

  const actions_columns = [
    {
      field: 'action',
      name: Name1,
      sortable: true,
      truncateText: true,
    },
    {
      name: '',
      actions: [
        {
          name: Name2,
          description: Descp1,
          type: 'icon',
          color: 'danger',
          icon: 'trash',
          onClick: action => removeAction(action),
        },
      ],
    },
  ];

  const resources_columns = [
    {
      field: 'resource',
      name: Name3,
      sortable: true,
      truncateText: true,
    },
    {
      name: Name4,
      actions: [
        {
          name: Name5,
          description: Descp2,
          type: 'icon',
          color: 'danger',
          icon: 'trash',
          onClick: resource => removeResource(resource),
        },
      ],
    },
  ];

  const effectOptions = [
    {
      value: 'allow',
      inputDisplay: 'Allow',
    },
    {
      value: 'deny',
      inputDisplay: 'Deny',
    },
  ];

  async function getData() {
    const resources_request = await WzRequest.apiReq(
      'GET',
      '/security/resources',
      {},
    );
    const actions_request = await WzRequest.apiReq(
      'GET',
      '/security/actions',
      {},
    );
    const resources_data = ((resources_request || {}).data || []).data || {};
    setAvailableResources(resources_data);

    const actions_data = ((actions_request || {}).data || []).data || {};
    setAvailableActions(actions_data);
    const actions = Object.keys(actions_data).map((x, idx) => {
      return {
        id: idx,
        value: x,
        inputDisplay: x,
        dropdownDisplay: (
          <>
            <strong>{x}</strong>
            <EuiText size='s' color='subdued'>
              <p className='euiTextColor--subdued'>
                {actions_data[x].description}
              </p>
            </EuiText>
          </>
        ),
      };
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
            <EuiText size='s' color='subdued'>
              <p className='euiTextColor--subdued'>
                {availableResources[x].description}
              </p>
            </EuiText>
          </>
        ),
      };
    });
    setResources(resources);
  };

  const removeAction = action => {
    setAddedActions(addedActions.filter(x => x !== action));
  };

  const getPolicies = async () => {
    setLoading(true);
    const request = await WzRequest.apiReq('GET', '/security/policies', {});
    const policies =
      (((request || {}).data || {}).data || {}).affected_items || [];
    setPolicies(policies);
    setLoading(false);
  };

  const createPolicy = async () => {
    try {
      const result = await WzRequest.apiReq('POST', '/security/policies', {
        name: policyName,
        policy: {
          actions: addedActions.map(x => x.action),
          resources: addedResources.map(x => x.resource),
          effect: effectValue,
        },
      });
      const resultData = (result.data || {}).data;
      if (resultData.failed_items && resultData.failed_items.length) {
        return;
      }
      ErrorHandler.info('Policy was successfully created', '');
      await getPolicies();
      setPolicyName('');
      setAddedActions([]);
      setAddedResources([]);
      setEffectValue(null);
    } catch (error) {
      const options = {
        context: `${CreatePolicyFlyout.name}.createPolicy`,
        level: UI_LOGGER_LEVELS.ERROR,
        severity: UI_ERROR_SEVERITIES.BUSINESS,
        store: true,
        error: {
          error: error,
          message: error.message || error,
          title: error.name || error,
        },
      };
      getErrorOrchestrator().handleError(options);
    }
    closeFlyout();
  };

  const getIdentifier = () => {
    const keys = Object.keys(availableResources) || [];
    return (keys[resourceValue] || ':').split(':')[1];
  };

  const addResource = () => {
    if (
      !addedResources.filter(
        x => x.resource === `${resourceValue}:${resourceIdentifierValue}`,
      ).length
    ) {
      setAddedResources(addedResources => [
        ...addedResources,
        { resource: `${resourceValue}:${resourceIdentifierValue}` },
      ]);
    }
    setResourceIdentifierValue('');
  };

  const addAction = () => {
    if (!addedActions.filter(x => x.action === actionValue).length) {
      setAddedActions(addedActions => [
        ...addedActions,
        { action: actionValue },
      ]);
    }
    setActionValue('');
  };

  const removeResource = resource => {
    setAddedResources(addedResources.filter(x => x !== resource));
  };

  const onChangePolicyName = e => {
    setPolicyName(e.target.value);
  };

  const onChangeResourceValue = async value => {
    setResourceValue(value);
    setResourceIdentifierValue('');
  };

  const onChangeActionValue = async value => {
    setActionValue(value);
  };

  const onEffectValueChange = value => {
    setEffectValue(value);
  };

  const onChangeResourceIdentifierValue = async e => {
    setResourceIdentifierValue(e.target.value);
  };

  let modal;
  if (isModalVisible) {
    modal = (
      <EuiOverlayMask>
        <EuiConfirmModal
          title={i18n.translate(
            'wazuh.public.components.security.policies.create.unsubmit',
            {
              defaultMessage: 'Unsubmitted changes',
            },
          )}
          onConfirm={() => {
            setIsModalVisible(false);
            closeFlyout(false);
            setHasChanges(false);
          }}
          onCancel={() => setIsModalVisible(false)}
          cancelButtonText="No, don't do it"
          confirmButtonText='Yes, do it'
        >
          <p style={{ textAlign: 'center' }}>
            {i18n.translate(
              'wazuh.public.components.security.policies.create.youWant',
              {
                defaultMessage:
                  'There are unsaved changes. Are you sure you want to proceed?',
              },
            )}
          </p>
        </EuiConfirmModal>
      </EuiOverlayMask>
    );
  }

  useEffect(() => {
    getData();
  }, []);

  useEffect(() => {
    loadResources();
  }, [addedActions]);

  useEffect(() => {
    getPolicies();
  }, []);

  useEffect(() => {
    if (
      policyName.length ||
      actionValue.length ||
      addedActions.length ||
      addedResources.length ||
      effectValue
    ) {
      setHasChanges(true);
    } else {
      setHasChanges(false);
    }
  }, [policyName, actionValue, addedActions, addedResources, effectValue]);

  const onClose = () => {
    hasChanges ? setIsModalVisible(true) : closeFlyout(false);
  };

  return (
    <>
      <WzFlyout flyoutProps={{ className: 'wzApp' }} onClose={onClose}>
        <EuiFlyoutHeader hasBorder={false}>
          <EuiTitle size='m'>
            <h2>
              {i18n.translate(
                'wazuh.public.components.security.policies.create.Newpolicy',
                {
                  defaultMessage: ' New policy',
                },
              )}
            </h2>
          </EuiTitle>
        </EuiFlyoutHeader>
        <EuiFlyoutBody>
          <EuiForm component='form' style={{ padding: 24 }}>
            <EuiFormRow
              label={i18n.translate(
                'wazuh.public.components.security.policies.create.policyName',
                {
                  defaultMessage: 'Policy name',
                },
              )}
              helpText={i18n.translate(
                'wazuh.public.components.security.policies.create.introduce',
                {
                  defaultMessage: 'Introduce a name for this new policy.',
                },
              )}
            >
              <EuiFieldText
                placeholder=''
                value={policyName}
                onChange={e => onChangePolicyName(e)}
                aria-label=''
              />
            </EuiFormRow>
            <EuiSpacer></EuiSpacer>
            <EuiFlexGroup>
              <EuiFlexItem>
                <EuiFormRow
                  label={i18n.translate(
                    'wazuh.public.components.security.policies.create.Action',
                    {
                      defaultMessage: 'Action',
                    },
                  )}
                  helpText={i18n.translate(
                    'wazuh.public.components.security.policies.create.setAction',
                    {
                      defaultMessage:
                        'Set an action where the policy will be carried out.',
                    },
                  )}
                >
                  <EuiSuperSelect
                    options={actions}
                    valueOfSelected={actionValue}
                    onChange={value => onChangeActionValue(value)}
                    itemLayoutAlign='top'
                    hasDividers
                  />
                </EuiFormRow>
              </EuiFlexItem>
              <EuiFlexItem></EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiFormRow hasEmptyLabelSpace>
                  <EuiButton
                    onClick={() => addAction()}
                    iconType='plusInCircle'
                    disabled={!actionValue}
                  >
                    {i18n.translate(
                      'wazuh.public.components.security.policies.create.Add',
                      {
                        defaultMessage: 'Add',
                      },
                    )}
                  </EuiButton>
                </EuiFormRow>
              </EuiFlexItem>
            </EuiFlexGroup>
            {!!addedActions.length && (
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
            )}
            <EuiSpacer></EuiSpacer>
            <EuiFlexGroup>
              <EuiFlexItem>
                <EuiFormRow
                  label={i18n.translate(
                    'wazuh.public.components.security.policies.create.Resource',
                    {
                      defaultMessage: 'Resource',
                    },
                  )}
                  helpText={i18n.translate(
                    'wazuh.public.components.security.policies.create.policy',
                    {
                      defaultMessage:
                        'Select the resource to which this policy is directed.',
                    },
                  )}
                >
                  <EuiSuperSelect
                    options={resources}
                    valueOfSelected={resourceValue}
                    onChange={value => onChangeResourceValue(value)}
                    itemLayoutAlign='top'
                    hasDividers
                    disabled={!addedActions.length}
                  />
                </EuiFormRow>
              </EuiFlexItem>
              <EuiFlexItem>
                <EuiFormRow
                  label={i18n.translate(
                    'wazuh.public.components.security.policies.create.resourses',
                    {
                      defaultMessage: 'Resource identifier',
                    },
                  )}
                  helpText={i18n.translate(
                    'wazuh.public.components.security.policies.create.type',
                    {
                      defaultMessage:
                        'Introduce the resource identifier. Type * for all.',
                    },
                  )}
                >
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
                    iconType='plusInCircle'
                    disabled={!resourceIdentifierValue}
                  >
                    {i18n.translate(
                      'wazuh.public.components.security.policies.create.Add',
                      {
                        defaultMessage: 'Add',
                      },
                    )}
                  </EuiButton>
                </EuiFormRow>
              </EuiFlexItem>
            </EuiFlexGroup>
            {!!addedResources.length && (
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
            )}
            <EuiSpacer></EuiSpacer>
            <EuiFormRow
              label={i18n.translate(
                'wazuh.public.components.security.policies.create.effect1',
                {
                  defaultMessage: 'Select an effect',
                },
              )}
              helpText={i18n.translate(
                'wazuh.public.components.security.policies.create.effect',
                {
                  defaultMessage: 'Select an effect.',
                },
              )}
            >
              <EuiSuperSelect
                options={effectOptions}
                valueOfSelected={effectValue}
                onChange={value => onEffectValueChange(value)}
              />
            </EuiFormRow>
            <EuiSpacer />
            <EuiButton
              disabled={
                !policyName ||
                !addedActions.length ||
                !addedResources.length ||
                !effectValue
              }
              onClick={() => {
                createPolicy();
              }}
              fill
            >
              {i18n.translate(
                'wazuh.public.components.security.policies.create.Createpolicy',
                {
                  defaultMessage: 'Create policy',
                },
              )}
            </EuiButton>
          </EuiForm>
        </EuiFlyoutBody>
      </WzFlyout>
      {modal}
    </>
  );
};
