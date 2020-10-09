
import React, { useState, useEffect } from 'react';
import {
  EuiToolTip,
  EuiButtonIcon,
  EuiButton,
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
  EuiHorizontalRule
} from '@elastic/eui';

export const RuleEditor = ({ save, initialRule, isLoading, isReserved }) => {
  const [logicalOperator, setLogicalOperator] = useState("AND")
  const [isLogicalPopoverOpen, setIsLogicalPopoverOpen] = useState(false);
  const [isJsonEditor, setIsJsonEditor] = useState(false);
  const [ruleJson, setRuleJson] = useState("{\n\t\n}");
  const [hasWrongFormat, setHasWrongFormat] = useState(false);
  const default_rule = { user_field: "username", searchOperation: "FIND", value: "wazuh" }
  const [rules, setRules] = useState([{ ...default_rule }]);
  const searchOperationOptions = [
    { value: 'FIND', text: 'FIND' },
    { value: 'FIND$', text: 'FIND$' },
    { value: 'MATCH', text: 'MATCH' },
    { value: 'MATCH$', text: 'MATCH$' },
  ];

  useEffect(() => {
    if (initialRule) {
      const ruleTmp = getRuleFromJson(JSON.stringify(initialRule));
      if (!hasWrongFormat) {
        setRules(ruleTmp);
      }
    }
  }, []);

  const onButtonClick = () =>
    setIsLogicalPopoverOpen(isLogicalPopoverOpen => !isLogicalPopoverOpen);
  const closeLogicalPopover = () => setIsLogicalPopoverOpen(false);

  const selectOperator = (op) => {
    setLogicalOperator(op);
    closeLogicalPopover();
  }

  const onSelectorChange = (e, idx) => {
    const rulesTmp = [...rules];
    rulesTmp[idx].searchOperation = e.target.value;
    setRules(rulesTmp);
  }

  const updateUserField = (e, idx) => {
    const rulesTmp = [...rules];
    rulesTmp[idx].user_field = e.target.value;
    setRules(rulesTmp);
  }

  const updateValueField = (e, idx) => {
    const rulesTmp = [...rules];
    rulesTmp[idx].value = e.target.value;
    setRules(rulesTmp);
  }

  const removeRule = (id) => {
    const rulesTmp = [...rules];
    rulesTmp.splice(id, 1);
    setRules(rulesTmp);
  }

  const printRules = () => {
    const rulesList = rules.map((item, idx) => {
      return (
        <>
          <EuiFlexGroup>
            <EuiFlexItem>
              <EuiFormRow label="User field">
                <EuiFieldText
                  disabled={isLoading || isReserved}
                  placeholder=""
                  value={item.user_field}
                  onChange={e => updateUserField(e, idx)}
                  aria-label=""
                />
              </EuiFormRow>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiFormRow label="Search operation">
                <EuiSelect
                  disabled={isLoading || isReserved}
                  id="selectDocExample"
                  options={searchOperationOptions}
                  value={item.searchOperation}
                  onChange={e => onSelectorChange(e, idx)}
                  aria-label="Use aria labels when no actual label is in use"
                />
              </EuiFormRow>
            </EuiFlexItem>
            <EuiFlexItem>
              <EuiFormRow label="Value">
                <EuiFieldText
                  disabled={isLoading || isReserved}
                  placeholder=""
                  value={item.value}
                  onChange={e => updateValueField(e, idx)}
                  aria-label=""
                />
              </EuiFormRow>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiButtonIcon
                style={{ marginTop: 25 }}
                onClick={() => removeRule(idx)}
                iconType="trash"
                color="danger"
                aria-label="Remove rule"
              />
            </EuiFlexItem>
          </EuiFlexGroup>
          <EuiFlexGroup>
            <EuiFlexItem>
              <EuiHorizontalRule margin="xs" />
            </EuiFlexItem>
          </EuiFlexGroup>
        </>
      )
    });

    return (
      <div>{rulesList}</div>
    )
  }

  const addNewRule = () => {
    const rulesTmp = [...rules];
    rulesTmp.push(default_rule);
    setRules(rulesTmp);
  }

  const getJsonFromRule = () => {
    const ruleObject = {};
    const rulesArray = rules.map(item => {
      const tmpRule = {};
      tmpRule[item.searchOperation] = {};
      tmpRule[item.searchOperation][item.user_field] = item.value
      return tmpRule;
    })
    ruleObject[logicalOperator] = rulesArray;
    return ruleObject;
  }

  const openJsonEditor = () => {
    const ruleObject = {};
    const rulesArray = rules.map(item => {
      const tmpRule = {};
      tmpRule[item.searchOperation] = {};
      tmpRule[item.searchOperation][item.user_field] = item.value
      return tmpRule;
    })
    ruleObject[logicalOperator] = rulesArray;
    setRuleJson(JSON.stringify(ruleObject, undefined, 2));
    setIsJsonEditor(true);
  }

  const getRuleFromJson = (jsonRule) => {
    try {
      var wrongFormat = false;
      const ruleObject = JSON.parse(jsonRule);
      if (Object.keys(ruleObject).length !== 1) {
        wrongFormat = true;
      }
      var logicalOperator = Object.keys(ruleObject)[0];
      var rulesArray;
      if (logicalOperator === 'AND' || logicalOperator === 'OR') {
        rulesArray = ruleObject[logicalOperator];
      } else {
        rulesArray = [ruleObject];
        logicalOperator = "AND";
      }
      setLogicalOperator(logicalOperator);
      const tmpRules = rulesArray.map((item, idx) => {
        if (Object.keys(item).length !== 1) {
          wrongFormat = true;
        }
        const searchOperationTmp = Object.keys(item)[0];
        if (Object.keys(item[searchOperationTmp]).length !== 1) {
          wrongFormat = true;
        }
        const userFieldTmp = Object.keys(item[searchOperationTmp])[0];
        const valueTmp = item[searchOperationTmp][userFieldTmp];

        return { user_field: userFieldTmp, searchOperation: searchOperationTmp, value: valueTmp }
      });
      setHasWrongFormat(wrongFormat);
      return tmpRules;
    } catch (error) {
      setHasWrongFormat(true);
    }
  }

  const openVisualEditor = () => {
    const tmpRules = getRuleFromJson(ruleJson);
    setRules(tmpRules);
    setIsJsonEditor(false);
  }

  const onChangeRuleJson = (e) => {
    setRuleJson(e);
    getRuleFromJson(e); // we test format to disable button if it's incorrect
  }

  const getSwitchVisualButton = () => {
    if (hasWrongFormat) {
      return <EuiToolTip
        position="top"
        content="Current rule can't be edited using visual editor">
        <EuiButtonEmpty
          color="primary"
          isDisabled={hasWrongFormat}
          onClick={() => openVisualEditor()}>
          Switch to visual editor
                </EuiButtonEmpty>
      </EuiToolTip>
    } else {
      return <EuiButtonEmpty
        color="primary"
        onClick={() => openVisualEditor()}>
        Switch to visual editor
            </EuiButtonEmpty>
    }
  }

  const saveRule = () => {
    if (isJsonEditor) {
      save(JSON.parse(ruleJson));
    } else {
      save(getJsonFromRule());
    }
  }

  return (
    <>
      <EuiPanel>
        <EuiTitle><h1>Mapping rules</h1></EuiTitle>
        <EuiFlexGroup>
          <EuiFlexItem>
            <EuiText>Assign roles to users who match these rules.
                        <EuiLink href="https://documentation.wazuh.com/current/user-manual/api/rbac/auth_context.html" external target="_blank">
                Learn more
                        </EuiLink>
            </EuiText>
          </EuiFlexItem>
        </EuiFlexGroup>
        <EuiFlexGroup>
          <EuiFlexItem>
            <EuiPanel style={{ backgroundColor: "#F5F7FA" }}>
              {isJsonEditor &&
                <div >
                  <EuiCodeEditor
                    // theme="textmate"
                    readOnly={isLoading || isReserved}
                    width="100%"
                    height="250px"
                    value={ruleJson}
                    mode="json"
                    onChange={onChangeRuleJson}
                    wrapEnabled
                    aria-label="Code Editor"
                  />
                </div>
                ||
                <>
                  <EuiPopover
                    ownFocus
                    button={
                      <EuiButtonEmpty
                        disabled={isLoading || isReserved}
                        onClick={onButtonClick}
                        iconType="arrowDown"
                        iconSide="right">
                        {logicalOperator === "AND" ? "All are true" : "Any are true"}
                      </EuiButtonEmpty>

                    }
                    isOpen={isLogicalPopoverOpen}
                    closePopover={closeLogicalPopover}
                    anchorPosition="downCenter">
                    <div>
                      <EuiFlexGroup>
                        <EuiFlexItem>
                          <EuiButtonEmpty
                            disabled={isLoading || isReserved}
                            color="text"
                            onClick={() => selectOperator('AND')}>
                            {logicalOperator === "AND" && <EuiIcon type="check" />}All are true
                                                    </EuiButtonEmpty>
                        </EuiFlexItem>
                      </EuiFlexGroup>
                      <EuiFlexGroup>
                        <EuiFlexItem>
                          <EuiButtonEmpty
                            disabled={isLoading || isReserved}
                            color="text"
                            onClick={() => selectOperator('OR')}>
                            {logicalOperator === "OR" && <EuiIcon type="check" />}Any are true
                                                    </EuiButtonEmpty>
                        </EuiFlexItem>
                      </EuiFlexGroup>
                    </div>
                  </EuiPopover>
                  {printRules()}

                  <EuiButtonEmpty
                    disabled={isLoading || isReserved}
                    color="primary"
                    onClick={() => addNewRule()}>
                    Add new rule
                                </EuiButtonEmpty>
                </>
              }
            </EuiPanel>
          </EuiFlexItem>
        </EuiFlexGroup>
        <EuiFlexGroup>
          <EuiFlexItem grow={false}>
            {isJsonEditor &&
              getSwitchVisualButton()
              ||
              <EuiButtonEmpty
                color="primary"
                onClick={() => openJsonEditor()}>
                Switch to JSON editor
                        </EuiButtonEmpty>
            }
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiPanel>
      <EuiFlexGroup style={{ marginTop: 6 }}>
        <EuiFlexItem>

        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiButton
            disabled={isReserved}
            isLoading={isLoading} fill onClick={() => saveRule()}>
            Save role mapping
                    </EuiButton>
        </EuiFlexItem>
      </EuiFlexGroup>
    </>
  );
};