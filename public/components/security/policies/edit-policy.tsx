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
  EuiConfirmModal,
  EuiOverlayMask,
  EuiOutsideClickDetector,
} from '@elastic/eui';
import { WzRequest } from '../../../react-services/wz-request';
import { ErrorHandler } from '../../../react-services/error-handler';
import { WzAPIUtils } from '../../../react-services/wz-api-utils';
import { UI_LOGGER_LEVELS } from '../../../../common/constants';
import { UI_ERROR_SEVERITIES } from '../../../react-services/error-orchestrator/types';
import { getErrorOrchestrator } from '../../../react-services/common-services';
import _ from 'lodash';
import { i18n } from '@kbn/i18n';

import { WzFlyout } from '../../common/flyouts';
const Title1 = i18n.translate('wazuh.components.security,policy.Title.remove', {
  defaultMessage: 'Remove',
});
const Title2 = i18n.translate('wazuh.components.security,policy.Title2', {
  defaultMessage: 'Resources',
});
const Title3 = i18n.translate('wazuh.components.security,policy.Title3', {
  defaultMessage: 'Unsubmitted changes',
});
const Descp1 = i18n.translate('wazuh.components.security,policy.Descp1', {
  defaultMessage: 'Remove this action',
});
const Descp2 = i18n.translate('wazuh.components.security,policy.Descp2', {
  defaultMessage: 'Remove this resource',
});
export const EditPolicyFlyout = ({ policy, closeFlyout }) => {
  const isReserved = WzAPIUtils.isReservedID(policy.id);
  const [actionValue, setActionValue] = useState('');
  const [initialActionValue] = useState('');
  const [addedActions, setAddedActions] = useState([]);
  const [initialAddedActions, setInitialAddedActions] = useState([]);
  const [availableResources, setAvailableResources] = useState([]);
  const [availableActions, setAvailableActions] = useState([]);
  const [actions, setActions] = useState([]);
  const [addedResources, setAddedResources] = useState([]);
  const [initialAddedResources, setInitialAddedResources] = useState([]);
  const [resources, setResources] = useState([]);
  const [resourceValue, setResourceValue] = useState('');
  const [initialResourceValue] = useState('');
  const [resourceIdentifierValue, setResourceIdentifierValue] = useState('');
  const [effectValue, setEffectValue] = useState();
  const [initialEffectValue, setInitialEffectValue] = useState();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    getData();
    initData();
  }, []);

  useEffect(() => {
    loadResources();
  }, [addedActions, availableActions]);

  const updatePolicy = async () => {
    try {
      const actions = addedActions.map(item => item.action);
      const resources = addedResources.map(item => item.resource);
      const response = await WzRequest.apiReq(
        'PUT',
        `/security/policies/${policy.id}`,
        {
          policy: {
            actions: actions,
            resources: resources,
            effect: effectValue,
          },
        },
      );

      const data = (response.data || {}).data;
      if (data.failed_items && data.failed_items.length) {
        return;
      }
      ErrorHandler.info(
        'Role was successfully updated with the selected policies',
      );
      closeFlyout();
    } catch (error) {
      const options = {
        context: `${EditPolicyFlyout.name}.updatePolicy`,
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
  };

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
    const resources_data = ((resources_request || {}).data || {}).data || {};
    setAvailableResources(resources_data);

    const actions_data = ((actions_request || {}).data || {}).data || {};
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
                {(availableResources[x] || {}).description}
              </p>
            </EuiText>
          </>
        ),
      };
    });
    setResources(resources);
  };

  const initData = () => {
    const policies = ((policy || {}).policy || {}).actions || [];
    const initPolicies = policies.map(item => {
      return { action: item };
    });
    setAddedActions(initPolicies);
    setInitialAddedActions(initPolicies);

    const resources = ((policy || {}).policy || {}).resources || [];
    const initResources = resources.map(item => {
      return { resource: item };
    });
    setAddedResources(initResources);
    setInitialAddedResources(initResources);

    setEffectValue(policy.policy.effect);
    setInitialEffectValue(policy.policy.effect);
  };

  const onEffectValueChange = value => {
    setEffectValue(value);
  };

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

  const onChangeActionValue = async value => {
    setActionValue(value);
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

  const removeAction = action => {
    setAddedActions(addedActions.filter(x => x !== action));
  };

  const actions_columns = [
    {
      field: 'action',
      name: i18n.translate(
        'wazuh.public.components.security.policies.edit.Actions',
        {
          defaultMessage: 'Actions',
        },
      ),
      sortable: true,
      truncateText: true,
    },
    {
      name: '',
      actions: [
        {
          name: Title1,
          description: Descp1,
          type: 'icon',
          enabled: () => !isReserved,
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
      name: Title2,
      sortable: true,
      truncateText: true,
    },
    {
      name: '',
      actions: [
        {
          name: Title1,
          description: Descp2,
          type: 'icon',
          color: 'danger',
          enabled: () => !isReserved,
          icon: 'trash',
          onClick: resource => removeResource(resource),
        },
      ],
    },
  ];

  const onChangeResourceValue = async value => {
    setResourceValue(value);
    setResourceIdentifierValue('');
  };

  const getIdentifier = () => {
    const keys = Object.keys(availableResources) || [];
    return (keys[resourceValue] || ':').split(':')[1];
  };

  const onChangeResourceIdentifierValue = async e => {
    setResourceIdentifierValue(e.target.value);
  };

  const removeResource = resource => {
    setAddedResources(addedResources.filter(x => x !== resource));
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

  let modal;
  if (isModalVisible) {
    modal = (
      <EuiOverlayMask>
        <EuiConfirmModal
          title={Title3}
          onConfirm={() => {
            setIsModalVisible(false);
            closeFlyout(false);
          }}
          onCancel={() => setIsModalVisible(false)}
          cancelButtonText="No, don't do it"
          confirmButtonText='Yes, do it'
        >
          <p style={{ textAlign: 'center' }}>
            {i18n.translate('wazuh.components.overview.edit.proceed', {
              defaultMessage:
                'There are unsaved changes. Are you sure you want to proceed?',
            })}
          </p>
        </EuiConfirmModal>
      </EuiOverlayMask>
    );
  }
  useEffect(() => {
    if (
      initialActionValue != actionValue ||
      !_.isEqual(addedResources, initialAddedResources) ||
      !_.isEqual(addedActions, initialAddedActions) ||
      initialResourceValue != resourceValue ||
      initialEffectValue != effectValue
    ) {
      setHasChanges(true);
    } else {
      setHasChanges(false);
    }
  }, [actionValue, addedResources, addedActions, resourceValue, effectValue]);

  const onClose = () => {
    hasChanges ? setIsModalVisible(true) : closeFlyout(false);
  };

  return (
    <>
      <WzFlyout flyoutProps={{ className: 'wzApp' }} onClose={onClose}>
        <EuiFlyoutHeader hasBorder={false}>
          <EuiTitle size='m'>
            <h2>
              {i18n.translate('wazuh.components.overview.edit.Editpolicy', {
                defaultMessage: 'Edit policy',
              })}{' '}
              {policy.name}&nbsp;&nbsp;
              {isReserved && (
                <EuiBadge color='primary'>
                  {i18n.translate(
                    'wazuh.components.overview.edit.reserveKeyword',
                    {
                      defaultMessage: 'Reserved',
                    },
                  )}
                </EuiBadge>
              )}
            </h2>
          </EuiTitle>
        </EuiFlyoutHeader>
        <EuiFlyoutBody>
          <EuiForm component='form' style={{ padding: 24 }}>
            <EuiFormRow
              label={i18n.translate(
                'wazuh.public.components.security.policies.edit.name',
                {
                  defaultMessage: 'Policy name',
                },
              )}
              helpText={i18n.translate(
                'wazuh.public.components.security.policies.edit.policy',
                {
                  defaultMessage: 'Introduce a name for this new policy.',
                },
              )}
            >
              <EuiFieldText
                placeholder=''
                disabled={isReserved}
                value={policy.name}
                readOnly={true}
                onChange={() => {}}
                aria-label=''
              />
            </EuiFormRow>
            <EuiSpacer></EuiSpacer>
            <EuiFlexGroup>
              <EuiFlexItem>
                <EuiFormRow
                  label={i18n.translate(
                    'wazuh.public.components.security.policies.edit.Action',
                    {
                      defaultMessage: 'Action',
                    },
                  )}
                  helpText={i18n.translate(
                    'wazuh.public.components.security.policies.edit.carriedOut',
                    {
                      defaultMessage:
                        'Set an action where the policy will be carried out.',
                    },
                  )}
                >
                  <EuiSuperSelect
                    options={actions}
                    disabled={isReserved}
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
                    disabled={!actionValue || isReserved}
                  >
                    {i18n.translate(
                      'wazuh.components.overview.edit.proceed.Add',
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
                    'wazuh.public.components.security.policies.edit.Resource',
                    {
                      defaultMessage: 'Resource',
                    },
                  )}
                  helpText={i18n.translate(
                    'wazuh.public.components.security.policies.edit.select',
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
                    disabled={!addedActions.length || isReserved}
                  />
                </EuiFormRow>
              </EuiFlexItem>
              <EuiFlexItem>
                <EuiFormRow
                  label={i18n.translate(
                    'wazuh.public.components.security.policies.edit.resourseIdentifier',
                    {
                      defaultMessage: 'Resource identifier',
                    },
                  )}
                  helpText={i18n.translate(
                    'wazuh.public.components.security.policies.edit.identifier',
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
                    disabled={!resourceValue || isReserved}
                  />
                </EuiFormRow>
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiFormRow hasEmptyLabelSpace>
                  <EuiButton
                    onClick={() => addResource()}
                    iconType='plusInCircle'
                    disabled={!resourceIdentifierValue || isReserved}
                  >
                    {i18n.translate('wazuh.components.overview.edit.Add', {
                      defaultMessage: 'Add',
                    })}
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
            <EuiFormRow label='Select an effect' helpText='Select an effect.'>
              <EuiSuperSelect
                options={effectOptions}
                valueOfSelected={effectValue}
                onChange={value => onEffectValueChange(value)}
              />
            </EuiFormRow>
            <EuiSpacer />
            <EuiButton disabled={isReserved} onClick={updatePolicy} fill>
              {i18n.translate('wazuh.components.overview.edit.Apply', {
                defaultMessage: 'Apply',
              })}
            </EuiButton>
          </EuiForm>
        </EuiFlyoutBody>
      </WzFlyout>
      {modal}
    </>
  );
};
