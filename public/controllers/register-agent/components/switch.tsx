import React, { useState } from 'react';
import { EuiRadioGroup } from '@elastic/eui';

interface RegisterAgentData {
  icon: string;
  title: string;
  hr: boolean;
  architecture: string[];
}

interface Props {
  data: RegisterAgentData;
  cardIndex: number;
}

const SwitchComponent: React.FC<Props> = ({ data, cardIndex }) => {
  const [selectedOption, setSelectedOption] = useState<string | undefined>(
    undefined,
  );

  const handleOptionChange = (optionId: string) => {
    setSelectedOption(optionId);
  };

  return (
    <div>
      {data.architecture.map((arch, idx) => (
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

export { SwitchComponent };
export type { RegisterAgentData };
