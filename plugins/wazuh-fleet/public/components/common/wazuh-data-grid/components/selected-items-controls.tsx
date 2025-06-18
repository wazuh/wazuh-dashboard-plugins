import React from 'react';
import { FormattedMessage } from '@osd/i18n/react';
import { EuiText, EuiFlexGroup, EuiFlexItem } from '@elastic/eui';

interface ISelectedAgentsControlsProps {
  selectedItems: Set<object>;
}

export default function SelectedItemsControls({
  selectedItems,
}: ISelectedAgentsControlsProps) {
  const totalSelected = selectedItems?.size;

  return (
    <>
      {selectedItems.size > 0 ? (
        <EuiFlexGroup
          gutterSize='s'
          alignItems='center'
          style={{ width: 'auto', display: 'inline-flex' }}
        >
          <EuiFlexItem grow={false}>
            <EuiText>
              <span style={{ fontSize: '14px' }}>
                <FormattedMessage
                  id='wz.discover.availableFields'
                  defaultMessage='{totalSelected} rows selected'
                  values={{ totalSelected: totalSelected ?? 0 }}
                />
              </span>
            </EuiText>
          </EuiFlexItem>
        </EuiFlexGroup>
      ) : null}
    </>
  );
}
