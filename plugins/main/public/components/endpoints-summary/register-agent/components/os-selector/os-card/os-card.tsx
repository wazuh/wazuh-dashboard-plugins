import React from 'react';
import {
  EuiCard,
  EuiFlexGroup,
  EuiFlexItem,
  EuiLink,
  EuiCheckbox,
  EuiText,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { FormattedMessage } from '@osd/i18n/react';
import { OPERATING_SYSTEMS_OPTIONS } from '../../../utils/register-agent-data';
import { CheckboxGroupComponent } from '../checkbox-group/checkbox-group';
import './os-card.scss';
import { webDocumentationLink } from '../../../../../../../common/services/web_documentation';

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
                  <img
                    className='cardIcon'
                    src={data.icon}
                    alt={i18n.translate(
                      'wazuh.endpointsSummary.osCard.iconAlt',
                      { defaultMessage: 'Icon' },
                    )}
                  />
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
      <EuiText size='s' color='subdued' className='cardsNote'>
        <p>
          <FormattedMessage
            id='wazuh.endpointsSummary.osCard.supportedSystems'
            defaultMessage='For the operating system versions each package supports, see {supportedSystemsLink}.'
            values={{
              supportedSystemsLink: (
                <EuiLink
                  target='_blank'
                  external
                  href={webDocumentationLink(
                    'user-manual/agent/agent-enrollment/requirements.html#supported-operating-systems',
                  )}
                  rel='noopener noreferrer'
                >
                  {i18n.translate(
                    'wazuh.endpointsSummary.osCard.supportedSystemsLink',
                    { defaultMessage: 'Supported operating systems' },
                  )}
                </EuiLink>
              ),
            }}
          />
        </p>
      </EuiText>
    </div>
  );
};
