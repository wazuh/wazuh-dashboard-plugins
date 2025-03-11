import { EuiButtonIcon, EuiFlexItem, EuiToolTip } from '@elastic/eui';
import React from 'react';
import { EnhancedFieldConfiguration } from '../form/types';

interface SaveValueButtonProps {
  tooltilProps: { content: React.ReactNode };
  buttonLabel: string;
  onClick: () => void;
  formField: EnhancedFieldConfiguration;
  defaultValue: any;
  setDefaultValue: (value: any) => void;
}

const SaveValueButton = ({
  tooltilProps,
  buttonLabel,
  onClick: onSave,
  formField,
  defaultValue,
  setDefaultValue,
}: SaveValueButtonProps) => {
  const isDisabled =
    !formField.value || !!formField.error || formField.value === defaultValue;

  const onClick = async () => {
    try {
      await onSave();
      setDefaultValue(formField.value);
    } catch {
      /* empty */
    }
  };

  return (
    <>
      <EuiFlexItem grow={false} style={{ marginLeft: 0, marginRight: 0 }}>
        <EuiToolTip {...tooltilProps}>
          <EuiButtonIcon
            iconType='save'
            size='m'
            aria-label={buttonLabel}
            isDisabled={isDisabled}
            onClick={onClick}
          ></EuiButtonIcon>
        </EuiToolTip>
      </EuiFlexItem>
      <EuiFlexItem grow={true}></EuiFlexItem>
    </>
  );
};

export const SaveValueButtonInput = (props: SaveValueButtonProps) => (
  <>
    <EuiFlexItem grow={false} style={{ marginLeft: 0, marginRight: 0 }}>
      <SaveValueButton {...props} />
    </EuiFlexItem>
    <EuiFlexItem grow={true}></EuiFlexItem>
  </>
);
