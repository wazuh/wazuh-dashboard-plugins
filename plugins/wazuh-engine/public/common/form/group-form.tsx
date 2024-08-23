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
  EuiText,
  EuiToolTip,
} from '@elastic/eui';

export const addSpaceBetween = (accum, item) => (
  <>
    {accum}
    <EuiSpacer />
    {item}
  </>
);

export const groupFieldsFormByGroup = (fields, groupKey) =>
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
      <FormInputGroupPanel title={name}>
        {rest.fields.map((item, index) => (
          <EuiFlexGroup>
            <EuiFlexItem>
              {Object.entries(item).map(([name, field]) =>
                renderInput({
                  ...field,
                  _label: name,
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
      </FormInputGroupPanel>
    );
  };

  return (
    <>
      {renderGroups
        .map(({ title, groupKey }) => (
          <FormInputGroup
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

export const FormInputGroup = ({
  description,
  title,
  fields,
  renderInput,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  fields: any[];
  renderInput: () => React.ReactNode;
}) => (
  <FormInputGroupPanel title={title} description={description}>
    {fields
      .map(formField =>
        renderInput({
          ...formField,
          _label: formField?._meta?.label || formField?.name,
          name: (
            <FormInputLabel
              label={formField?._meta?.label || formField?.name}
              description={formField?._spec?.description}
            />
          ),
        }),
      )
      .reduce(addSpaceBetween, <></>)}
  </FormInputGroupPanel>
);

export const FormInputLabel = ({
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

export const FormInputGroupPanel = ({
  title,
  description,
  actions,
  children,
}) => (
  <EuiPanel>
    <EuiFlexGroup justifyContent='spaceBetween'>
      <EuiFlexItem>
        <EuiTitle>
          <h4>{title}</h4>
        </EuiTitle>
      </EuiFlexItem>
      {actions && <EuiFlexItem grow={false}>{actions}</EuiFlexItem>}
    </EuiFlexGroup>
    {description && (
      <EuiFlexGroup>
        <EuiFlexItem>
          <EuiText>{description}</EuiText>
        </EuiFlexItem>
      </EuiFlexGroup>
    )}
    {children}
  </EuiPanel>
);
