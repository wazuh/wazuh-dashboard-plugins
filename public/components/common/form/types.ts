import { TPluginSettingWithKey } from "../../../../common/constants";

export interface IInputFormType {
	field: TPluginSettingWithKey
	value: any
	onChange: (event: any) => void
	isInvalid?: boolean
	options: any
	setInputRef: (reference: any) => void
};

export interface IInputForm {
	field: TPluginSettingWithKey
	initialValue: any
	onChange: (event: any) => void
	label?: string
	preInput?: ((options: {value: any, error: string | null}) => JSX.Element)
	postInput?: ((options: {value: any, error: string | null}) => JSX.Element)
};
