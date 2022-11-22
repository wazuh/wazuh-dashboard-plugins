import { EuiCallOut } from "@elastic/eui";
import React from "react";
import { PermissionsAdvice } from '../../components'
import InstallEnrollAgent from "./install-enroll-agent";

/**
 * 
 * @param title 
 * @param state 
 * @param onChange 
 */
export const getInstallEnrollStepContent = (
    title: string,
    state: any,
    onChange: (field: string, value: string) => void,
  ) => {
    const {
      gotErrorRegistrationServiceInfo,
      missingOSSelection,
      language,
      Commandtext,
    } = state;
  
    return gotErrorRegistrationServiceInfo ? (
      <PermissionsAdvice />
    ) : missingOSSelection.length ? (
      <EuiCallOut
        color='warning'
        title={`Please select the ${missingOSSelection.join(', ')}.`}
        iconType='iInCircle'
      />
    ) : (
      <InstallEnrollAgent
        language={language}
        commandText={Commandtext}
        {...state}
        onSetShowPassword={() => {}}
      />
    );
  };
  