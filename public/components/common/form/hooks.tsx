import { useState } from 'react';
import _ from 'lodash';
import { EpluginSettingType } from '../../../../common/constants';

function getValueFromEvent(event, type){
  return getValueFromEventType?.[type]?.(event) || getValueFromEventType.default(event)
};

type TuseFormFieldChanged = {
  onChange?: any
  transformUIInputValue?: (inputValue: any) => any
  type: string
  validate?: (currentValue: any) => string | undefined
}
const getValueFromEventType = {
  [EpluginSettingType.switch] : (event: any) => event.target.checked,
  [EpluginSettingType.editor]: (value: any) => value,
  [EpluginSettingType.filepicker]: (value: any) => value,
  default: (event: any) => event.target.value,
}

export const useFormFieldChanged = (field, initialValue: any, { onChange: onChangeFormField, transformUIInputValue, type, validate }: TuseFormFieldChanged) => {
  const [value, setValue] = useState(initialValue);
  const [validationError, setValidationError] = useState(null);

  function onChange(event){
    if (!event) {
      return;
    }
    const inputValue = getValueFromEvent(event, type);
    const currentValue = transformUIInputValue ? transformUIInputValue(inputValue) : inputValue;
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
