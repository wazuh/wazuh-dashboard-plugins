import React, { Fragment } from "react";
import WazuhPassword from "./wazuh-password";

export const getWazuhPasswordStepContent = (
    title: string,
    state: any,
    onChange: (field: string, value: string) => void,
  ) => {
    return (
      <Fragment>
        <WazuhPassword
          defaultValue={state.wazuhPassword}
          onChange={(value: string) => onChange('wazuhPassword', value)}
        />
      </Fragment>
    );
  };