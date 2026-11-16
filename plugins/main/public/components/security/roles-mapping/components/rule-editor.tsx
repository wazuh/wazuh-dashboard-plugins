import React, { useState, useEffect, Fragment } from 'react';
import {
  EuiToolTip,
  EuiButtonIcon,
  EuiTitle,
  EuiFormRow,
  EuiFlexGroup,
  EuiFlexItem,
  EuiPanel,
  EuiText,
  EuiLink,
  EuiPopover,
  EuiButtonEmpty,
  EuiIcon,
  EuiSelect,
  EuiFieldText,
  EuiCodeEditor,
  EuiHorizontalRule,
  EuiComboBox,
  EuiComboBoxOptionOption,
  EuiSpacer,
  EuiConfirmModal,
  EuiCallOut,
  EuiCode,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import {
  getJsonFromRule,
  decodeJsonRule,
  getSelectedUsersFromRules,
  getUnknownUserFields,
  getUserFieldsFromRuleObject,
} from '../helpers/rule-editor.helper';
import { WAZUH_SECURITY_PLUGIN_OPENSEARCH_DASHBOARDS_SECURITY } from '../../../../../common/constants';
import 'brace/mode/json';
import 'brace/snippets/json';
import 'brace/ext/language_tools';
import 'brace/ext/searchbox';
import _ from 'lodash';
import { webDocumentationLink } from '../../../../../common/services/web_documentation';
import { WzButtonPermissions } from '../../../common/permissions/button';

export const RuleEditor = ({
  save,
  initialRule,
  isLoading,
  isReserved,
  internalUsers,
  currentPlatform,
  userFields = [],
  onFormChange,
  saveButtonPermissions = [],
}) => {
  const [logicalOperator, setLogicalOperator] = useState('OR');
  const [isLogicalPopoverOpen, setIsLogicalPopoverOpen] = useState(false);
  const [isJsonEditor, setIsJsonEditor] = useState(false);
  const [ruleJson, setRuleJson] = useState('{\n\t\n}');
  const [hasWrongFormat, setHasWrongFormat] = useState(false);
  const [rules, setRules] = useState<any[]>([]);
  const [initialRules, setInitialRules] = useState<any[]>([]);
  const [initialInternalUserRules, setInitialInternalUserRules] = useState<
    any[]
  >([]);
  const [internalUserRules, setInternalUserRules] = useState<any[]>([]);
  const [internalUsersOptions, setInternalUsersOptions] = useState<
    EuiComboBoxOptionOption<any>[]
  >([]);
  const [selectedUsers, setSelectedUsers] = useState<
    EuiComboBoxOptionOption<any>[]
  >([]);
  const [initialSelectedUsers, setInitialSelectedUsers] = useState<
    EuiComboBoxOptionOption<any>[]
  >([]);
  const [initialLogicalOperator, setInitialLogicalOperator] = useState('OR');
  const [showFieldErrors, setShowFieldErrors] = useState(false);
  const [jsonEmptyKey, setJsonEmptyKey] = useState(false);
  const [pendingRule, setPendingRule] = useState<object | null>(null);
  const [unknownFields, setUnknownFields] = useState<string[]>([]);

  const searchOperationOptions = [
    { value: 'FIND', text: 'FIND' },
    { value: 'FIND$', text: 'FIND$' },
    { value: 'MATCH', text: 'MATCH' },
    { value: 'MATCH$', text: 'MATCH$' },
  ];
  const default_user_field =
    currentPlatform === WAZUH_SECURITY_PLUGIN_OPENSEARCH_DASHBOARDS_SECURITY
      ? 'user_name'
      : 'username';
  // Without the list of known fields (not loaded yet) no field can be judged
  const knownUserFields: string[] = userFields;
  const hasKnownUserFields = knownUserFields.length > 0;
  const userFieldOptions = knownUserFields.map(label => ({ label }));
  const getDefaultRule = () => ({
    user_field: '',
    searchOperation: 'FIND',
    value: '',
  });

  useEffect(() => {
    if (initialRule) {
      setStateFromRule(JSON.stringify(initialRule));
      const rulesResult = getRulesFromJson(JSON.stringify(initialRule));
      const _selectedUsers = getSelectedUsersFromRules(
        rulesResult.internalUsersRules,
      );
      setInitialLogicalOperator(rulesResult.logicalOperator);
      setInitialRules(rulesResult.customRules);
      setInitialInternalUserRules(rulesResult.internalUsersRules);
      setInitialSelectedUsers(_selectedUsers);
    }
  }, []);

  useEffect(() => {
    if (internalUsers.length) {
      const users = internalUsers.map(user => ({
        label: user.user,
        id: user.user,
      }));
      setInternalUsersOptions(users);
    }
  }, [internalUsers]);

  const setStateFromRule = jsonRule => {
    const rulesResult = getRulesFromJson(jsonRule);
    if (!rulesResult.wrongFormat) {
      setRules(rulesResult.customRules);
      setInternalUserRules(rulesResult.internalUsersRules);
      const _selectedUsers = getSelectedUsersFromRules(
        rulesResult.internalUsersRules,
      );
      setSelectedUsers(_selectedUsers);
      setIsJsonEditor(false);
    } else {
      setRuleJson(JSON.stringify(JSON.parse(jsonRule), undefined, 2));
      setIsJsonEditor(true);
    }
  };

  const onButtonClick = () =>
    setIsLogicalPopoverOpen(isLogicalPopoverOpen => !isLogicalPopoverOpen);
  const closeLogicalPopover = () => setIsLogicalPopoverOpen(false);

  const selectOperator = op => {
    setLogicalOperator(op);
    closeLogicalPopover();
  };

  const onSelectorChange = (e, idx) => {
    const rulesTmp = [...rules];
    rulesTmp[idx].searchOperation = e.target.value;
    setRules(rulesTmp);
  };

  const updateUserField = (userField: string, idx) => {
    const rulesTmp = [...rules];
    rulesTmp[idx] = { ...rulesTmp[idx], user_field: userField.trim() };
    setRules(rulesTmp);
  };

  const updateValueField = (e, idx) => {
    const rulesTmp = [...rules];
    rulesTmp[idx].value = e.target.value;
    setRules(rulesTmp);
  };

  const removeRule = id => {
    const rulesTmp = [...rules];
    rulesTmp.splice(id, 1);
    setRules(rulesTmp);
  };

  const getRulesFromJson = jsonRule => {
    if (jsonRule !== '{}' && jsonRule !== '') {
      // empty json is valid
      const { customRules, internalUsersRules, wrongFormat, logicalOperator } =
        decodeJsonRule(jsonRule, internalUsers);

      setLogicalOperator(logicalOperator);
      setHasWrongFormat(wrongFormat);

      return { customRules, internalUsersRules, wrongFormat, logicalOperator };
    } else {
      setLogicalOperator('');
      setHasWrongFormat(false);

      return {
        customRules: [],
        internalUsersRules: [],
        wrongFormat: false,
        logicalOperator: 'OR',
      };
    }
  };
  const isUnknownField = (field: string) =>
    field
      ? hasKnownUserFields && !knownUserFields.includes(field)
      : showFieldErrors;

  const printRules = () => {
    const rulesList = rules.map((item, idx) => {
      return (
        <Fragment key={`rule_${idx}`}>
          <EuiFlexGroup>
            <EuiFlexItem>
              <EuiFormRow
                label={i18n.translate(
                  'wazuh.security.ruleEditor.userFieldLabel',
                  {
                    defaultMessage: 'Auth context field',
                  },
                )}
                isInvalid={isUnknownField(item.user_field)}
                error={
                  item.user_field
                    ? i18n.translate(
                        'wazuh.security.ruleEditor.unknownUserFieldWarning',
                        {
                          defaultMessage:
                            'This is not a known auth context field, so the rule may never match.',
                        },
                      )
                    : i18n.translate(
                        'wazuh.security.ruleEditor.emptyUserFieldError',
                        {
                          defaultMessage:
                            'Select or type an auth context field.',
                        },
                      )
                }
              >
                <EuiComboBox
                  isDisabled={isLoading || isReserved}
                  singleSelection={{ asPlainText: true }}
                  placeholder={i18n.translate(
                    'wazuh.security.ruleEditor.userFieldPlaceholder',
                    {
                      defaultMessage: 'Select or type an auth context field',
                    },
                  )}
                  options={userFieldOptions}
                  selectedOptions={
                    item.user_field ? [{ label: item.user_field }] : []
                  }
                  onChange={selected =>
                    updateUserField(selected[0]?.label ?? '', idx)
                  }
                  onCreateOption={value => updateUserField(value, idx)}
                  aria-label={i18n.translate(
                    'wazuh.security.ruleEditor.userFieldLabel',
                    {
                      defaultMessage: 'Auth context field',
                    },
                  )}
                />
              </EuiFormRow>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiFormRow
                label={i18n.translate(
                  'wazuh.security.ruleEditor.searchOperationLabel',
                  {
                    defaultMessage: 'Search operation',
                  },
                )}
              >
                <EuiSelect
                  disabled={isLoading || isReserved}
                  id='selectDocExample'
                  options={searchOperationOptions}
                  value={item.searchOperation}
                  onChange={e => onSelectorChange(e, idx)}
                  aria-label={i18n.translate(
                    'wazuh.security.ruleEditor.searchOperationAriaLabel',
                    {
                      defaultMessage:
                        'Use aria labels when no actual label is in use',
                    },
                  )}
                />
              </EuiFormRow>
            </EuiFlexItem>
            <EuiFlexItem>
              <EuiFormRow
                label={i18n.translate('wazuh.security.ruleEditor.valueLabel', {
                  defaultMessage: 'Value',
                })}
              >
                <EuiFieldText
                  disabled={isLoading || isReserved}
                  placeholder={i18n.translate(
                    'wazuh.security.ruleEditor.valuePlaceholder',
                    {
                      defaultMessage: 'Value to match',
                    },
                  )}
                  value={item.value}
                  onChange={e => updateValueField(e, idx)}
                  aria-label=''
                />
              </EuiFormRow>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiButtonIcon
                style={{ marginTop: 25 }}
                onClick={() => removeRule(idx)}
                iconType='trash'
                color='danger'
                aria-label={i18n.translate(
                  'wazuh.security.ruleEditor.removeRuleAriaLabel',
                  {
                    defaultMessage: 'Remove rule',
                  },
                )}
              />
            </EuiFlexItem>
          </EuiFlexGroup>
          <EuiFlexGroup>
            <EuiFlexItem>
              <EuiHorizontalRule margin='xs' />
            </EuiFlexItem>
          </EuiFlexGroup>
        </Fragment>
      );
    });

    return <div>{rulesList}</div>;
  };

  const addNewRule = () => {
    const rulesTmp = [...rules];
    rulesTmp.push(getDefaultRule());
    setRules(rulesTmp);
  };

  const openJsonEditor = () => {
    const ruleObject = getJsonFromRule(
      internalUserRules,
      rules,
      logicalOperator,
    );

    setRuleJson(JSON.stringify(ruleObject, undefined, 2));
    setIsJsonEditor(true);
  };

  const openVisualEditor = () => {
    setStateFromRule(ruleJson);
  };

  const onChangeRuleJson = e => {
    setRuleJson(e);
    setJsonEmptyKey(false);
    getRulesFromJson(e); // we test format to disable button if it's incorrect
  };

  const getSwitchVisualButton = () => {
    if (hasWrongFormat) {
      return (
        <EuiToolTip
          position='top'
          content={i18n.translate(
            'wazuh.security.ruleEditor.visualEditorUnavailableTooltip',
            {
              defaultMessage:
                "Current rule can't be edited using visual editor",
            },
          )}
        >
          <EuiButtonEmpty
            color='primary'
            isDisabled={hasWrongFormat}
            onClick={() => openVisualEditor()}
          >
            {i18n.translate('wazuh.security.ruleEditor.switchToVisualEditor', {
              defaultMessage: 'Switch to visual editor',
            })}
          </EuiButtonEmpty>
        </EuiToolTip>
      );
    } else {
      return (
        <EuiButtonEmpty color='primary' onClick={() => openVisualEditor()}>
          {i18n.translate('wazuh.security.ruleEditor.switchToVisualEditor', {
            defaultMessage: 'Switch to visual editor',
          })}
        </EuiButtonEmpty>
      );
    }
  };

  const saveRule = () => {
    let ruleToSave;
    let customFields: { user_field: string }[];
    if (isJsonEditor) {
      // if json editor is empty
      if (ruleJson === '') {
        setRuleJson('{}');
      }
      ruleToSave = JSON.parse(ruleJson);
      customFields = getUserFieldsFromRuleObject(ruleToSave);
    } else {
      ruleToSave = getJsonFromRule(internalUserRules, rules, logicalOperator);
      customFields = rules;
    }

    const unknown = getUnknownUserFields(customFields, knownUserFields).filter(
      field => field === '' || hasKnownUserFields,
    );
    if (unknown.includes('')) {
      // A rule without user field can never be saved
      setShowFieldErrors(true);
      setJsonEmptyKey(isJsonEditor);
      return;
    }
    if (unknown.length) {
      setUnknownFields(unknown);
      setPendingRule(ruleToSave);
      return;
    }
    save(ruleToSave);
  };

  const closeUnknownFieldsModal = () => setPendingRule(null);

  const confirmUnknownFieldsModal = () => {
    const ruleToSave = pendingRule;
    setPendingRule(null);
    save(ruleToSave);
  };

  const onChangeSelectedUsers = selectedUsers => {
    setSelectedUsers(selectedUsers);
    const tmpInternalUsersRules = selectedUsers.map(user => {
      return {
        user_field: default_user_field,
        searchOperation: 'FIND',
        value: user.id,
      };
    });
    setInternalUserRules(tmpInternalUsersRules);
  };

  useEffect(() => {
    if (
      !_.isEqual(initialSelectedUsers, selectedUsers) ||
      !_.isEqual(initialRules, rules) ||
      !_.isEqual(initialInternalUserRules, internalUserRules) ||
      !_.isEqual(initialLogicalOperator, logicalOperator)
    ) {
      onFormChange(true);
    } else {
      onFormChange(false);
    }
  }, [selectedUsers, rules, internalUserRules, logicalOperator]);

  return (
    <>
      <EuiPanel>
        <EuiTitle>
          <h2>
            {i18n.translate('wazuh.security.ruleEditor.title', {
              defaultMessage: 'Mapping rules',
            })}
          </h2>
        </EuiTitle>
        <EuiFlexGroup>
          <EuiFlexItem>
            <EuiText>
              <span>
                {i18n.translate('wazuh.security.ruleEditor.description', {
                  defaultMessage:
                    'Assign roles to users who match these rules.',
                })}{' '}
              </span>
              <EuiLink
                href={webDocumentationLink(
                  'user-manual/user-administration/rbac.html',
                )}
                external
                target='_blank'
                rel='noopener noreferrer'
              >
                {i18n.translate('wazuh.security.ruleEditor.learnMoreLink', {
                  defaultMessage: 'Learn more',
                })}
              </EuiLink>
            </EuiText>
          </EuiFlexItem>
        </EuiFlexGroup>
        <EuiFlexGroup>
          <EuiFlexItem>
            <EuiPanel>
              {(isJsonEditor && (
                <Fragment>
                  {jsonEmptyKey && (
                    <Fragment>
                      <EuiCallOut
                        color='danger'
                        size='s'
                        title={i18n.translate(
                          'wazuh.security.ruleEditor.emptyAuthContextField',
                          {
                            defaultMessage:
                              'A rule cannot have an empty auth context field.',
                          },
                        )}
                      />
                      <EuiSpacer size='s' />
                    </Fragment>
                  )}
                  <EuiCodeEditor
                    // theme="textmate"
                    readOnly={isLoading || isReserved}
                    width='100%'
                    height='250px'
                    value={ruleJson}
                    mode='json'
                    onChange={onChangeRuleJson}
                    wrapEnabled
                    // The JSON is validated when saving: the editor worker is
                    // not needed and cannot be loaded on every platform.
                    setOptions={{ useWorker: false }}
                    aria-label={i18n.translate(
                      'wazuh.security.ruleEditor.codeEditorAriaLabel',
                      {
                        defaultMessage: 'Code Editor',
                      },
                    )}
                  />
                </Fragment>
              )) || (
                <Fragment>
                  <EuiTitle size='s'>
                    <h2>
                      {i18n.translate(
                        'wazuh.security.ruleEditor.internalUsersTitle',
                        {
                          defaultMessage: 'Map internal users',
                        },
                      )}
                    </h2>
                  </EuiTitle>
                  <EuiFormRow
                    label={i18n.translate(
                      'wazuh.security.ruleEditor.internalUsersLabel',
                      {
                        defaultMessage: 'Internal users',
                      },
                    )}
                    helpText={i18n.translate(
                      'wazuh.security.ruleEditor.internalUsersHelpText',
                      {
                        defaultMessage:
                          'Assign internal users to the selected role mapping',
                      },
                    )}
                  >
                    <EuiComboBox
                      placeholder={i18n.translate(
                        'wazuh.security.ruleEditor.internalUsersPlaceholder',
                        { defaultMessage: 'Select internal users' },
                      )}
                      options={internalUsersOptions}
                      selectedOptions={selectedUsers}
                      isLoading={isLoading}
                      onChange={onChangeSelectedUsers}
                      isClearable={true}
                      data-test-subj='demoComboBox'
                    />
                  </EuiFormRow>
                  <EuiSpacer />
                  <EuiTitle size='s'>
                    <h2>
                      {i18n.translate(
                        'wazuh.security.ruleEditor.customRulesTitle',
                        {
                          defaultMessage: 'Custom rules',
                        },
                      )}
                    </h2>
                  </EuiTitle>
                  <EuiPopover
                    ownFocus
                    button={
                      <EuiButtonEmpty
                        disabled={isLoading || isReserved}
                        onClick={onButtonClick}
                        iconType='arrowDown'
                        iconSide='right'
                      >
                        {logicalOperator === 'AND'
                          ? i18n.translate(
                              'wazuh.security.ruleEditor.logicalOperatorAnd',
                              {
                                defaultMessage: 'All are true',
                              },
                            )
                          : i18n.translate(
                              'wazuh.security.ruleEditor.logicalOperatorOr',
                              {
                                defaultMessage: 'Any are true',
                              },
                            )}
                      </EuiButtonEmpty>
                    }
                    isOpen={isLogicalPopoverOpen}
                    closePopover={closeLogicalPopover}
                    anchorPosition='downCenter'
                  >
                    <div>
                      <EuiFlexGroup>
                        <EuiFlexItem>
                          <EuiButtonEmpty
                            disabled={isLoading || isReserved}
                            color='text'
                            onClick={() => selectOperator('AND')}
                          >
                            {logicalOperator === 'AND' && (
                              <EuiIcon type='check' />
                            )}
                            {i18n.translate(
                              'wazuh.security.ruleEditor.logicalOperatorAnd',
                              {
                                defaultMessage: 'All are true',
                              },
                            )}
                          </EuiButtonEmpty>
                        </EuiFlexItem>
                      </EuiFlexGroup>
                      <EuiFlexGroup>
                        <EuiFlexItem>
                          <EuiButtonEmpty
                            disabled={isLoading || isReserved}
                            color='text'
                            onClick={() => selectOperator('OR')}
                          >
                            {logicalOperator === 'OR' && (
                              <EuiIcon type='check' />
                            )}
                            {i18n.translate(
                              'wazuh.security.ruleEditor.logicalOperatorOr',
                              {
                                defaultMessage: 'Any are true',
                              },
                            )}
                          </EuiButtonEmpty>
                        </EuiFlexItem>
                      </EuiFlexGroup>
                    </div>
                  </EuiPopover>
                  {printRules()}

                  <EuiButtonEmpty
                    disabled={isLoading || isReserved}
                    color='primary'
                    onClick={() => addNewRule()}
                  >
                    {i18n.translate('wazuh.security.ruleEditor.addRuleButton', {
                      defaultMessage: 'Add new rule',
                    })}
                  </EuiButtonEmpty>
                </Fragment>
              )}
            </EuiPanel>
          </EuiFlexItem>
        </EuiFlexGroup>
        <EuiFlexGroup>
          <EuiFlexItem grow={false}>
            {(isJsonEditor && getSwitchVisualButton()) || (
              <EuiButtonEmpty color='primary' onClick={() => openJsonEditor()}>
                {i18n.translate(
                  'wazuh.security.ruleEditor.switchToJsonEditor',
                  {
                    defaultMessage: 'Switch to JSON editor',
                  },
                )}
              </EuiButtonEmpty>
            )}
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiPanel>
      {pendingRule && (
        <EuiConfirmModal
          title={i18n.translate(
            'wazuh.security.ruleEditor.unknownFieldsModal.title',
            {
              defaultMessage: 'Unknown auth context fields',
            },
          )}
          onCancel={closeUnknownFieldsModal}
          onConfirm={confirmUnknownFieldsModal}
          cancelButtonText={i18n.translate(
            'wazuh.security.ruleEditor.unknownFieldsModal.cancelButton',
            { defaultMessage: 'Cancel' },
          )}
          confirmButtonText={i18n.translate(
            'wazuh.security.ruleEditor.unknownFieldsModal.confirmButton',
            { defaultMessage: 'Save anyway' },
          )}
          defaultFocusedButton='cancel'
        >
          <p>
            {i18n.translate(
              'wazuh.security.ruleEditor.unknownFieldsModal.body',
              {
                defaultMessage:
                  '{count, plural, one {This field is not a known auth context field, so the rules using it may never match any user:} other {These fields are not known auth context fields, so the rules using them may never match any user:}}',
                values: { count: unknownFields.length },
              },
            )}
          </p>
          <EuiSpacer size='s' />
          <ul>
            {unknownFields.map(field => (
              <li key={field}>
                <EuiCode>{field}</EuiCode>
              </li>
            ))}
          </ul>
        </EuiConfirmModal>
      )}
      <EuiFlexGroup style={{ marginTop: 6 }}>
        <EuiFlexItem></EuiFlexItem>
        <EuiFlexItem grow={false}>
          <WzButtonPermissions
            buttonType='default'
            permissions={saveButtonPermissions}
            disabled={isReserved}
            isLoading={isLoading}
            fill
            onClick={() => saveRule()}
          >
            {i18n.translate('wazuh.security.ruleEditor.saveButton', {
              defaultMessage: 'Save role mapping',
            })}
          </WzButtonPermissions>
        </EuiFlexItem>
      </EuiFlexGroup>
    </>
  );
};
