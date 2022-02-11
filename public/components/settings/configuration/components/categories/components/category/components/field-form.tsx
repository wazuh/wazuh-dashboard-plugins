/*
 * Wazuh app - React component building the configuration component.
 *
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import React, { useState, useEffect } from 'react';
import { validate } from 'node-cron';
import {
  EuiFieldText,
  EuiFieldNumber,
  EuiSwitch,
  EuiSelect,
  EuiCodeEditor,
  EuiTextColor
} from '@elastic/eui';
import { ISetting } from '../../../../../configuration';
import 'brace/mode/javascript';
import 'brace/snippets/javascript';
import 'brace/ext/language_tools';
import "brace/ext/searchbox";
import {
  UI_ERROR_SEVERITIES,
  UIErrorLog, UIErrorSeverity,
  UILogLevel,
} from '../../../../../../../../react-services/error-orchestrator/types';
import { UI_LOGGER_LEVELS } from '../../../../../../../../../common/constants';
import { getErrorOrchestrator } from '../../../../../../../../react-services/common-services';
import _ from 'lodash';

interface IFieldForm {
  item: ISetting
  updatedConfig: { [field: string]: string | number | boolean | [] }
  setUpdatedConfig({ }): void
}
export const FieldForm: React.FunctionComponent<IFieldForm> = (props) => {
  const { item } = props;
  switch (item.form.type) {
    case 'text':
      return <TextForm {...props} />
    case 'number':
      return <NumberForm {...props} />
    case 'boolean':
      return <BooleanForm {...props} />
    case 'list':
      return <ListForm {...props} />
    case 'array':
      return <ArrayForm {...props} />
    case 'interval':
      return <IntervalForm {...props} />
    default:
      return null;
  }
};

//#region forms
const TextForm: React.FunctionComponent<IFieldForm> = (props) => (
  <EuiFieldText
    fullWidth
    value={getValue(props)}
    onChange={e => onChange(e.target.value, props)} />);

const NumberForm: React.FunctionComponent<IFieldForm> = (props) => (
  <EuiFieldNumber
    fullWidth
    value={getValue(props)}
    onChange={e => onChange(e.target.value, props)} />)
const BooleanForm: React.FunctionComponent<IFieldForm> = (props) => (
  <EuiSwitch
    label={`${getValue(props)}`}
    checked={getValue(props)}
    onChange={(e) => onChange(e.target.checked, props)} />);

const ListForm: React.FunctionComponent<IFieldForm> = (props) => (
  <EuiSelect
    {...props.item.form.params}
    value={getValue(props)}
    onChange={(e) => onChange(e.target.value, props)} />);

const IntervalForm: React.FunctionComponent<IFieldForm> = (props) => {
  const [interval, setInterval] = useState<string>(getValue(props));
  const [invalid, setInvalid] = useState(false);
  useEffect(() => {
    if (validate(interval)) {
      setInvalid(false);
      getValue(props) !== interval && onChange(interval, props);
    } else {
      setInvalid(true);
      deleteChange(props);
    }
  }, [interval])
  return (
    <>
      <EuiFieldText
        fullWidth
        value={interval}
        isInvalid={invalid}
        onChange={e => setInterval(e.target.value)}
      />
      {invalid && <EuiTextColor color='danger'>Invalid cron schedule expressions</EuiTextColor>}
    </>
  );
}

const ArrayForm: React.FunctionComponent<IFieldForm> = (props) => {
  const [list, setList] = useState(JSON.stringify(getValue(props)));

  useEffect(() => {
    checkErrors();
  }, [list]);

  const checkErrors = () => {
    try {
      const parsed = JSON.parse(list);
      onChange(parsed, props);
    } catch (error) {
      const options: UIErrorLog = {
        context: `${FieldForm.name}.checkErrors`,
        level: UI_LOGGER_LEVELS.ERROR as UILogLevel,
        severity: UI_ERROR_SEVERITIES.UI as UIErrorSeverity,
        error: {
          error: error,
          message: error.message || error,
          title: error.message || error,
        },
      };

      getErrorOrchestrator().handleError(options);
    }
  }
  return (
    <EuiCodeEditor
      mode='javascript'
      height='50px'
      width='100%'
      value={list}
      onChange={setList}
   />
  );
}

//#endregion

//#region Helpers

const getValue = ({ item, updatedConfig }: IFieldForm) => typeof updatedConfig[item.setting] !== 'undefined'
  ? updatedConfig[item.setting]
  : item.value;

const onChange = (value: string | number | boolean | [], props: IFieldForm) => {
  const { updatedConfig, setUpdatedConfig, item } = props;
  if(!_.isEqual(item.value,value)){
    setUpdatedConfig({
      ...updatedConfig,
      [item.setting]: value,
    })
  }else{
    deleteChange(props);
  }
}

const deleteChange = (props: IFieldForm) => {
  const { updatedConfig, setUpdatedConfig, item } = props;
  const newConfig = { ...updatedConfig };
  delete newConfig[item.setting];
  setUpdatedConfig(newConfig);
}

//#endregion
