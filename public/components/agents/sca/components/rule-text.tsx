
import React from 'react'
import { EuiText } from '@elastic/eui';

interface RuleTextProps {
  rules: {type: string, rule: string}[]
}

export const RuleText: React.FunctionComponent<RuleTextProps> = ({ rules }) => {
  return (
    <EuiText size="s">
      <ul>
        {rules.map((rule, idx) => <li key={`check-rule-${idx}`}>{rule.rule}</li>)}
      </ul>
    </EuiText>
  )
}
