import { UseFormReturn } from '../components/form/types';
import {
  TOperatingSystem,
  TOptionalParameters,
} from '../core/config/os-commands-definitions';
import { EnrollAgentData } from '../interfaces/types';

export interface ServerAddressOptions {
  label: string;
  value: string;
  nodetype: string;
}

interface NodeItem {
  name: string;
  ip: string;
  type: string;
}

interface NodeResponse {
  data: {
    data: {
      affected_items: NodeItem[];
    };
  };
}

/**
 * Parse the nodes list from the API response to a format that can be used by the EuiComboBox
 * @param nodes
 */
export const parseNodesInOptions = (
  nodes: NodeResponse,
): ServerAddressOptions[] =>
  nodes.data.data.affected_items.map((item: NodeItem) => ({
    label: item.name,
    value: item.ip,
    nodetype: item.type,
  }));

export const getEnrollAgentFormValues = (form: UseFormReturn) =>
  // return the values form the formFields and the value property
  Object.keys(form.fields).map(key => ({
    name: key,
    value: form.fields[key].value,
  }));

export interface IParseEnrollFormValues {
  operatingSystem: {
    name: TOperatingSystem['name'] | '';
    architecture: TOperatingSystem['architecture'] | '';
  };
  // optionalParams is an object that their key is defined in TOptionalParameters and value must be string
  optionalParams: Record<TOptionalParameters, any>;
}

export const parseEnrollAgentFormValues = (
  formValues: { name: keyof UseFormReturn['fields']; value: any }[],
  OSOptionsDefined: EnrollAgentData[],
  initialValues?: IParseEnrollFormValues,
) => {
  // return the values form the formFields and the value property
  const parsedForm =
    initialValues ||
    ({
      operatingSystem: {
        architecture: '',
        name: '',
      },
      optionalParams: {},
    } as IParseEnrollFormValues);

  for (const field of formValues) {
    if (field.name === 'operatingSystemSelection') {
      // search the architecture defined in architecture array and get the os name defined in title array in the same index
      const operatingSystem = OSOptionsDefined.find(os =>
        os.architecture.includes(field.value),
      );

      if (operatingSystem) {
        parsedForm.operatingSystem = {
          name: operatingSystem.title,
          architecture: field.value,
        };
      }
    } else {
      parsedForm.optionalParams[field.name as any] = field.value;
    }
  }

  return parsedForm;
};
