
import React from 'react'
import { EuiText } from '@elastic/eui';

interface IRuleText {
  rulesText: string
}

export const RuleText: React.FunctionComponent<IRuleText> = ({ rulesText }) => {
  const splitRulesText = rulesText.split(' -> ');
  return (
    <EuiText>
      <ul>
        {splitRulesText.map(text => <li>{text}</li>)}
      </ul>
    </EuiText>
  )
}
