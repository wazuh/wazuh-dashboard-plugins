import React from 'react';
import { EuiRadioGroup } from '@elastic/eui';
import './checkbox-group.scss';

interface Props {
  data: [{ label: string; value: string }];
  cardIndex: number;
  selectedOption: string | undefined;
  onOptionChange: (optionId: string) => void;
  onChange: (id: string) => void;
}

const CheckboxGroupComponent: React.FC<Props> = ({
  data,
  cardIndex,
  selectedOption,
  onOptionChange,
}) => {
  const isSingleArchitecture = data.length === 1;
  const isDoubleArchitecture = data.length === 2;
  const isFirstCardWithFourItems = cardIndex === 0 && data.length === 4;

  return (
    <div
      className={`checkbox-group-container${
        isSingleArchitecture ? ' single-architecture' : ''
      }${isFirstCardWithFourItems ? ' first-card-four-items' : ''}${
        isDoubleArchitecture ? ' double-architecture' : ''
      }`}
    >
      {data.map(({ label, value }, idx) => (
        <div
          key={idx}
          className={`checkbox-item${
            idx === 0 || idx === 2 ? ' first-of-row' : ''
          }`}
        >
          <label className='architecture-label' htmlFor={value}>
            {label}
          </label>
          <EuiRadioGroup
            options={[{ id: value }]}
            idSelected={selectedOption}
            onChange={(id: string) => {
              onOptionChange({ target: { value: id } });
            }}
          />
        </div>
      ))}
    </div>
  );
};

export { CheckboxGroupComponent };
