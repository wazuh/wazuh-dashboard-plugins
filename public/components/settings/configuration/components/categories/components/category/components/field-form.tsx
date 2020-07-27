/*
 * Wazuh app - React component building the configuration component.
 *
 * Copyright (C) 2015-2020 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import React, { useState, useEffect } from 'react';
import {
  EuiFieldText,
  EuiFieldNumber,
  EuiSwitch,
  EuiSelect,
  EuiCodeEditor
} from '@elastic/eui';
import { ISetting } from '../../../../../configuration';

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

const ArrayForm: React.FunctionComponent<IFieldForm> = (props) => {  
  const [list, setList] = useState(JSON.stringify(getValue(props)));
  useEffect(() => {
    setList(JSON.stringify(getValue(props)))
  }, [props.updatedConfig])
  const checkErrors = () => {
    try {
      const parsed = JSON.parse(list);
      onChange(parsed, props);
    } catch (error) {
      console.log(error);
    }
  }
  return (
    <EuiCodeEditor 
      mode='javascript'
      theme='github'
      height='50px'
      value={list}
      onChange={setList}
      onBlur={checkErrors} />
    );
}

//#endregion

//#region Helpers 

const getValue = ({item, updatedConfig}:IFieldForm) => typeof updatedConfig[item.setting] !== 'undefined'
  ? updatedConfig[item.setting]
  : item.value;

const onChange = (value: string | number | boolean | [], props: IFieldForm) => {
  const { updatedConfig, setUpdatedConfig, item } = props;
  setUpdatedConfig({
    ...updatedConfig,
    [item.setting]: value,
  })
}

//#endregion
