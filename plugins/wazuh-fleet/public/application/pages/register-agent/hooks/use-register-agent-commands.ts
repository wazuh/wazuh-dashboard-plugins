import { useEffect, useState } from 'react';
import { CommandGenerator } from '../core/register-commands/command-generator/command-generator';
import {
  IOSDefinition,
  IOperationSystem,
  IOptionalParameters,
  TOptionalParams,
} from '../core/register-commands/types';
import { version } from '../../../../../package.json';

interface IUseRegisterCommandsProps<
  OS extends IOperationSystem,
  Params extends string,
> {
  osDefinitions: IOSDefinition<OS, Params>[];
  optionalParamsDefinitions: TOptionalParams<Params>;
}

interface IUseRegisterCommandsOutput<
  OS extends IOperationSystem,
  Params extends string,
> {
  selectOS: (params: OS) => void;
  setOptionalParams: (
    params: IOptionalParameters<Params>,
    selectedOS?: OS,
  ) => void;
  installCommand: string;
  startCommand: string;
  optionalParamsParsed: IOptionalParameters<Params> | object;
}

/**
 * Custom hook that generates install and start commands based on the selected OS and optional parameters.
 *
 * @template T - The type of the selected OS.
 * @param {IUseRegisterCommandsProps} props - The properties to configure the command generator.
 * @returns {IUseRegisterCommandsOutput<OS,Params>} - An object containing the generated commands and methods to update the selected OS and optional parameters.
 */
export function useRegisterAgentCommands<
  OS extends IOperationSystem,
  Params extends string,
>(
  props: IUseRegisterCommandsProps<OS, Params>,
): IUseRegisterCommandsOutput<OS, Params> {
  const { osDefinitions, optionalParamsDefinitions } = props;
  // command generator settings
  const wazuhVersion = version;
  const osCommands: IOSDefinition<OS, Params>[] =
    osDefinitions as IOSDefinition<OS, Params>[];
  const optionalParams: TOptionalParams<Params> =
    optionalParamsDefinitions as TOptionalParams<Params>;
  const commandGenerator = new CommandGenerator(
    osCommands,
    optionalParams,
    wazuhVersion,
  );
  const [osSelected, setOsSelected] = useState<OS | null>(null);
  const [optionalParamsValues, setOptionalParamsValues] = useState<
    IOptionalParameters<Params> | object
  >({});
  const [optionalParamsParsed, setOptionalParamsParsed] = useState<
    IOptionalParameters<Params> | object
  >({});
  const [installCommand, setInstallCommand] = useState('');
  const [startCommand, setStartCommand] = useState('');

  /**
   * Generates the install and start commands based on the selected OS and optional parameters.
   * If no OS is selected, the method returns early without generating any commands.
   * The generated commands are then set as state variables for later use.
   */
  const generateCommands = () => {
    if (!osSelected) {
      return;
    }

    if (osSelected) {
      commandGenerator.selectOS(osSelected);
    }

    if (optionalParamsValues) {
      commandGenerator.addOptionalParams(
        optionalParamsValues as IOptionalParameters<Params>,
        osSelected,
      );
    }

    const installCommand = commandGenerator.getInstallCommand();
    const startCommand = commandGenerator.getStartCommand();

    setInstallCommand(installCommand);
    setStartCommand(startCommand);
  };

  useEffect(() => {
    generateCommands();
  }, [osSelected, optionalParamsValues]);

  /**
   * Sets the selected OS for the command generator and updates the state variables accordingly.
   *
   * @param {T} params - The selected OS to be set.
   * @returns {void}
   */
  const selectOS = (params: OS) => {
    commandGenerator.selectOS(params);
    setOsSelected(params);
  };

  /**
   * Sets the optional parameters for the command generator and updates the state variables accordingly.
   *
   * @param {IOptionalParameters} params - The optional parameters to be set.
   * @returns {void}
   */
  const setOptionalParams = (
    params: IOptionalParameters<Params>,
    selectedOS?: OS,
  ): void => {
    commandGenerator.addOptionalParams(params, selectedOS);
    setOptionalParamsValues(params);
    setOptionalParamsParsed(commandGenerator.getOptionalParamsCommands());
  };

  return {
    selectOS,
    setOptionalParams,
    installCommand,
    startCommand,
    optionalParamsParsed,
  };
}
