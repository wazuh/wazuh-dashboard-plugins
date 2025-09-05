import React from 'react';
import {
  EuiCard,
  EuiFlexGroup,
  EuiFlexItem,
  EuiCallOut,
  EuiLink,
  EuiCheckbox,
} from '@elastic/eui';
import { OPERATING_SYSTEMS_OPTIONS } from '../../../utils/register-agent-data';
import { CheckboxGroupComponent } from '../checkbox-group/checkbox-group';
import './os-card.scss';
import { DOC_LINKS } from '../../../../../../../common/doc-links';

interface Props {
  setStatusCheck: string;
  onChange: React.ChangeEventHandler<HTMLInputElement>;
  value: any;
}

export const OsCard = ({ onChange, value }: Props) => {
  return (
    <div data-testid='os-card'>
      <EuiFlexGroup gutterSize='l' wrap>
        {OPERATING_SYSTEMS_OPTIONS.map((data, index) => (
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
              className='card'
            >
              {data.hr && <hr className='hr' />}
              <CheckboxGroupComponent
                component={EuiCheckbox}
                data={data.architecture}
                cardIndex={index}
                selectedOption={value}
                onOptionChange={onChange}
                data-testid={`checkbox-group-${index}`}
              />
            </EuiCard>
          </EuiFlexItem>
        ))}
      </EuiFlexGroup>
      <EuiCallOut
        color='primary'
        className='cardsCallOut'
        iconType='iInCircle'
        title={
          <span>
            For additional systems and architectures, please check our{' '}
            <EuiLink
              target='_blank'
              href={DOC_LINKS.INSTALLATION_GUIDE.WAZUH_AGENT.INDEX}
              rel='noopener noreferrer'
            >
              documentation
            </EuiLink>
            .
          </span>
        }
      ></EuiCallOut>
    </div>
  );
};
