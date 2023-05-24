import { useState, useRef } from 'react';
import { isEqual } from 'lodash';
import { EpluginSettingType } from '../../../../common/constants';
import {
  CustomSettingType,
  EnhancedFields,
  FormConfiguration,
  SettingTypes,
  UseFormReturn,
} from './types';


interface IgetValueFromEventType {
  [key: string]: (event: any) => any;
}

const getValueFromEventType: IgetValueFromEventType = {
  [EpluginSettingType.switch]: (event: any) => event.target.checked,
  [EpluginSettingType.editor]: (value: any) => value,
  custom: (event:any) => event.target,
  default: (event: any) => event.target.value,
};

/**
 * Returns the value of the event according to the type of field
 * When the type is not found, it returns the value defined in the default key
 * 
 * @param event 
 * @param type 
 * @returns event value
 */
function getValueFromEvent(
  event: any,
  type: SettingTypes | CustomSettingType | string,
): any {

  return getValueFromEventType.hasOwnProperty(type) ? getValueFromEventType[type](event) : getValueFromEventType.default(event)
}



export const useForm = (fields: FormConfiguration): UseFormReturn => {
  const [formFields, setFormFields] = useState<{
    [key: string]: { currentValue: any; initialValue: any };
  }>(
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

  const fieldRefs = useRef<{ [key: string]: any }>({});

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
        setInputRef: (reference: any) => {
          fieldRefs.current[fieldKey] = reference;
        },
        inputRef: fieldRefs.current[fieldKey],
        onChange: (event: any) => {
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
  );

  const changed = Object.fromEntries(
    Object.entries(enhanceFields as EnhancedFields)
      .filter(([, { changed }]) => changed)
      .map(([fieldKey, { value }]) => [
        fieldKey,
        fields[fieldKey]?.transformChangedOutputValue?.(value) ?? value,
      ]),
  );

  const errors = Object.fromEntries(
    Object.entries(enhanceFields as EnhancedFields)
      .filter(([, { error }]) => error)
      .map(([fieldKey, { error }]) => [fieldKey, error]),
  ) as { [key: string]: string };

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
