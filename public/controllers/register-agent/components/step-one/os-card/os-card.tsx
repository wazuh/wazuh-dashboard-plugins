import React from 'react';
import {
  EuiCard,
  EuiFlexGroup,
  EuiFlexItem,
  EuiCallOut,
  EuiLink,
} from '@elastic/eui';
import { REGISTER_AGENT_DATA_STEP_ONE } from '../../../utils/register-agent-data';
import { CheckboxGroupComponent } from '../checkbox-group/checkbox-group';
import './os-card.scss';
import { webDocumentationLink } from '../../../../../../common/services/web_documentation';

interface Props {
  setStatusCheck: string;
}

export const OsCard = ({ onChange, value }: Props) => {
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
                selectedOption={value}
                onOptionChange={onChange}
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
