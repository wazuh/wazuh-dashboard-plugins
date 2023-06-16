import React from 'react';
import {
  EuiCard,
  EuiFlexGroup,
  EuiFlexItem,
  EuiCallOut,
  EuiLink,
  EuiCheckbox,
} from '@elastic/eui';
import { REGISTER_AGENT_DATA_STEP_ONE } from '../../../utils/register-agent-data';
import { CheckboxGroupComponent } from '../../step-one/checkbox-group/checkbox-group';
import './os-card.scss';
import { webDocumentationLink } from '../../../../../../common/services/web_documentation';

interface Props {
  setStatusCheck: string;
}

export const OsCard = ({ onChange, value }: Props) => {
  return (
    <div data-testid='os-card'>
      <EuiFlexGroup gutterSize='l' wrap>
        {REGISTER_AGENT_DATA_STEP_ONE.map((data, index) => (
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
              className='card'
            >
              {data.hr && <hr className='hr' />}
              {/* <EuiSpacer size='s' /> */}

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
              href={webDocumentationLink(
                'installation-guide/wazuh-agent/index.html',
              )}
            >
              steps
            </EuiLink>
            .
          </span>
        }
      ></EuiCallOut>
    </div>
  );
};
