import React, { Component, Fragment, useState } from 'react';
import { version } from '../../../../../package.json';
import { WazuhConfig } from '../../../../react-services/wazuh-config';
import {
  EuiSteps,
  EuiTabbedContent,
  EuiFlexGroup,
  EuiFlexItem,
  EuiPanel,
  EuiComboBox,
  EuiFieldText,
  EuiText,
  EuiCodeBlock,
  EuiTitle,
  EuiButtonEmpty,
  EuiCopy,
  EuiPage,
  EuiPageBody,
  EuiCallOut,
  EuiSpacer,
  EuiProgress,
  EuiIcon,
  EuiSwitch,
  EuiLink,
  EuiFormRow,
  EuiForm,
} from '@elastic/eui';
import { WzRequest } from '../../../../react-services/wz-request';
import { withErrorBoundary } from '../../../../components/common/hocs';
import { UI_LOGGER_LEVELS } from '../../../../../common/constants';
import { UI_ERROR_SEVERITIES } from '../../../../react-services/error-orchestrator/types';
import { getErrorOrchestrator } from '../../../../react-services/common-services';
import { webDocumentationLink } from '../../../../../common/services/web_documentation';
import WzManagerAddressInput from '../../../agent/register-agent/steps/wz-manager-address';
import { getMasterRemoteConfiguration } from '../../../agent/components/register-agent-service';

