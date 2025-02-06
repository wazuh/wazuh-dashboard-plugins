import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiText,
  EuiPopover,
  EuiButtonEmpty,
  EuiLink,
  EuiSwitch,
} from '@elastic/eui';
import React, { Fragment, useEffect, useState } from 'react';
import { SERVER_ADDRESS_TEXTS } from '../../utils/register-agent-data';
import { EnhancedFieldConfiguration } from '../form/types';
import { InputForm } from '../form';
import { webDocumentationLink } from '../../services/web-documentation-link';
import { PLUGIN_VERSION_SHORT } from '../../../../../../common/constants';
import '../group-input/group-input.scss';
import { getWazuhCore } from '../../../../../plugin-services';

interface ServerAddressInputProps {
  formField: EnhancedFieldConfiguration;
}

const popoverServerAddress = (
  <span>
    Learn about{' '}
    <EuiLink
      href={webDocumentationLink(
        'user-manual/reference/ossec-conf/client.html#manager-address',
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
  const [rememberServerAddress, setRememberServerAddress] = useState(false);
  const [defaultServerAddress, setDefaultServerAddress] = useState(
    formField?.initialValue ? formField?.initialValue : '',
  );
  const appConfig = getWazuhCore().configuration.get(); // TODO: this should use a live state (that reacts to changes in the configuration)

  const handleToggleRememberAddress = async event => {
    setRememberServerAddress(event.target.checked);

    if (event.target.checked) {
      await saveServerAddress();
      setDefaultServerAddress(formField.value);
    }
  };

  const saveServerAddress = async () => {
    try {
      const res = await getWazuhCore().http.server.request(
        'PUT',
        '/utils/configuration',
        {
          'enrollment.dns': formField.value,
        },
      );
    } catch {
      // TODO: use error handler
      // ErrorHandler.handleError(error, {
      //   message: error.message,
      //   title: 'Error saving server address configuration',
      // });
      setRememberServerAddress(false);
    }
  };

  const rememberToggleIsDisabled = () => !formField.value || !!formField.error;

  const handleInputChange = value => {
    if (value === defaultServerAddress) {
      setRememberServerAddress(true);
    } else {
      setRememberServerAddress(false);
    }
  };

  useEffect(() => {
    handleInputChange(formField.value);
  }, [formField.value]);

  const { ServerButtonPermissions } = getWazuhCore().ui;

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
      <EuiFlexGroup wrap>
        <EuiFlexItem grow={true}>
          <InputForm
            {...formField}
            label={
              <>
                <EuiFlexGroup
                  alignItems='center'
                  direction='row'
                  responsive={false}
                  gutterSize='s'
                >
                  <EuiFlexItem grow={false}>
                    <span className='registerAgentLabels'>
                      Assign a server address
                    </span>
                  </EuiFlexItem>
                  <EuiFlexItem grow={false}>
                    <EuiPopover
                      button={
                        <EuiButtonEmpty
                          iconType='questionInCircle'
                          iconSide='left'
                          onClick={onButtonServerAddress}
                          style={{
                            flexDirection: 'row',
                            fontStyle: 'normal',
                            fontWeight: 700,
                          }}
                        ></EuiButtonEmpty>
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
        </EuiFlexItem>
      </EuiFlexGroup>
      {appConfig?.['configuration.ui_api_editable'] && (
        <EuiFlexGroup wrap>
          <EuiFlexItem grow={false}>
            <ServerButtonPermissions
              buttonType='switch'
              administrator
              disabled={rememberToggleIsDisabled()}
              label='Remember server address'
              checked={rememberServerAddress}
              onChange={e => handleToggleRememberAddress(e)}
            />
          </EuiFlexItem>
        </EuiFlexGroup>
      )}
    </Fragment>
  );
};

export default ServerAddressInput;
