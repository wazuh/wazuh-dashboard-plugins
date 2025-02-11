import { fireEvent, render } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import { renderHook, act } from '@testing-library/react-hooks';
import React, { useState } from 'react';
import {
  enhanceFormFields,
  getFormFields,
  mapFormFields,
  useForm,
} from './hooks';
import { FormConfiguration, IInputForm } from './types';

describe('[hook] useForm utils', () => {
  it('[utils] getFormFields', () => {
    const result = getFormFields({
      text1: {
        type: 'text',
        initialValue: '',
      },
    });

    expect(result.text1.currentValue).toBe('');
    expect(result.text1.initialValue).toBe('');
  });
  it('[utils] getFormFields', () => {
    const result = getFormFields({
      text1: {
        type: 'text',
        initialValue: 'text1',
      },
      number1: {
        type: 'number',
        initialValue: 1,
      },
    });

    expect(result.text1.currentValue).toBe('text1');
    expect(result.text1.initialValue).toBe('text1');
    expect(result.number1.currentValue).toBe(1);
    expect(result.number1.initialValue).toBe(1);
  });
  it('[utils] getFormFields', () => {
    const result = getFormFields({
      text1: {
        type: 'text',
        initialValue: 'text1',
      },
      arrayOf1: {
        type: 'arrayOf',
        initialValue: [
          {
            'arrayOf1.text1': 'text1',
            'arrayOf1.number1': 10,
          },
        ],
        fields: {
          'arrayOf1.text1': {
            type: 'text',
            initialValue: 'default',
          },
          'arrayOf1.number1': {
            type: 'number',
            initialValue: 0,
          },
        },
      },
    });

    expect(result.text1.currentValue).toBe('text1');
    expect(result.text1.initialValue).toBe('text1');
    expect(result.arrayOf1.fields[0]['arrayOf1.text1'].currentValue).toBe(
      'text1',
    );
    expect(result.arrayOf1.fields[0]['arrayOf1.text1'].initialValue).toBe(
      'text1',
    );
    expect(result.arrayOf1.fields[0]['arrayOf1.number1'].currentValue).toBe(10);
    expect(result.arrayOf1.fields[0]['arrayOf1.number1'].initialValue).toBe(10);
  });
  it('[utils] mapFormFields', () => {
    const result = mapFormFields(
      {
        formDefinition: {
          text1: {
            type: 'text',
            initialValue: 'text1',
          },
          arrayOf1: {
            type: 'arrayOf',
            initialValue: [
              {
                'arrayOf1.text1': 'text1',
                'arrayOf1.number1': 10,
              },
            ],
            fields: {
              'arrayOf1.text1': {
                type: 'text',
                initialValue: 'default',
              },
              'arrayOf1.number1': {
                type: 'number',
                initialValue: 0,
              },
            },
          },
        },
        formState: {
          text1: {
            currentValue: 'changed1',
            initialValue: 'text1',
          },
          arrayOf1: {
            fields: [
              {
                'arrayOf1.text1': {
                  currentValue: 'arrayOf1.text1.changed1',
                  initialValue: 'arrayOf1.text1',
                },
                'arrayOf1.number1': {
                  currentValue: 10,
                  initialValue: 0,
                },
              },
            ],
          },
        },
        pathFieldFormDefinition: [],
        pathFormState: [],
      },
      state => ({ ...state, currentValue: state.initialValue }),
    );

    expect(result.text1.currentValue).toBe('text1');
    expect(result.arrayOf1.fields[0]['arrayOf1.text1'].currentValue).toBe(
      'arrayOf1.text1',
    );
    expect(result.arrayOf1.fields[0]['arrayOf1.number1'].currentValue).toBe(0);
  });
});

