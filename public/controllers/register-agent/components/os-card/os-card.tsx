import React, { useState } from 'react';
import { EuiCard, EuiFlexGroup, EuiFlexItem } from '@elastic/eui';
import { REGISTER_AGENT_DATA_STEP_ONE } from '../../utils/register-agent-data';
import { CheckboxGroupComponent } from '../checkbox-group/checkbox-group';
import './os-card.scss';

export const OsCard = ({ setStatusCheck }) => {
  const [selectedOption, setSelectedOption] = useState<string | undefined>(
    undefined,
  );

  const handleOptionChange = (optionId: string) => {
    setSelectedOption(optionId);
    setStatusCheck('complete');
  };

  const isFirstCard = (index: number) => index === 0;
  const isLastCard = (index: number) =>
    index === REGISTER_AGENT_DATA_STEP_ONE.length - 1;

  return (
    <div>
      <EuiFlexGroup gutterSize='l' wrap>
        {REGISTER_AGENT_DATA_STEP_ONE.map((data, index) => (
          <EuiFlexItem key={index}>
            <EuiCard
              title={
                <div className='cardTitle'>
                  <img className='cardIcon' src={data.icon} alt='Icon' />
                  <span className='cardText'>{data.title}</span>
                </div>
              }
              display='plain'
              hasBorder
              onClick={() => {}}
              className='card'
            >
              {data.hr && <hr className='hr' />}
              {/* <EuiSpacer size='s' /> */}

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
