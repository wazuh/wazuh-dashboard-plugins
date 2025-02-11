import { TPluginSettingWithKey } from '../../../../../wazuh-core/common/constants';

export interface IInputFormType {
  field: TPluginSettingWithKey;
  value: any;
  onChange: (event: any) => void;
  isInvalid?: boolean;
  options: any;
  setInputRef: (reference: any) => void;
  placeholder: string;
  dataTestSubj: string;
}

export interface IInputForm {
  field: TPluginSettingWithKey;
  initialValue: any;
  onChange: (event: any) => void;
  label?: string;
  preInput?: (options: { value: any; error: string | null }) => JSX.Element;
  postInput?: (options: { value: any; error: string | null }) => JSX.Element;
}

// / use form hook types

export type SettingTypes =
  | 'text'
  | 'textarea'
  | 'number'
  | 'select'
  | 'switch'
  | 'editor'
  | 'filepicker';

interface FieldConfiguration {
  initialValue: any;
  validate?: (value: any) => string | undefined;
  transformChangedInputValue?: (value: any) => any;
}

export interface DefaultFieldConfiguration extends FieldConfiguration {
  type: SettingTypes;
}

export type CustomSettingType = 'custom';
interface CustomFieldConfiguration extends FieldConfiguration {
  type: CustomSettingType;
  component: (props: any) => JSX.Element;
}

interface ArrayOfFieldConfiguration extends FieldConfiguration {
  type: 'arrayOf';
  fields: Record<string, any>;
}

export type FormConfiguration = Record<
  string,
  | DefaultFieldConfiguration
  | CustomFieldConfiguration
  | ArrayOfFieldConfiguration
>;

interface EnhancedField {
  currentValue: any;
  initialValue: any;
  value: any;
  changed: boolean;
  error: string | null | undefined;
  setInputRef: (reference: any) => void;
  inputRef: any;
  onChange: (event: any) => void;
}

interface EnhancedDefaultField extends EnhancedField {
  type: SettingTypes;
}

interface EnhancedCustomField extends EnhancedField {
  type: CustomSettingType;
  component: (props: any) => JSX.Element;
}

export type EnhancedFieldConfiguration =
  | EnhancedDefaultField
  | EnhancedCustomField;
export type EnhancedFields = Record<string, EnhancedFieldConfiguration>;

export interface UseFormReturn {
  fields: EnhancedFields;
  changed: Record<string, any>;
  errors: Record<string, string>;
  undoChanges: () => void;
  doChanges: () => void;
  forEach: (
    value: any,
    key: string,
    form: {
      formDefinition: any;
      formState: any;
      pathFieldFormDefinition: string[];
      pathFormState: string[];
      fieldDefinition: FormConfiguration;
    },
  ) => Record<string, any>;
}
