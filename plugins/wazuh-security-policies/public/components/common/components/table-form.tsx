import React, { useState } from 'react';
import { EuiButton } from '@elastic/eui';
import { inputArray } from '../../utils/inputs/array-inputs';
import { inputString } from '../../utils/inputs/string-inputs';

interface TableFormProps {
  parentKey: string;
  handleSetItem: (props: { key: string; newValue: any }) => void;
}

export const TableForm = (props: TableFormProps) => {
  const { parentKey, handleSetItem } = props;
  const [valueObject, setValueObject] = useState({ field: '', value: '' });
  const [valueArray, setValueArray] = useState<Record<string, string>[]>([]);

  const handleObjectItem = ({
    key,
    newValue,
  }: {
    key: string;
    newValue: any;
  }) => {
    setValueObject({ ...valueObject, [key]: newValue });
  };

  const restartValue = () => setValueObject({ field: '', value: '' });

  const handleAddButton = () => {
    setValueArray([...valueArray, { [valueObject.field]: valueObject.value }]);
    restartValue();
  };

  const handleSaveButton = () => {
    handleSetItem({
      key: parentKey,
      newValue: valueArray,
    });
  };

  return (
    <>
      {inputString(
        {
          key: 'field',
          value: valueObject.field,
          handleSetItem: handleObjectItem,
        },
        true,
      )}
      {inputString(
        {
          key: 'value',
          value: valueObject.value,
          handleSetItem: handleObjectItem,
        },
        true,
      )}
      <EuiButton
        size='s'
        onClick={() => {
          handleAddButton();
        }}
        disabled={valueObject.field === '' || valueObject.value === ''}
      >
        Add item
      </EuiButton>
      {inputArray(
        {
          key: parentKey,
          value: valueArray,
          handleSetItem: handleSetItem,
        },
        true,
      )}
      <EuiButton
        size='s'
        onClick={() => {
          handleSaveButton();
        }}
        disabled={valueArray.length === 0}
      >
        Save
      </EuiButton>
    </>
  );
};
