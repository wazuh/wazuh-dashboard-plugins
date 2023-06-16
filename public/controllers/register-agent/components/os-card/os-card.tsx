import React, { useState } from 'react';
import {
  EuiCard,
  EuiFlexGroup,
  EuiFlexItem,
  EuiIcon,
  EuiSpacer,
  EuiCheckbox,
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
    <div data-testid='os-card'>
      <EuiFlexGroup gutterSize='l' wrap>
        {REGISTER_AGENT_DATA.map((data, index) => (
          <EuiFlexItem key={index}>
            <EuiCard
              title={
                <div data-testid='card-title' className='cardTitle'>
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
                component={EuiCheckbox}
                data={data.architecture}
                cardIndex={index}
                selectedOption={selectedOption}
                onOptionChange={handleOptionChange}
                data-testid={`checkbox-group-${index}`}
              />
            </EuiCard>
          </EuiFlexItem>
        ))}
      </EuiFlexGroup>
    </div>
  );
};
