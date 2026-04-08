import React from 'react';
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiCodeBlock,
  EuiText,
  EuiCode,
  EuiCallOut,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { withErrorBoundary } from '../../common/hocs';
import { getWazuhCorePlugin } from '../../../kibana-services';

export const AddApi = withErrorBoundary(() => {
  const data = React.useMemo(() => {
    const settings = Object.entries(
      getWazuhCorePlugin().configuration._settings.get('hosts').options.arrayOf,
    ).map(([key, { description }]) => [
      key,
      description.charAt(0).toLowerCase() + description.slice(1), // lower case the first letter
    ]);

    return {
      settings,
      example: `hosts:
    - <id>:
     ${settings
       .filter(([key]) => key !== 'id')
       .map(([key]) => `${key}: <${key}>`)
       .join('\n     ')}`,
    };
  }, []);

  return (
    <>
      <EuiFlexGroup>
        <EuiFlexItem>
          <EuiText>
            {i18n.translate('wazuh.settings.api.modifyFileInstruction', {
              defaultMessage: 'Modify {configFile} to set the connection information.',
              values: { configFile: getWazuhCorePlugin().configuration.store.file },
            })}
          </EuiText>
        </EuiFlexItem>
      </EuiFlexGroup>
      <EuiFlexGroup>
        <EuiFlexItem>
          <EuiCodeBlock language='yaml'>{data.example}</EuiCodeBlock>
        </EuiFlexItem>
      </EuiFlexGroup>
      <EuiFlexGroup>
        <EuiFlexItem>
          <EuiText>
            {i18n.translate('wazuh.settings.api.whereLabel', {
              defaultMessage: 'Where:',
            })}
          </EuiText>
        </EuiFlexItem>
      </EuiFlexGroup>
      <EuiFlexGroup>
        <EuiFlexItem>
          <ul style={{ paddingLeft: '4px' }}>
            {data.settings.map(([key, description]) => (
              <li key={`add-api-connection-field-${key}`}>
                - <EuiCode>{`<${key}>`}</EuiCode>: {description}
              </li>
            ))}
          </ul>
        </EuiFlexItem>
      </EuiFlexGroup>
      <EuiFlexGroup>
        <EuiFlexItem>
          <EuiCallOut 
            title={i18n.translate('wazuh.settings.api.warningTitle', {
              defaultMessage: 'Warning',
            })} 
            color='warning' 
            iconType='alert'
          >
            <p>
              {i18n.translate('wazuh.settings.api.warningMessage', {
                defaultMessage: 'The changes of the API connections in the configuration file could need some time to take effect due to the cache of configuration.',
              })}
            </p>
          </EuiCallOut>
        </EuiFlexItem>
      </EuiFlexGroup>
    </>
  );
});
