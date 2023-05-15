import { TPluginSettingWithKey } from '../../../../common/constants';

export type IInputTypes = 'text' | 'number' | 'switch' | 'editor' | 'filepicker';
export type IInputTypesCustom = 'custom';

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

interface IFormField {
  initialValue: any;
  validate?: (value: any) => string | undefined;
}
interface IFormFieldDefault extends IFormField {
  type: IInputTypes;
  initialValue: any;
}

interface IFormFieldCustom extends IFormField {
  type: IInputTypesCustom;
  component: (props: IInputForm) => JSX.Element;
}

export interface IFormFields {
  [key: string]: IFormFieldCustom | IFormFieldDefault;
}
