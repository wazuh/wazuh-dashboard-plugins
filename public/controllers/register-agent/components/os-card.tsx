//
import React, { useState } from 'react';
import {
  EuiCard,
  EuiFlexGroup,
  EuiFlexItem,
  EuiIcon,
  EuiSpacer,
} from '@elastic/eui';
import { REGISTER_AGENT_DATA } from '../utils/register-agent-data';
import { CheckboxGroupComponent } from './checkbox-group';

export const OsCard = () => {
  const [selectedOption, setSelectedOption] = useState<string | undefined>(
    undefined,
  );

  const handleOptionChange = (optionId: string) => {
    setSelectedOption(optionId);
  };

  return (
    <div>
      <EuiSpacer size='s' />
      <EuiFlexGroup gutterSize='l' wrap>
        {REGISTER_AGENT_DATA.map((data, index) => (
          <EuiFlexItem key={index}>
            <EuiCard
              icon={<EuiIcon size='xl' type='logoLogging' />}
              title='Bordered'
              display='plain'
              hasBorder
              description='This one has a plain background color and border.'
              onClick={() => {}}
            >
              <CheckboxGroupComponent
                data={data.architecture}
                cardIndex={index}
                selectedOption={selectedOption}
                onOptionChange={handleOptionChange}
              />
            </EuiCard>
          </EuiFlexItem>
        ))}
      </EuiFlexGroup>
    </div>
  );
};
