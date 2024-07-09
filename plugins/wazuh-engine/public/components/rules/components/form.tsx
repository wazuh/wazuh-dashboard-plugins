import React from 'react';
import spec from '../spec.json';

const transformSpecToForm = specification => {
  return Object.fromEntries(
    Object.entries(specification).map(([key, value]) => [
      key,
      { type: value.field.type, initialValue: value.field.initialValue },
    ]),
  );
};

export const RuleForm = props => {
  const { useForm, InputForm } = props;
  const { fields } = useForm(transformSpecToForm(spec));

  return (
    <>
      {Object.entries(fields).map(([name, formField]) => (
        <InputForm {...formField} label={name} />
      ))}
    </>
  );
};
