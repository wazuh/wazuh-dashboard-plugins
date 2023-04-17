import React from 'react';
import { EuiFieldText } from '@elastic/eui';
import { IInputFormType } from "./types";

export const InputFormText = ({ value, isInvalid, onChange }: IInputFormType) => {
	return (
		<EuiFieldText
			fullWidth
			value={value}
			isInvalid={isInvalid}
			onChange={onChange}
		/>
	);
};
