import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiText,
  EuiPopover,
  EuiButtonEmpty,
  EuiLink,
} from '@elastic/eui';
import React, { Fragment, useState } from 'react';
import { SERVER_ADDRESS_TEXTS } from '../../utils/register-agent-data';
import { EnhancedFieldConfiguration } from '../../../../components/common/form/types';
import { InputForm } from '../../../../components/common/form';
import { webDocumentationLink } from '../../../../../common/services/web_documentation';
import { PLUGIN_VERSION_SHORT } from '../../../../../common/constants';

interface ServerAddressInputProps {
  formField: EnhancedFieldConfiguration;
}

const popoverServerAddress = (
  <span>
    Learn about{' '}
    <EuiLink
      href={webDocumentationLink(
        'user-manual/reference/ossec-conf/client.html#groups',
        PLUGIN_VERSION_SHORT,
      )}
      target='_blank'
      rel='noopener noreferrer'
    >
      Server address.
    </EuiLink>
  </span>
);

const ServerAddressInput = (props: ServerAddressInputProps) => {
  const { formField } = props;
  const [isPopoverServerAddress, setIsPopoverServerAddress] = useState(false);
  const onButtonServerAddress = () =>
    setIsPopoverServerAddress(
      isPopoverServerAddress => !isPopoverServerAddress,
    );
  const closeServerAddress = () => setIsPopoverServerAddress(false);

  return (
    <Fragment>
      <EuiFlexGroup gutterSize='s' wrap>
        {SERVER_ADDRESS_TEXTS.map((data, index) => (
          <EuiFlexItem key={index}>
            <EuiText className='stepSubtitleServerAddress'>
              {data.subtitle}
            </EuiText>
          </EuiFlexItem>
        ))}
      </EuiFlexGroup>
      <InputForm
        {...formField}
        label={
          <>
            <EuiFlexGroup>
              <EuiFlexItem grow={false}>
                <EuiPopover
                  button={
                    <EuiButtonEmpty
                      iconType='questionInCircle'
                      iconSide='right'
                      onClick={onButtonServerAddress}
                      style={{
                        flexDirection: 'row',
                        fontStyle: 'normal',
                        fontWeight: 700,
                        fontSize: '12px',
                        lineHeight: '20px',
                      }}
                    >
                      Assign a server address
                    </EuiButtonEmpty>
                  }
                  isOpen={isPopoverServerAddress}
                  closePopover={closeServerAddress}
                  anchorPosition='rightCenter'
                >
                  {popoverServerAddress}
                </EuiPopover>
              </EuiFlexItem>
            </EuiFlexGroup>
          </>
        }
        fullWidth={false}
        placeholder='Server address'
      />
    </Fragment>
  );
};

export default ServerAddressInput;
