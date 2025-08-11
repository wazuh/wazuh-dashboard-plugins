import React, { useEffect, useState } from 'react';
import { EuiCodeBlock } from '@elastic/eui';
import { UseCases } from '../setup';

interface RegisterAgentClipboardProps {
  agentId: string;
}

const RegisterAgentCommand = ({ agentId }: RegisterAgentClipboardProps) => {
  const [command, setCommand] = useState<string | null>(null);

  const fetchRegisterAgentCommand = async (agentId: string) => {
    const command = await UseCases.getRegisterAgentCommand(agentId);
    setCommand(command);
  };

  useEffect(() => {
    if (agentId) {
      fetchRegisterAgentCommand(agentId);
    }
  }, [agentId]);

  return (
    <EuiCodeBlock language='shell' isCopyable>
      {command}
    </EuiCodeBlock>
  );
};

export default RegisterAgentCommand;