describe('[hook] useForm', () => {
  it('[hook] enhanceFormFields', () => {
    let state;
    const setState = updateState => (state = updateState);
    const references = {
      current: {},
    };
    const fields = {
      text1: {
        type: 'text',
        initialValue: '',
      },
    };
    const formFields = getFormFields(fields);
    const enhancedFields = enhanceFormFields(formFields, {
      fields,
      references,
      setState,
    });

    expect(enhancedFields.text1).toBeDefined();
    expect(enhancedFields.text1.type).toBe('text');
    expect(enhancedFields.text1.initialValue).toBe('');
    expect(enhancedFields.text1.value).toBe('');
    expect(enhancedFields.text1.changed).toBeDefined();
    expect(enhancedFields.text1.error).toBeUndefined();
    expect(enhancedFields.text1.setInputRef).toBeDefined();
    expect(enhancedFields.text1.inputRef).toBeUndefined();
    expect(enhancedFields.text1.onChange).toBeDefined();
  });

  it('[hook] enhanceFormFields', () => {
    let state;
    const setState = updateState => (state = updateState);
    const references = {
      current: {},
    };
    const arrayOfFields = {
      'arrayOf1.text1': {
        type: 'text',
        initialValue: 'default',
      },
      'arrayOf1.number1': {
        type: 'number',
        initialValue: 0,
      },
    };
    const fields = {
      text1: {
        type: 'text',
        initialValue: '',
      },
      arrayOf1: {
        type: 'arrayOf',
        initialValue: [
          {
            'arrayOf1.text1': 'text1',
            'arrayOf1.number1': 10,
          },
        ],
        fields: arrayOfFields,
      },
    };
    const formFields = getFormFields(fields);
    const enhancedFields = enhanceFormFields(formFields, {
      fields,
      references,
      setState,
    });

    expect(enhancedFields.text1).toBeDefined();
    expect(enhancedFields.text1.type).toBe('text');
    expect(enhancedFields.text1.initialValue).toBe('');
    expect(enhancedFields.text1.value).toBe('');
    expect(enhancedFields.text1.changed).toBeDefined();
    expect(enhancedFields.text1.error).toBeUndefined();
    expect(enhancedFields.text1.setInputRef).toBeDefined();
    expect(enhancedFields.text1.inputRef).toBeUndefined();
    expect(enhancedFields.text1.onChange).toBeDefined();
    expect(enhancedFields.arrayOf1).toBeDefined();
    expect(enhancedFields.arrayOf1.fields).toBeDefined();
    expect(enhancedFields.arrayOf1.fields).toHaveLength(1);
    expect(enhancedFields.arrayOf1.fields[0]).toBeDefined();
    expect(enhancedFields.arrayOf1.fields[0]['arrayOf1.text1'].type).toBe(
      'text',
    );
    expect(
      enhancedFields.arrayOf1.fields[0]['arrayOf1.text1'].initialValue,
    ).toBe('text1');
    expect(enhancedFields.arrayOf1.fields[0]['arrayOf1.text1'].value).toBe(
      'text1',
    );
    expect(
      enhancedFields.arrayOf1.fields[0]['arrayOf1.text1'].changed,
    ).toBeDefined();
    expect(
      enhancedFields.arrayOf1.fields[0]['arrayOf1.text1'].error,
    ).toBeUndefined();
    expect(
      enhancedFields.arrayOf1.fields[0]['arrayOf1.text1'].setInputRef,
    ).toBeDefined();
    expect(
      enhancedFields.arrayOf1.fields[0]['arrayOf1.text1'].inputRef,
    ).toBeUndefined();
    expect(
      enhancedFields.arrayOf1.fields[0]['arrayOf1.text1'].onChange,
    ).toBeDefined();
  });
});

