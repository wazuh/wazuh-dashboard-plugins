import { useState } from 'react';
import _ from 'lodash';
import { EpluginSettingType } from '../../../../common/constants';

function getValueFromEvent(event, type){
  return getValueFromEventType?.[type]?.(event) || getValueFromEventType.default(event)
};

const getValueFromEventType = {
  [EpluginSettingType.switch] : (event: any) => event.target.checked,
  [EpluginSettingType.editor]: (value: any) => value,
  default: (event: any) => event.target.value,
};


export const useForm = (fields) => {
  const [formFields, setFormFields] = useState(Object.entries(fields).reduce((accum, [fieldKey, fieldConfiguration]) => ({
    ...accum,
    [fieldKey]: {
      currentValue: fieldConfiguration.initialValue,
      initialValue: fieldConfiguration.initialValue,
    }
  }), {}));

  const enhanceFields = Object.entries(formFields).filter(f => {return f}).reduce((accum, [fieldKey, fieldState]) => ({
    ...accum,
    [fieldKey]: {
      ...fields[fieldKey],
      type: fields[fieldKey].type,
      value: fieldState.currentValue,
      changed: !_.isEqual(fieldState.initialValue, fieldState.currentValue),
      error: fields[fieldKey]?.validate?.(fieldState.currentValue),
      onChange: (event) => {
        const inputValue = getValueFromEvent(event, fields[fieldKey].type);
        const currentValue = fields[fieldKey]?.transformUIInputValue?.(inputValue) ?? inputValue;
        setFormFields(state => ({
          ...state,
          [fieldKey]: {
            ...state[fieldKey],
            currentValue,
          }
        }))
      },
    }
  }), {});

  const changed = Object.fromEntries(
    Object.entries(enhanceFields).filter(([, {changed}]) => changed).map(([fieldKey, {value}]) => ([fieldKey, value]))
  );

  const errors = Object.fromEntries(
    Object.entries(enhanceFields).filter(([, {error}]) => error).map(([fieldKey, {error}]) => ([fieldKey, error]))
  );

  function undoneChanges(){
    setFormFields(state => Object.fromEntries(
      Object.entries(state).map(([fieldKey, fieldConfiguration]) => ([
        fieldKey,
        {
          ...fieldConfiguration,
          currentValue: fieldConfiguration.initialValue
        }
      ]))
    ));
  };

  function doneChanges(){
    setFormFields(state => Object.fromEntries(
      Object.entries(state).map(([fieldKey, fieldConfiguration]) => ([
        fieldKey,
        {
          ...fieldConfiguration,
          initialValue: fieldConfiguration.currentValue
        }
      ]))
    ));
  };

  return {
    fields: enhanceFields,
    changed,
    errors,
    undoneChanges,
    doneChanges
  };
};
