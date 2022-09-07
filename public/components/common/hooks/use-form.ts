import { useState } from 'react';
import _ from 'lodash';
import { EpluginSettingType } from '../../../../common/constants';

function getValueFromEvent(event, type){
  return getValueFromEventType?.[type]?.(event) || getValueFromEventType.default(event)
};

const getValueFromEventType = {
  [EpluginSettingType.boolean] : (event: any) => event.target.checked,
  [EpluginSettingType.array]: (value: any) => value,
  [EpluginSettingType.filepicker]: (value: any) => value,
  default: (event: any) => event.target.value,
}

export const useFormFieldChanged = (field, initialValue: any, {validate, onChange: onChangeFormField, type}: {validate?: any, onChange?: any, type: string}) => {
  const [value, setValue] = useState(initialValue);
  const [validationError, setValidationError] = useState(null);

  function onChange(event){
    const currentValue = getValueFromEvent(event, type);
    const error = validate ? validate(currentValue) : false;
    setValue(currentValue);
    validationError !== error && setValidationError(error);
    onChangeFormField && onChangeFormField({field, changed: !_.isEqual(initialValue, currentValue), previousValue: value, currentValue, error});
  };

  function resetValue(){
    setValue(initialValue);
    setValidationError(null);
  };

  return { value, error: validationError, onChange, resetValue };
};

export const useFormChanged = () => {
  const [formFieldsChanged, setFormFieldsChanged] = useState({});

  function onChangeFormField({ field, changed, currentValue, error }: { field: string, changed: boolean, currentValue: any, error: any}){
    if(changed){
      setFormFieldsChanged(state => ({...state, [field]: {currentValue, error}}));
    }else{
      onFormFieldReset(field);
    };
  };

  const fieldsCount: number = Object.keys(formFieldsChanged).length;
  const fieldsSuccessCount: number = Object.entries(formFieldsChanged).filter(([_, {error}]) => !error).length;
  const fieldsErrorCount: number = fieldsCount - fieldsSuccessCount;
  const isValid = fieldsCount === fieldsSuccessCount;

  function onFormFieldReset(field?: string){
    if(field){
      setFormFieldsChanged(state => {
        const { [field]: _, ...rest } = state;
        return {...rest};
      });
    }else{
      setFormFieldsChanged({});
    };
  };

  return { onChangeFormField, fieldsCount, fieldsSuccessCount, fieldsErrorCount, fields: formFieldsChanged, onFormFieldReset, isValid };
};