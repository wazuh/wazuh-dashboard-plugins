import { TPluginSettingWithKey } from '../../../../common/constants';

export interface IInputFormType {
  field: TPluginSettingWithKey;
  value: any;
  onChange: (event: any) => void;
  isInvalid?: boolean;
  options: any;
  setInputRef: (reference: any) => void;
}

export interface IInputForm {
  field: TPluginSettingWithKey;
  initialValue: any;
  onChange: (event: any) => void;
  label?: string;
  preInput?: (options: { value: any; error: string | null }) => JSX.Element;
  postInput?: (options: { value: any; error: string | null }) => JSX.Element;
}

/// use form hook types

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
  transformChangedOutputValue?: (value: any) => any;
}

export interface DefaultFieldConfiguration extends FieldConfiguration {
  type: SettingTypes;
}

export type CustomSettingType = 'custom';
interface CustomFieldConfiguration extends FieldConfiguration {
  type: CustomSettingType;
  component: (props: any) => JSX.Element;
}

export interface FormConfiguration {
  [key: string]: DefaultFieldConfiguration | CustomFieldConfiguration;
}

interface EnhancedField {
  currentValue: any;
  initialValue: any;
  value: any;
  changed: boolean;
  error: string;
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

export interface EnhancedFields {
  [key: string]: EnhancedDefaultField | EnhancedCustomField;
}

export interface UseFormReturn {
  fields: EnhancedFields;
  changed: { [key: string]: any };
  errors: { [key: string]: string };
  undoChanges: () => void;
  doChanges: () => void;
}
