import { useState, useRef } from 'react';
import { isEqual } from 'lodash';
import { EpluginSettingType } from '../../../../common/constants';
import { IFormFields, IInputForm, IInputFormType, IInputTypes, IInputTypesCustom } from './types';

interface IInputFormEvent {
  [key: string]: (event: any) => any;
  default: (event: any) => any;
}

interface IUseFormFieldsData {
  value: any;
  changed: boolean;
  error: string;
  setInputRef: (reference: any) => void;
  inputRef: any;
  onChange: (event: any) => void;
  initialValue: any;
}

interface IUseFormFieldsDataDefault extends IUseFormFieldsData {
  type: IInputTypes;
}

interface IUseFormFieldsDataCustom extends IUseFormFieldsData {
  type: IInputTypesCustom;
  component: (props: IInputForm) => JSX.Element;
}



interface IUseFormFields {
  [key: string]: IUseFormFieldsDataDefault | IUseFormFieldsDataCustom;
}
interface IUseFormResponse {
  fields: IUseFormFields;
  changed: { [key: string]: any };
  errors: { [key: string]: string };
  undoChanges: () => void;
  doChanges: () => void;
}

const getValueFromEventType: IInputFormEvent = {
  [EpluginSettingType.switch]: (event: any) => event.target.checked,
  [EpluginSettingType.editor]: (value: any) => value,
  [EpluginSettingType.filepicker]: (value: any) => value,
  default: (event: any) => event.target.value,
};

function getValueFromEvent(event: any, type: IInputTypes | IInputTypesCustom) {
  return (getValueFromEventType[type] || getValueFromEventType.default)(event);
}


export const useForm = (fields: IFormFields): IUseFormResponse => {
  const [formFields, setFormFields] = useState(
    Object.entries(fields).reduce(
      (accum, [fieldKey, fieldConfiguration]) => ({
        ...accum,
        [fieldKey]: {
          currentValue: fieldConfiguration.initialValue,
          initialValue: fieldConfiguration.initialValue,
        },
      }),
      {},
    ),
  );

  const fieldRefs = useRef({});

  const enhanceFields = Object.entries(formFields).reduce(
    (accum, [fieldKey, { currentValue: value, ...restFieldState }]) => ({
      ...accum,
      [fieldKey]: {
        ...fields[fieldKey],
        ...restFieldState,
        type: fields[fieldKey].type,
        value,
        changed: !isEqual(restFieldState.initialValue, value),
        error: fields[fieldKey]?.validate?.(value),
        setInputRef: reference => {
          fieldRefs.current[fieldKey] = reference;
        },
        inputRef: fieldRefs.current[fieldKey],
        onChange: event => {
          const inputValue = getValueFromEvent(event, fields[fieldKey].type);
          const currentValue =
            fields[fieldKey]?.transformChangedInputValue?.(inputValue) ??
            inputValue;
          setFormFields(state => ({
            ...state,
            [fieldKey]: {
              ...state[fieldKey],
              currentValue,
            },
          }));
        },
      },
    }),
    {},
  ) as IUseFormFields;

  const changed = Object.fromEntries(
    Object.entries(enhanceFields)
      .filter(([, { changed }]) => changed)
      .map(([fieldKey, { value }]) => [
        fieldKey,
        fields[fieldKey]?.transformChangedOutputValue?.(value) ?? value,
      ]),
  );

  const errors = Object.fromEntries(
    Object.entries(enhanceFields)
      .filter(([, { error }]) => error)
      .map(([fieldKey, { error }]) => [fieldKey, error]),
  );

  function undoChanges() {
    setFormFields(state =>
      Object.fromEntries(
        Object.entries(state).map(([fieldKey, fieldConfiguration]) => [
          fieldKey,
          {
            ...fieldConfiguration,
            currentValue: fieldConfiguration.initialValue,
          },
        ]),
      ),
    );
  }

  function doChanges() {
    setFormFields(state =>
      Object.fromEntries(
        Object.entries(state).map(([fieldKey, fieldConfiguration]) => [
          fieldKey,
          {
            ...fieldConfiguration,
            initialValue: fieldConfiguration.currentValue,
          },
        ]),
      ),
    );
  }

  return {
    fields: enhanceFields,
    changed,
    errors,
    undoChanges,
    doChanges,
  };
};
