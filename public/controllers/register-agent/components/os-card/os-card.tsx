import React, { useState } from 'react';
import {
  EuiCard,
  EuiFlexGroup,
  EuiFlexItem,
  EuiIcon,
  EuiSpacer,
} from '@elastic/eui';
import { REGISTER_AGENT_DATA } from '../../utils/register-agent-data';
import { CheckboxGroupComponent } from '../checkbox-group/checkbox-group';
import './os-card.scss';

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
              // icon={<img src={data.icon} alt='Icon' />}
              title={
                <div className='cardTitle'>
                  <img className='cardIcon' src={data.icon} alt='Icon' />
                  <span className='cardText'>{data.title}</span>
                </div>
              }
              display='plain'
              hasBorder
              onClick={() => {}}
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
