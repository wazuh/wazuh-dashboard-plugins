import React from 'react';
import {
  EuiButton,
  EuiButtonIcon,
  EuiFlexGroup,
  EuiFlexItem,
  EuiSpacer,
} from '@elastic/eui';

export const InputAssetMap = ({ field, InputForm }) => {
  return (
    <>
      {field.fields.map((fieldNested, indexField) => (
        <EuiFlexGroup>
          {['field', 'value'].map(fieldName => (
            <EuiFlexItem>
              <InputForm {...fieldNested[fieldName]} label={fieldName} />
            </EuiFlexItem>
          ))}
          <EuiFlexItem grow={false} style={{ alignSelf: 'center' }}>
            <EuiButtonIcon
              display='base'
              color='danger'
              iconType='cross'
              onClick={() => field.removeItem(indexField)}
            ></EuiButtonIcon>
          </EuiFlexItem>
        </EuiFlexGroup>
      ))}
      <EuiSpacer />
      <EuiButton onClick={field.addNewItem}>Add</EuiButton>
    </>
  );
};
