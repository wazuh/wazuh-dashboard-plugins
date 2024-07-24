import React from 'react';
import { get } from 'lodash';
import {
  EuiPanel,
  EuiFlexGroup,
  EuiFlexItem,
  EuiTitle,
  EuiSpacer,
  EuiButton,
  EuiButtonIcon,
  EuiIcon,
  EuiToolTip,
} from '@elastic/eui';

const addSpaceBetween = (accum, item) => (
  <>
    {accum}
    <EuiSpacer />
    {item}
  </>
);

const groupFieldsFormByGroup = (fields, groupKey) =>
  Object.entries(fields)
    .map(([name, item]) => ({ ...item, name }))
    .reduce((accum, item) => {
      const groupName = get(item, groupKey) || '__default';

      if (!accum[groupName]) {
        accum[groupName] = [];
      }

      accum[groupName].push(item);
      return accum;
    }, {});

export const FormGroup = ({
  specForm,
  groupInputsByKey,
  renderGroups,
  onSave = props => {
    console.log(props);
  },
  ...props
}: {
  specForm: any;
  groupInputsByKey: string;
  renderGroups: { title: string; groupKey: string }[];
  onSave: ({ fields, errors, changed }) => void;
}) => {
  const { useForm, InputForm } = props;
  const { fields, errors, changed } = useForm(specForm);

  const fieldsSplitted = groupFieldsFormByGroup(fields, groupInputsByKey);

  const renderInput = ({ name, ...rest }) => {
    if (rest.type !== 'arrayOf') {
      return <InputForm {...rest} label={name} />;
    }

    return (
      <EuiPanel>
        <EuiFlexGroup>
          <EuiFlexItem>
            <EuiTitle>
              <h4>{name}</h4>
            </EuiTitle>
          </EuiFlexItem>
        </EuiFlexGroup>
        {rest.fields.map((item, index) => (
          <EuiFlexGroup>
            <EuiFlexItem>
              {Object.entries(item).map(([name, field]) =>
                renderInput({
                  ...field,
                  name,
                }),
              )}
            </EuiFlexItem>
            <EuiFlexItem grow={false} style={{ alignSelf: 'center' }}>
              <EuiButtonIcon
                display='base'
                color='danger'
                iconType='cross'
                onClick={() => rest.removeItem(index)}
              ></EuiButtonIcon>
            </EuiFlexItem>
          </EuiFlexGroup>
        ))}
        <EuiSpacer />
        <EuiButton onClick={rest.addNewItem}>Add</EuiButton>
      </EuiPanel>
    );
  };

  return (
    <>
      {renderGroups
        .map(({ title, groupKey }) => (
          <InputGroup
            title={title}
            fields={fieldsSplitted[groupKey]}
            renderInput={renderInput}
          />
        ))
        .reduce(addSpaceBetween)}
      <EuiSpacer />
      <EuiFlexGroup justfyContent='flexEnds'>
        <EuiFlexItem grow={false}>
          <EuiButton
            fill
            isDisabled={Boolean(Object.keys(errors).length)}
            onClick={() => onSave({ fields, errors, changed })}
          >
            Save
          </EuiButton>
        </EuiFlexItem>
      </EuiFlexGroup>
    </>
  );
};

const InputGroup = ({ title, fields, renderInput }) => (
  <EuiPanel>
    <EuiFlexGroup>
      <EuiFlexItem>
        <EuiTitle>
          <h4>{title}</h4>
        </EuiTitle>
      </EuiFlexItem>
    </EuiFlexGroup>
    {fields
      .map(formField =>
        renderInput({
          ...formField,
          name: (
            <InputLabel
              label={formField?._meta?.label || formField?.name}
              description={formField?._spec?.description}
            />
          ),
        }),
      )
      .reduce(addSpaceBetween)}
  </EuiPanel>
);

const InputLabel = ({
  label,
  description,
}: {
  label: string;
  description: string;
}) => (
  <>
    {label}
    {description && (
      <span>
        <EuiToolTip position='top' content={description}>
          <EuiIcon type='questionInCircle' />
        </EuiToolTip>
      </span>
    )}
  </>
);
