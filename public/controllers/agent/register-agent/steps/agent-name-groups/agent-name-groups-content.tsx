import { EuiFieldText } from "@elastic/eui";
import React, { Fragment, useEffect, useState } from "react";
import AgentGroup from "./agent-group";
import { getGroups } from '../../services/register-agent-service';

/**
 * 
 * @param title 
 * @param state 
 * @param onChange 
 */
export const getAgentNameAndGroupsStepContent = (
    title: string,
    state: any,
    onChange: (field: string, value: string) => void,
  ) => {
    const agentName = (
      <EuiFieldText
        placeholder='Name agent'
        value={state.agentName || ''}
        onChange={event => onChange('agentName', event.target.value)}
      />
    );
  
    const [groups, setGroups] = useState([]);
  
    useEffect(() => {
      initialize();
    }, []);
  
    const initialize = async () => {
      const groups = await getGroups();
      setGroups(groups);
    };
  
    return (
      <Fragment>
        {agentName}
        <AgentGroup
          options={groups}
          onChange={(value: any) => onChange('agentGroup', value)}
        />
      </Fragment>
    );
  };