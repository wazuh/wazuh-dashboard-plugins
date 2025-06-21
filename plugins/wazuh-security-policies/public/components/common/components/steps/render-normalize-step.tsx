import React, { useState } from 'react';
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
import { RenderParseStep } from './render-parse-step';

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

export const RenderNormalizeStep = (props: {
  step: {
    key: string;
    value: any;
    handleSetItem: (props: { key: string; newValue: any }) => void;
  };
}) => {
  const [itemSelected, setItemSelected] = useState(optionsToSelect[0].text);
  const [items, setItems] = useState<string[]>([]);
  const [optionSelect, setOptionSelect] =
    useState<{ text: string; value: string }[]>(optionsToSelect);

  const addItem = () => {
    setItems([...items, itemSelected]);
    setOptionSelect(
      optionSelect.filter(option => option.value !== itemSelected),
    );
  };

  return (
    <>
      <EuiFlexGroup direction='row'>
        <EuiFlexItem grow={5}>
          <EuiSelect
            id='addItems'
            hasNoInitialSelection
            options={optionSelect}
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
      <EuiFlexGroup>
        {items?.map((item, index) => {
          switch (item) {
            case STEPS.check: {
              return (
                <EuiFlexItem key={index}>
                  <EuiTitle size='xxs'>
                    <h1>{capitalizeFirstLetter(STEPS.check)}</h1>
                  </EuiTitle>
                  <RenderCheckStep
                    step={{
                      ...props.step,
                      key: `${props.step.key}.[0].${STEPS.check}`,
                    }}
                  />
                </EuiFlexItem>
              );
            }

            case STEPS.parse: {
              return (
                <EuiFlexItem key={index}>
                  <EuiTitle size='xxs'>
                    <h1>{capitalizeFirstLetter(STEPS.parse)}</h1>
                  </EuiTitle>
                  <RenderParseStep
                    step={{
                      ...props.step,
                      key: `${props.step.key}.${STEPS.parse}`,
                    }}
                  />
                </EuiFlexItem>
              );
            }

            default: {
              return (
                <EuiFlexItem key={index}>
                  <EuiTitle size='xxs'>
                    <h1>Map</h1>
                  </EuiTitle>
                  <TableForm
                    parentKey={`${props.step.key}.map`}
                    handleSetItem={props.step.handleSetItem}
                  />
                </EuiFlexItem>
              );
            }
          }
        })}
      </EuiFlexGroup>
    </>
  );
};
