import React, { useMemo } from 'react';
import spec from '../spec.json';
import specMerge from '../spec-merge.json';
import { transfromAssetSpecToForm } from '../utils/transform-asset-spec';
import {
  EuiPanel,
  EuiFlexGroup,
  EuiFlexItem,
  EuiTitle,
  EuiSpacer,
  EuiButton,
} from '@elastic/eui';

const addSpaceBetween = (accum, item) => (
  <>
    {accum}
    <EuiSpacer />
    {item}
  </>
);

export const RuleForm = props => {
  const { useForm, InputForm } = props;
  const specForm = useMemo(() => transfromAssetSpecToForm(spec, specMerge), []);
  const { fields } = useForm(specForm);

  const fieldsSplitted = Object.entries(fields)
    // .filter(([name]) => name === 'parents')
    .reduce(
      (accum, item) => {
        const [name] = item;
        if (name.startsWith('metadata') || ['name', 'parents'].includes(name)) {
          accum.attributes.push(item);
        } else {
          accum.steps.push(item);
        }
        return accum;
      },
      {
        attributes: [],
        steps: [],
      },
    );

  const renderInput = ({ name, ...rest }) => {
    if (rest.type !== 'arrayOf') {
      return <InputForm {...rest} label={rest?._meta?.label || name} />;
    }

    return (
      <EuiPanel>
        <EuiFlexGroup>
          <EuiFlexItem>
            <EuiTitle>
              <h3>{name}</h3>
            </EuiTitle>
          </EuiFlexItem>
        </EuiFlexGroup>
        {rest.fields.map(item => (
          <>
            {Object.entries(item).map(([name, field]) =>
              renderInput({ ...field, name }),
            )}
          </>
        ))}
        <EuiButton onClick={rest.addNewItem}>Add</EuiButton>
      </EuiPanel>
    );
  };

  return (
    <>
      {[
        { title: 'Attributes', fields: fieldsSplitted.attributes },
        { title: 'Steps', fields: fieldsSplitted.steps },
      ]
        .map(params => <InputGroup {...params} renderInput={renderInput} />)
        .reduce(addSpaceBetween)}
    </>
  );
};

const InputGroup = ({ title, fields, renderInput }) => (
  <EuiPanel>
    <EuiFlexGroup>
      <EuiFlexItem>
        <EuiTitle>
          <h3>{title}</h3>
        </EuiTitle>
      </EuiFlexItem>
    </EuiFlexGroup>
    {fields
      .map(([name, formField]) =>
        renderInput({ ...formField, name: formField?._meta?.label || name }),
      )
      .reduce(addSpaceBetween)}
  </EuiPanel>
);
