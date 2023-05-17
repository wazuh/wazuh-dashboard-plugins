import { useState, useRef } from 'react';
import { isEqual } from 'lodash';
import { EpluginSettingType } from '../../../../common/constants';

type SettingTypes = 'text' | 'textarea' | 'number' | 'select' | 'switch' | 'editor' | 'filepicker';

interface FieldConfiguration {
  initialValue: any;
  validate?: (value: any) => string | undefined;
  transformChangedInputValue?: (value: any) => any;
  transformChangedOutputValue?: (value: any) => any;
}

export interface DefaultFieldConfiguration extends FieldConfiguration {
  type: SettingTypes;
}

type CustomSettingType = 'custom';
interface CustomFieldConfiguration extends FieldConfiguration {
  type: CustomSettingType;
  component: (props: any) => JSX.Element;
}

export interface FormConfiguration {
  [key: string]: DefaultFieldConfiguration | CustomFieldConfiguration;
}


interface EnhancedField {
  currentValue: any;
  initialValue: any;
  value: any;
  changed: boolean;
  error: string;
  setInputRef: (reference: any) => void;
  inputRef: any;
  onChange: (event: any) => void;
}

interface EnhancedDefaultField extends EnhancedField {
  type: SettingTypes;
}

interface EnhancedCustomField extends EnhancedField {
  type: CustomSettingType;
  component: (props: any) => JSX.Element;
}

interface EnhancedFields {
  [key: string]: EnhancedDefaultField | EnhancedCustomField;
}

interface UseFormReturn {
  fields: EnhancedFields;
  changed: { [key: string]: any };
  errors: { [key: string]: string };
  undoChanges: () => void;
  doChanges: () => void;
}

function getValueFromEvent(event: any, type: SettingTypes | CustomSettingType): any {
  return (getValueFromEventType[type] || getValueFromEventType.default)(event);
};

const getValueFromEventType = {
  [EpluginSettingType.switch] : (event: any) => event.target.checked,
  [EpluginSettingType.editor]: (value: any) => value,
  [EpluginSettingType.filepicker]: (value: any) => value,
  [EpluginSettingType.select]: (event: any) => event.target.value,
  [EpluginSettingType.text]: (event: any) => event.target.value,
  [EpluginSettingType.textarea]: (event: any) => event.target.value,
  [EpluginSettingType.number]: (event: any) => event.target.value,
  custom: (event: any) => event.target.value,
  default: (event: any) => event.target.value,
};

export const useForm = (fields: FormConfiguration): UseFormReturn => {
  const [formFields, setFormFields] = useState<{ [key: string]: { currentValue: any, initialValue: any } }>(
    Object.entries(fields).reduce((accum, [fieldKey, fieldConfiguration]) => ({
      ...accum,
      [fieldKey]: {
        currentValue: fieldConfiguration.initialValue,
        initialValue: fieldConfiguration.initialValue,
      }
    }), {})
  );

  const fieldRefs = useRef<{ [key: string]: any }>({});

  const enhanceFields = Object.entries(formFields).reduce((accum, [fieldKey, {currentValue: value, ...restFieldState}]) => ({
    ...accum,
    [fieldKey]: {
      ...fields[fieldKey],
      ...restFieldState,
      type: fields[fieldKey].type,
      value,
      changed: !isEqual(restFieldState.initialValue, value),
      error: fields[fieldKey]?.validate?.(value),
      setInputRef: (reference: any) => {fieldRefs.current[fieldKey] = reference},
      inputRef: fieldRefs.current[fieldKey],
      onChange: (event: any) => {
        const inputValue = getValueFromEvent(event, fields[fieldKey].type);
        const currentValue = fields[fieldKey]?.transformChangedInputValue?.(inputValue) ?? inputValue;
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
    Object.entries(enhanceFields as EnhancedFields).filter(([, {changed}]) => changed).map(([fieldKey, {value}]) => ([fieldKey, fields[fieldKey]?.transformChangedOutputValue?.(value) ?? value]))
  );

  const errors = Object.fromEntries(
    Object.entries(enhanceFields as EnhancedFields).filter(([, {error}]) => error).map(([fieldKey, {error}]) => ([fieldKey, error]))
  );

  function undoChanges(){
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

  function doChanges(){
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
    undoChanges,
    doChanges
  };
};