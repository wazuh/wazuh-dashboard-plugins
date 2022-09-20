import React from 'react';
import { render } from '@testing-library/react';
import { InputForm } from './index';

describe('[component] InputForm', () => {
		it.each`
			inputType | value | options | rest
			${'editor'} | ${'{}'} | ${{editor: {language: 'json'}}} | ${{}}
			${'number'} | ${4} | ${undefined} | ${{}}
			${'select'} | ${'value1'} | ${{select: {choices: [{label: 'Label1', value: 'value1'}, {label: 'Label2', value: 'value2'}]}}} | ${{}}
			${'switch'} | ${true} | ${{switch: {values: {enabled: {label: 'Enabled', value: true}, disabled: {label: 'Disabled', value: false}}}}} | ${{}}
			${'text'} | ${'test'} | ${undefined} | ${{isInvalid: false}}
		`('Renders correctly to match the snapshot: Input: $inputType', ({ inputType, value, options }) => {
			const wrapper = render(
				<InputForm
					type={inputType}
					value={value}
					onChange={() => {}}
					options={options}
				/>
			);
			expect(wrapper.container).toMatchSnapshot();
		});
});

