import React from 'react';
import { EuiRadioGroup } from '@elastic/eui';
import './checkbox-group.scss';

interface RegisterAgentData {
  icon: string;
  title: string;
  hr: boolean;
  architecture: string[];
}

interface Props {
  data: string[];
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
  const handleOptionChange = (optionId: string) => {
    onOptionChange(optionId);
  };

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
      {data.map((arch, idx) => (
        <div
          key={idx}
          className={`checkbox-item${
            idx === 0 || idx === 2 ? ' first-of-row' : ''
          }`}
        >
          <span className='architecture-label'>{arch}</span>
          <EuiRadioGroup
            options={[{ id: `option-${cardIndex}-${idx}` }]}
            idSelected={selectedOption}
            onChange={(id: string) => handleOptionChange(id)}
          />
        </div>
      ))}
    </div>
  );
};

export { CheckboxGroupComponent };
export type { RegisterAgentData };
