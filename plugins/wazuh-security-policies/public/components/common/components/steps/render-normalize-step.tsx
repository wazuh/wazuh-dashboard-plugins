import React, { useEffect, useState } from 'react';
import {
  EuiButton,
  EuiFlexGroup,
  EuiFlexItem,
  EuiSelect,
  EuiTitle,
} from '@elastic/eui';
import { TableForm } from '../table-form';
import { STEPS } from '../../constants';
import { capitalizeFirstLetter } from '../../../utils/capitalize-first-letter';
import { RenderCheckStep } from './render-check-step';

export const RenderNormalizeStep = (props: {
  step: {
    key: string;
    value: any;
    handleSetItem: (props: { key: string; newValue: any }) => void;
  };
}) => {
  const [itemSelected, setItemSelected] = useState('');
  const [items, setItems] = useState<string[]>([]);
  const optionsToSelect = [
    {
      text: 'Select item',
      value: '',
    },
    {
      text: 'Map',
      value: 'map',
    },
    {
      text: 'Check',
      value: 'check',
    },
    {
      text: 'Parse',
      value: 'parse',
    },
  ];

  const addItem = () => {
    setItems([...items, itemSelected]);
  };

  let options = [
    {
      text: 'Select item',
      value: 'Select item',
    },
    {
      text: 'Map',
      value: 'map',
    },
    {
      text: 'Check',
      value: 'check',
    },
    {
      text: 'Parse',
      value: 'parse',
    },
  ];

  useEffect(() => {
    setItemSelected(options?.[0].value);
    options = optionsToSelect.filter(option => !items.includes(option.value));
  }, [items]);

  return (
    <>
      <EuiFlexGroup direction='row'>
        <EuiFlexItem grow={5}>
          <EuiSelect
            id='addItems'
            hasNoInitialSelection
            options={options}
            value={itemSelected}
            compressed
            fullWidth
            onChange={event => setItemSelected(event.target.value)}
          />
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiButton size='s' onClick={() => addItem()}>
            Add step
          </EuiButton>
        </EuiFlexItem>
      </EuiFlexGroup>
      {items?.map((item, index) => {
        switch (item) {
          case STEPS.check: {
            return (
              <div key={index}>
                <EuiTitle size='xxs'>
                  <h1>{capitalizeFirstLetter(STEPS.check)}</h1>
                </EuiTitle>
                <RenderCheckStep step={props.step} />
              </div>
            );
          }

          default: {
            return (
              <div key={index}>
                <EuiTitle size='xxs'>
                  <h1>Map</h1>
                </EuiTitle>
                <TableForm
                  parentKey={`${props.step.key}.map`}
                  handleSetItem={props.step.handleSetItem}
                />
              </div>
            );
          }
        }
      })}
    </>
  );
};