const Stepi = ({ getWazuhVersion, hasAgents, addNewAgent, reload }) => {
  const wazuhConfig = new WazuhConfig();
  const configuration = wazuhConfig.getConfig();
  const addToVersion = '-1';

  const [status, setStatus] = useState('incomplete');
  const [selectedOS, setSelectedOS] = useState('');
  const [selectedSYS, setSelectedSYS] = useState('');
  const [neededSYS, setNeededSYS] = useState(false);
  const [selectedArchitecture, setselectedArchitecture] = useState('');
  const [selectedVersion, setselectedVersion] = useState('');
  const [version, setVersion] = useState('');
  const [wazuhVersion, setWazuhVersion] = useState('');
  const [serverAddress, setServerAddress] = useState('');
  const [agentName, setAgentName] = useState('');
  const [agentNameError, setAgentNameError] = useState(false);
  const [badCharacters, setBadCharacters] = useState([]);
  const [wazuhPassword, setWazuhPassword] = useState('');
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState([]);
  const [defaultServerAddress, setDefaultServerAddress] = useState('');
  const [udpProtocol, setUdpProtocol] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showProtocol, setShowProtocol] = useState(true);
  const [connectionSecure, setConnectionSecure] = useState(true);
  const [isAccordionOpen, setIsAccordionOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const wazuhVersion = await getWazuhVersion();
        let wazuhPassword = '';
        let hidePasswordInput = false;
        getEnrollDNSConfig();
        await getRemoteConfig();
        let authInfo = await getAuthInfo();
        const needsPassword = (authInfo.auth || {}).use_password === 'yes';
        if (needsPassword) {
          wazuhPassword =
            configuration['enrollment.password'] ||
            authInfo['authd.pass'] ||
            '';
          if (wazuhPassword) {
            hidePasswordInput = true;
          }
        }
        setWazuhVersion(wazuhVersion);
        setWazuhPassword(wazuhPassword);
        setHidePasswordInput(hidePasswordInput);
      } catch (error) {
        console.error('Error fetching Wazuh version', error);
      }
    };

    fetchData();
  }, [getWazuhVersion, configuration]);

  const steps = [
    {
      title: 'Seleccione el tipo de agente',
      children: (
        <EuiFlexGroup gutterSize='l'>
          <EuiFlexItem>
            <EuiComboBox
              options={getOSOptions()}
              selectedOptions={selectedOS ? [{ label: selectedOS }] : []}
              onChange={selectedOptions =>
                setSelectedOS(selectedOptions[0]?.label)
              }
              singleSelection={{ asPlainText: true }}
            />
          </EuiFlexItem>
          <EuiFlexItem>
            <EuiComboBox
              options={getSYSOptions()}
              selectedOptions={selectedSYS ? [{ label: selectedSYS }] : []}
              onChange={selectedOptions =>
                setSelectedSYS(selectedOptions[0]?.label)
              }
              singleSelection={{ asPlainText: true }}
            />
          </EuiFlexItem>
        </EuiFlexGroup>
      ),
    },
    {
      title: 'Seleccione la versión del agente',
      children: (
        <EuiComboBox
          options={getAgentVersionOptions()}
          selectedOptions={selectedVersion ? [{ label: selectedVersion }] : []}
          onChange={selectedOptions =>
            setselectedVersion(selectedOptions[0]?.label)
          }
          singleSelection={{ asPlainText: true }}
        />
      ),
    },
    {
      title: 'Complete los detalles del agente',
      children: (
        <EuiForm component='form' onSubmit={submitForm}>
          <EuiFormRow
            label='Dirección del servidor'
            helpText={
              <>
                Dirección IP o FQDN del servidor Wazuh al que el agente se
                conectará.{' '}
                <EuiLink href={webDocumentationLink} target='_blank'>
                  Más información.
                </EuiLink>
              </>
            }
          >
            <WzManagerAddressInput
              required
              value={serverAddress}
              onChange={e => setServerAddress(e.target.value)}
            />
          </EuiFormRow>
          <EuiFormRow
            label='Nombre del agente'
            helpText='Nombre descriptivo para el agente'
            isInvalid={agentNameError}
            error={agentNameError && 'Este nombre de agente ya existe'}
          >
            <EuiFieldText
              required
              value={agentName}
              onChange={e => setAgentName(e.target.value)}
              isInvalid={agentNameError}
            />
          </EuiFormRow>
          <EuiFormRow
            label='Contraseña'
            helpText={
              <>
                Contraseña para autenticarse con el servidor Wazuh.{' '}
                <EuiLink href={webDocumentationLink} target='_blank'>
                  Más información.
                </EuiLink>
              </>
            }
          >
            <EuiFieldText
              required
              type={showPassword ? 'text' : 'password'}
              value={wazuhPassword}
              onChange={e => setWazuhPassword(e.target.value)}
              append={
                <EuiButtonEmpty
                  size='s'
                  iconType={showPassword ? 'eyeClosed' : 'eye'}
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={
                    showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'
                  }
                />
              }
            />
          </EuiFormRow>
          <EuiFormRow label='Grupos'>
            <EuiComboBox
              placeholder='Seleccione los grupos'
              options={getGroupOptions()}
              selectedOptions={selectedGroup}
              onChange={selectedOptions => setSelectedGroup(selectedOptions)}
              isClearable={true}
              isInvalid={selectedGroup.length === 0}
            />
          </EuiFormRow>
          <EuiFormRow label='Protocolo de conexión'>
            <EuiSwitch
              label='UDP'
              checked={udpProtocol}
              onChange={() => setUdpProtocol(!udpProtocol)}
            />
          </EuiFormRow>
          <EuiFormRow label='Conexión segura'>
            <EuiSwitch
              label='SSL/TLS'
              checked={connectionSecure}
              onChange={() => setConnectionSecure(!connectionSecure)}
            />
          </EuiFormRow>
          <EuiSpacer size='m' />
          <EuiButton
            type='submit'
            fill
            isDisabled={status === 'complete'}
            isLoading={status === 'loading'}
          >
            Registrar agente
          </EuiButton>
        </EuiForm>
      ),
    },
    {
      title: 'Resultado',
      children: (
        <EuiFlexGroup direction='column' gutterSize='l'>
          <EuiFlexItem>
            {status === 'success' && (
              <EuiCallOut
                title='¡Agente registrado exitosamente!'
                color='success'
                iconType='check'
              >
                <p>
                  El agente ha sido registrado exitosamente en el servidor
                  Wazuh.
                </p>
              </EuiCallOut>
            )}
            {status === 'error' && (
              <EuiCallOut
                title='Error al registrar el agente'
                color='danger'
                iconType='alert'
              >
                <p>
                  Ocurrió un error al registrar el agente. Por favor, revisa los
                  detalles y vuelve a intentarlo.
                </p>
              </EuiCallOut>
            )}
          </EuiFlexItem>
          <EuiFlexItem>
            {status === 'success' && (
              <EuiPanel paddingSize='l'>
                <EuiTitle>
                  <h2>Código de registro</h2>
                </EuiTitle>
                <EuiSpacer size='m' />
                <EuiCodeBlock
                  language='bash'
                  fontSize='m'
                  paddingSize='s'
                  isCopyable
                >
                  {getCodeBlock()}
                </EuiCodeBlock>
                <EuiSpacer size='m' />
                <EuiCopy textToCopy={getCodeBlock()} anchorClassName='copy'>
                  {copy => (
                    <EuiButtonEmpty
                      size='s'
                      onClick={copy}
                      aria-label='Copiar código de registro'
                    >
                      Copiar código de registro
                    </EuiButtonEmpty>
                  )}
                </EuiCopy>
              </EuiPanel>
            )}
          </EuiFlexItem>
        </EuiFlexGroup>
      ),
    },
  ];

  const getOSOptions = () => {
    // Retorna las opciones disponibles para el sistema operativo
    // Puedes personalizarlo según tus necesidades
    return [{ label: 'Linux' }, { label: 'Windows' }, { label: 'Mac' }];
  };

  const getSYSOptions = () => {
    // Retorna las opciones disponibles para el sistema
    // Puedes personalizarlo según tus necesidades
    if (selectedOS === 'Linux') {
      return [{ label: 'Debian' }, { label: 'Red Hat' }, { label: 'Ubuntu' }];
    } else if (selectedOS === 'Windows') {
      return [{ label: 'Windows Server' }, { label: 'Windows Desktop' }];
    } else if (selectedOS === 'Mac') {
      return [{ label: 'macOS' }];
    } else {
      return [];
    }
  };

  const getAgentVersionOptions = () => {
    // Retorna las opciones disponibles para la versión del agente
    // Puedes personalizarlo según tus necesidades
    return [{ label: '3.14.0' }, { label: '3.13.0' }, { label: '3.12.0' }];
  };

  const getGroupOptions = () => {
    // Retorna las opciones disponibles para los grupos
    // Puedes personalizarlo según tus necesidades
    return [{ label: 'Group 1' }, { label: 'Group 2' }, { label: 'Group 3' }];
  };

  const submitForm = async () => {
    if (!agentName || !serverAddress || selectedGroup.length === 0) {
      return;
    }

    setStatus('loading');
    setAgentNameError(false);

    try {
      // Aquí puedes realizar la lógica de registro del agente
      // Utiliza las variables de estado para obtener los valores seleccionados

      // Simulación de llamada a la API para agregar un nuevo agente
      await addNewAgent({
        name: agentName,
        server: serverAddress,
        groups: selectedGroup.map(group => group.label),
      });

      setStatus('success');
    } catch (error) {
      console.error('Error al registrar el agente', error);

      // Si el nombre del agente ya existe, muestra un error
      if (error.message === 'Agent name already exists') {
        setAgentNameError(true);
      }

      setStatus('error');
    }
  };

  const getCodeBlock = () => {
    // Retorna el código de registro del agente
    // Puedes personalizarlo según tus necesidades
    return `curl -u ${agentName}:${wazuhPassword} -H "Content-Type: application/json" -XPOST "${serverAddress}/agents" -d '{
  "name": "${agentName}",
  "status": "Active",
  "groups": ["${selectedGroup.map(group => group.label).join('", "')}"]
}'`;
  };

  return (
    <EuiPage>
      <EuiPageBody>
        <EuiProgress size='xs' color='accent' position='fixed' />
        <EuiSteps steps={steps} />
      </EuiPageBody>
    </EuiPage>
  );
};

export default withErrorBoundary(Stepi);