describe('[hook] useForm', () => {
  it(`[hook] useForm. Verify the initial state`, async () => {
    const initialFields: FormConfiguration = {
      text1: {
        type: 'text',
        initialValue: '',
      },
    };
    const { result } = renderHook(() => useForm(initialFields));

    // assert initial state
    expect(result.current.fields.text1.changed).toBe(false);
    expect(result.current.fields.text1.error).toBeUndefined();
    expect(result.current.fields.text1.type).toBe('text');
    expect(result.current.fields.text1.value).toBe('');
    expect(result.current.fields.text1.initialValue).toBe('');
    expect(result.current.fields.text1.onChange).toBeDefined();
  });

  it(`[hook] useForm. Verify the initial state. Multiple fields.`, async () => {
    const initialFields: FormConfiguration = {
      text1: {
        type: 'text',
        initialValue: '',
      },
      number1: {
        type: 'number',
        initialValue: 1,
      },
    };
    const { result } = renderHook(() => useForm(initialFields));

    // assert initial state
    expect(result.current.fields.text1.changed).toBe(false);
    expect(result.current.fields.text1.error).toBeUndefined();
    expect(result.current.fields.text1.type).toBe('text');
    expect(result.current.fields.text1.value).toBe('');
    expect(result.current.fields.text1.initialValue).toBe('');
    expect(result.current.fields.text1.onChange).toBeDefined();

    expect(result.current.fields.number1.changed).toBe(false);
    expect(result.current.fields.number1.error).toBeUndefined();
    expect(result.current.fields.number1.type).toBe('number');
    expect(result.current.fields.number1.value).toBe(1);
    expect(result.current.fields.number1.initialValue).toBe(1);
    expect(result.current.fields.number1.onChange).toBeDefined();
  });

  it(`[hook] useForm lifecycle. Set the initial value. Change the field value. Undo changes. Change the field. Do changes.`, async () => {
    const initialFieldValue = '';
    const fieldType = 'text';
    const initialFields: FormConfiguration = {
      text1: {
        type: fieldType,
        initialValue: initialFieldValue,
      },
    };
    const { result } = renderHook(() => useForm(initialFields));

    // assert initial state
    expect(result.current.fields.text1.changed).toBe(false);
    expect(result.current.fields.text1.error).toBeUndefined();
    expect(result.current.fields.text1.type).toBe(fieldType);
    expect(result.current.fields.text1.value).toBe(initialFieldValue);
    expect(result.current.fields.text1.initialValue).toBe(initialFieldValue);
    expect(result.current.fields.text1.onChange).toBeDefined();

    // change the input
    const changedValue = 't';

    act(() => {
      result.current.fields.text1.onChange({
        target: {
          value: changedValue,
        },
      });
    });

    // assert changed state
    expect(result.current.fields.text1.changed).toBe(true);
    expect(result.current.fields.text1.error).toBeUndefined();
    expect(result.current.fields.text1.type).toBe(fieldType);
    expect(result.current.fields.text1.value).toBe(changedValue);
    expect(result.current.fields.text1.initialValue).toBe(initialFieldValue);

    // undone changes
    act(() => {
      result.current.undoChanges();
    });

    // assert undo changes state
    expect(result.current.fields.text1.changed).toBe(false);
    expect(result.current.fields.text1.error).toBeUndefined();
    expect(result.current.fields.text1.type).toBe(fieldType);
    expect(result.current.fields.text1.value).toBe(initialFieldValue);
    expect(result.current.fields.text1.initialValue).toBe(initialFieldValue);

    // change the input
    const changedValue2 = 'e';

    act(() => {
      result.current.fields.text1.onChange({
        target: {
          value: changedValue2,
        },
      });
    });

    // assert changed state
    expect(result.current.fields.text1.changed).toBe(true);
    expect(result.current.fields.text1.error).toBeUndefined();
    expect(result.current.fields.text1.type).toBe(fieldType);
    expect(result.current.fields.text1.value).toBe(changedValue2);
    expect(result.current.fields.text1.initialValue).toBe(initialFieldValue);

    // done changes
    act(() => {
      result.current.doChanges();
    });

    // assert do changes state
    expect(result.current.fields.text1.changed).toBe(false);
    expect(result.current.fields.text1.error).toBeUndefined();
    expect(result.current.fields.text1.type).toBe(fieldType);
    expect(result.current.fields.text1.value).toBe(changedValue2);
    expect(result.current.fields.text1.initialValue).toBe(changedValue2);
  });

  it(`[hook] useForm lifecycle. Set the initial value. Change the field value to invalid value`, async () => {
    const initialFieldValue = 'test';
    const fieldType = 'text';
    const initialFields: FormConfiguration = {
      text1: {
        type: fieldType,
        initialValue: initialFieldValue,
        validate: (value: string): string | undefined =>
          value.length > 0
            ? undefined
            : `Validation error: string can be empty.`,
      },
    };
    const { result } = renderHook(() => useForm(initialFields));

    // assert initial state
    expect(result.current.fields.text1.changed).toBe(false);
    expect(result.current.fields.text1.error).toBeUndefined();
    expect(result.current.fields.text1.type).toBe(fieldType);
    expect(result.current.fields.text1.value).toBe(initialFieldValue);
    expect(result.current.fields.text1.initialValue).toBe(initialFieldValue);
    expect(result.current.fields.text1.onChange).toBeDefined();

    // change the input
    const changedValue = '';

    act(() => {
      result.current.fields.text1.onChange({
        target: {
          value: changedValue,
        },
      });
    });

    // assert changed state
    expect(result.current.fields.text1.changed).toBe(true);
    expect(result.current.fields.text1.error).toBeTruthy();
    expect(result.current.fields.text1.type).toBe(fieldType);
    expect(result.current.fields.text1.value).toBe(changedValue);
    expect(result.current.fields.text1.initialValue).toBe(initialFieldValue);
  });

  it.only(`[hook] useForm. ArrayOf.`, async () => {
    const initialFields: FormConfiguration = {
      text1: {
        type: 'text',
        initialValue: '',
      },
      arrayOf1: {
        type: 'arrayOf',
        initialValue: [
          {
            'arrayOf1.text1': 'text1',
            'arrayOf1.number1': 10,
          },
        ],
        fields: {
          'arrayOf1.text1': {
            type: 'text',
            initialValue: 'default',
          },
          'arrayOf1.number1': {
            type: 'number',
            initialValue: 0,
            options: {
              min: 0,
              max: 10,
              integer: true,
            },
          },
        },
      },
    };
    const { result } = renderHook(() => useForm(initialFields));

    // assert initial state
    expect(result.current.fields.text1.changed).toBe(false);
    expect(result.current.fields.text1.error).toBeUndefined();
    expect(result.current.fields.text1.type).toBe('text');
    expect(result.current.fields.text1.value).toBe('');
    expect(result.current.fields.text1.initialValue).toBe('');
    expect(result.current.fields.text1.onChange).toBeDefined();

    expect(result.current.fields.arrayOf1).toBeDefined();
    expect(result.current.fields.arrayOf1.fields).toBeDefined();
    expect(result.current.fields.arrayOf1.fields).toHaveLength(1);
    expect(result.current.fields.arrayOf1.fields[0]).toBeDefined();
    expect(
      result.current.fields.arrayOf1.fields[0]['arrayOf1.text1'].type,
    ).toBe('text');
    expect(
      result.current.fields.arrayOf1.fields[0]['arrayOf1.text1'].initialValue,
    ).toBe('text1');
    expect(
      result.current.fields.arrayOf1.fields[0]['arrayOf1.text1'].value,
    ).toBe('text1');
    expect(
      result.current.fields.arrayOf1.fields[0]['arrayOf1.text1'].changed,
    ).toBeDefined();
    expect(
      result.current.fields.arrayOf1.fields[0]['arrayOf1.text1'].error,
    ).toBeUndefined();
    expect(
      result.current.fields.arrayOf1.fields[0]['arrayOf1.text1'].setInputRef,
    ).toBeDefined();
    expect(
      result.current.fields.arrayOf1.fields[0]['arrayOf1.text1'].inputRef,
    ).toBeUndefined();
    expect(
      result.current.fields.arrayOf1.fields[0]['arrayOf1.text1'].onChange,
    ).toBeDefined();
    expect(
      result.current.fields.arrayOf1.fields[0]['arrayOf1.number1'].type,
    ).toBe('number');
    expect(
      result.current.fields.arrayOf1.fields[0]['arrayOf1.number1'].initialValue,
    ).toBe(10);
    expect(
      result.current.fields.arrayOf1.fields[0]['arrayOf1.number1'].value,
    ).toBe(10);
    expect(
      result.current.fields.arrayOf1.fields[0]['arrayOf1.number1'].changed,
    ).toBeDefined();
    expect(
      result.current.fields.arrayOf1.fields[0]['arrayOf1.number1'].error,
    ).toBeUndefined();
    expect(
      result.current.fields.arrayOf1.fields[0]['arrayOf1.number1'].setInputRef,
    ).toBeDefined();
    expect(
      result.current.fields.arrayOf1.fields[0]['arrayOf1.number1'].inputRef,
    ).toBeUndefined();
    expect(
      result.current.fields.arrayOf1.fields[0]['arrayOf1.number1'].onChange,
    ).toBeDefined();
    expect(
      result.current.fields.arrayOf1.fields[0]['arrayOf1.number1'].options,
    ).toBeDefined();
    expect(
      result.current.fields.arrayOf1.fields[0]['arrayOf1.number1'].options.min,
    ).toBeDefined();
    expect(
      result.current.fields.arrayOf1.fields[0]['arrayOf1.number1'].options.max,
    ).toBeDefined();
    expect(
      result.current.fields.arrayOf1.fields[0]['arrayOf1.number1'].options
        .integer,
    ).toBeDefined();

    // change the input
    const changedValue = 'changed_text';

    act(() => {
      result.current.fields.text1.onChange({
        target: {
          value: changedValue,
        },
      });
    });

    // assert changed state
    expect(result.current.fields.text1.changed).toBe(true);
    expect(result.current.fields.text1.error).toBeUndefined();
    expect(result.current.fields.text1.value).toBe(changedValue);
    expect(result.current.fields.text1.type).toBe('text');
    expect(result.current.fields.text1.initialValue).toBe('');

    // change arrayOf input
    const changedArrayOfValue = 'changed_arrayOf_field';

    act(() => {
      result.current.fields.arrayOf1.fields[0]['arrayOf1.text1'].onChange({
        target: {
          value: changedArrayOfValue,
        },
      });
    });

    expect(
      result.current.fields.arrayOf1.fields[0]['arrayOf1.text1'].changed,
    ).toBe(true);
    expect(
      result.current.fields.arrayOf1.fields[0]['arrayOf1.text1'].error,
    ).toBeUndefined();
    expect(
      result.current.fields.arrayOf1.fields[0]['arrayOf1.text1'].type,
    ).toBe('text');
    expect(
      result.current.fields.arrayOf1.fields[0]['arrayOf1.text1'].value,
    ).toBe(changedArrayOfValue);
    expect(
      result.current.fields.arrayOf1.fields[0]['arrayOf1.text1'].initialValue,
    ).toBe('text1');

    // Undo changes
    act(() => {
      result.current.undoChanges();
    });

    expect(result.current.fields.text1.value).toBe('');
    expect(result.current.fields.text1.changed).toBe(false);

    expect(
      result.current.fields.arrayOf1.fields[0]['arrayOf1.text1'].value,
    ).toBe('text1');
    expect(
      result.current.fields.arrayOf1.fields[0]['arrayOf1.text1'].changed,
    ).toBe(false);
  });

  it('[hook] useForm. Verify the hook behavior when receives a custom field type', async () => {
    const CustomComponent = (props: any) => {
      const { onChange, field, initialValue } = props;
      const [value, setValue] = useState(initialValue || '');

      const handleOnChange = (event: any) => {
        setValue(event.target.value);
        onChange(event);
      };

      return (
        <>
          {field}
          <input type='text' value={value} onChange={handleOnChange} />
        </>
      );
    };

    const formFields: FormConfiguration = {
      customField: {
        type: 'custom',
        initialValue: 'default value',
        component: props => CustomComponent(props),
      },
    };
    const { result } = renderHook(() => useForm(formFields));
    const { container, getByRole } = render(
      <CustomComponent {...result.current.fields.customField} />,
    );

    expect(container).toBeInTheDocument();

    const input = getByRole('textbox');

    expect(input).toHaveValue('default value');
    fireEvent.change(input, { target: { value: 'new value' } });
    expect(result.current.fields.customField.component).toBeInstanceOf(
      Function,
    );
    expect(result.current.fields.customField.value).toBe('new value');
  });
});
