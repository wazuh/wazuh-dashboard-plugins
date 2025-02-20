import { useState, useRef } from 'react';
import { isEqual, get, set, cloneDeep } from 'lodash';
import {
  CustomSettingType,
  FormConfiguration,
  SettingTypes,
  UseFormReturn,
} from './types';

type IgetValueFromEventType = Record<string, (event: any) => any>;

// eslint-disable-next-line @typescript-eslint/naming-convention
enum EpluginSettingType { // eslint-disable-next-line @typescript-eslint/naming-convention
  text = 'text', // eslint-disable-next-line @typescript-eslint/naming-convention
  textarea = 'textarea', // eslint-disable-next-line @typescript-eslint/naming-convention
  switch = 'switch', // eslint-disable-next-line @typescript-eslint/naming-convention
  number = 'number', // eslint-disable-next-line @typescript-eslint/naming-convention
  editor = 'editor', // eslint-disable-next-line @typescript-eslint/naming-convention
  select = 'select', // eslint-disable-next-line @typescript-eslint/naming-convention
  filepicker = 'filepicker', // eslint-disable-next-line @typescript-eslint/naming-convention
  password = 'password', // eslint-disable-next-line @typescript-eslint/naming-convention
  arrayOf = 'arrayOf', // eslint-disable-next-line @typescript-eslint/naming-convention
  custom = 'custom', // eslint-disable-next-line @typescript-eslint/naming-convention
}

const getValueFromEventType: IgetValueFromEventType = {
  [EpluginSettingType.switch]: (event: any) => event.target.checked,
  [EpluginSettingType.editor]: (value: any) => value,
  [EpluginSettingType.filepicker]: (value: any) => value,
  [EpluginSettingType.select]: (event: any) => event.target.value,
  [EpluginSettingType.text]: (event: any) => event.target.value,
  [EpluginSettingType.textarea]: (event: any) => event.target.value,
  [EpluginSettingType.number]: (event: any) => event.target.value,
  [EpluginSettingType.password]: (event: any) => event.target.value,
  custom: (event: any) => event.target.value,
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
  type: SettingTypes | CustomSettingType,
): any {
  return (getValueFromEventType[type] || getValueFromEventType.default)(event);
}

export function getFormFields(fields) {
  return Object.fromEntries(
    Object.entries(fields).map(([fieldKey, fieldConfiguration]) => [
      fieldKey,
      {
        ...(fieldConfiguration.type === 'arrayOf'
          ? {
              fields: fieldConfiguration.initialValue.map(item =>
                getFormFields(
                  Object.fromEntries(
                    Object.entries(fieldConfiguration.fields).map(([key]) => [
                      key,
                      {
                        initialValue: item[key],
                        currentValue: item[key],
                        defaultValue: fieldConfiguration?.defaultValue,
                      },
                    ]),
                  ),
                ),
              ),
            }
          : {
              currentValue: fieldConfiguration.initialValue,
              initialValue: fieldConfiguration.initialValue,
              defaultValue: fieldConfiguration?.defaultValue,
            }),
      },
    ]),
  );
}

