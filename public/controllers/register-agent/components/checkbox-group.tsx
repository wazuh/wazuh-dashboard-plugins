import React from 'react';
import { EuiRadioGroup } from '@elastic/eui';

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

  return (
    <div>
      {data.map((arch, idx) => (
        <div key={idx}>
          <EuiRadioGroup
            options={[{ id: `option-${cardIndex}-${idx}`, label: arch }]}
            idSelected={selectedOption}
            onChange={id => handleOptionChange(id)}
          />
        </div>
      ))}
    </div>
  );
};

export { CheckboxGroupComponent };
export type { RegisterAgentData };
