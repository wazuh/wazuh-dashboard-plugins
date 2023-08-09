import { fireEvent, render } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import { renderHook, act } from '@testing-library/react-hooks';
import React, { useState } from 'react';
import { useForm } from './hooks';
import { FormConfiguration, IInputForm } from './types';

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
          value.length ? undefined : `Validation error: string can be empty.`,
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

  it('[hook] useForm. Verify the hook behavior when receives a custom field type', async () => {
    const CustomComponent = (props: any) => {
      const { onChange, field, initialValue } = props;
      const [value, setValue] = useState(initialValue || '');

      const handleOnChange = (e: any) => {
        setValue(e.target.value);
        onChange(e);
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