export function enhanceFormFields(
  formFields,
  {
    fields,
    references,
    setState,
    pathFieldParent = [],
    pathFormFieldParent = [],
  },
) {
  // eslint-disable-next-line unicorn/no-array-reduce
  return Object.entries(formFields).reduce(
    (accum, [fieldKey, { currentValue: value, ...restFieldState }]) => {
      // Define the path to fields object
      const pathField = [...pathFieldParent, fieldKey];
      // Define the path to the form fields object
      const pathFormField = [...pathFormFieldParent, fieldKey];
      // Get the field form the fields
      const field = get(fields, pathField);

      return {
        ...accum,
        [fieldKey]: {
          ...(field.type === 'arrayOf'
            ? {
                type: field.type,
                fields: (() =>
                  restFieldState.fields.map((fieldState, index) =>
                    enhanceFormFields(fieldState, {
                      fields,
                      references,
                      setState,
                      pathFieldParent: [...pathField, 'fields'],
                      pathFormFieldParent: [...pathFormField, 'fields', index],
                    }),
                  ))(),
                addNewItem: () => {
                  setState(state => {
                    const _state = get(state, [...pathField, 'fields']);
                    const newstate = set(
                      state,
                      [...pathField, 'fields', _state.length],
                      Object.fromEntries(
                        Object.entries(field.fields).map(
                          ([key, { defaultValue }]) => [
                            key,
                            {
                              currentValue: cloneDeep(defaultValue),
                              initialValue: cloneDeep(defaultValue),
                              defaultValue: cloneDeep(defaultValue),
                            },
                          ],
                        ),
                      ),
                    );

                    return cloneDeep(newstate);
                  });
                },
              }
            : {
                ...field,
                ...restFieldState,
                type: field.type,
                value,
                changed: !isEqual(restFieldState.initialValue, value),
                error: field?.validate?.(value),
                setInputRef: (reference: any) => {
                  set(references, pathFormField, reference);
                },
                inputRef: get(references, pathFormField),
                onChange: (event: any) => {
                  const inputValue = getValueFromEvent(event, field.type);
                  const currentValue =
                    field?.transformChangedInputValue?.(inputValue) ??
                    inputValue;

                  setState(state => {
                    const newState = set(
                      cloneDeep(state),
                      [...pathFormField, 'currentValue'],
                      currentValue,
                    );

                    return newState;
                  });
                },
              }),
        },
      };
    },
    {},
  );
}

export function mapFormFields(
  {
    formDefinition,
    formState,
    pathFieldFormDefinition = [],
    pathFormState = [],
  },
  callbackFormField,
) {
  // eslint-disable-next-line unicorn/no-array-reduce
  return Object.entries(formState).reduce((accum, [key, value]) => {
    const pathField = [...pathFieldFormDefinition, key];
    const fieldDefinition = get(formDefinition, pathField);

    return {
      ...accum,
      [key]:
        fieldDefinition.type === 'arrayOf'
          ? {
              fields: value.fields.map((valueField, index) =>
                mapFormFields(
                  {
                    formDefinition,
                    formState: valueField,
                    pathFieldFormDefinition: [...pathField, 'fields'],
                    pathFormState: [...pathFormState, key, 'fields', index],
                  },
                  callbackFormField,
                ),
              ),
            }
          : callbackFormField?.(value, key, {
              formDefinition,
              formState,
              pathFieldFormDefinition,
              pathFormState: [...pathFormState, key],
              fieldDefinition,
            }),
    };
  }, {});
}

export const useForm = (fields: FormConfiguration): UseFormReturn => {
  const [formFields, setFormFields] = useState<
    Record<string, { currentValue: any; initialValue: any }>
  >(getFormFields(fields));
  const fieldRefs = useRef<Record<string, any>>({});
  const enhanceFields = enhanceFormFields(formFields, {
    fields,
    references: fieldRefs.current,
    setState: setFormFields,
    pathFieldParent: [],
    pathFormFieldParent: [],
  });
  const { changed, errors } = (() => {
    const result = {
      changed: {},
      errors: {},
    };

    mapFormFields(
      {
        formDefinition: fields,
        formState: enhanceFields,
        pathFieldFormDefinition: [],
        pathFormState: [],
      },
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      ({ changed, error, value }, _, { pathFormState, fieldDefinition }) => {
        if (changed) {
          result.changed[pathFormState] = value;
        }

        if (error) {
          result.errors[pathFormState] = error;
        }
      },
    );

    return result;
  })();

  function undoChanges() {
    setFormFields(state =>
      mapFormFields(
        {
          formDefinition: fields,
          formState: state,
          pathFieldFormDefinition: [],
          pathFormState: [],
        },
        state => ({ ...state, currentValue: state.initialValue }),
      ),
    );
  }

  function doChanges() {
    setFormFields(state =>
      mapFormFields(
        {
          formDefinition: fields,
          formState: state,
          pathFieldFormDefinition: [],
          pathFormState: [],
        },
        state => ({ ...state, initialValue: state.currentValue }),
      ),
    );
  }

  function forEach(callback) {
    return mapFormFields(
      {
        formDefinition: fields,
        formState: enhanceFields,
        pathFieldFormDefinition: [],
        pathFormState: [],
      },
      callback,
    );
  }

  return {
    fields: enhanceFields,
    changed,
    errors,
    undoChanges,
    doChanges,
    forEach,
  };
};
