import React, { Component, useState, useEffect } from 'react';
import * as FileSaver from '../../services/file-saver';
import { DataFactory } from '../../services/data-factory';
import { version } from '../../../package.json';
import { clickAction } from '../../services/click-action';
import { AppState } from '../../react-services/app-state';
import { WazuhConfig } from '../../react-services/wazuh-config';
import { GenericRequest } from '../../react-services/generic-request';
import { WzRequest } from '../../react-services/wz-request';
import { ShareAgent } from '../../factories/share-agent';
import { TimeService } from '../../react-services/time-service';
import { ErrorHandler } from '../../react-services/error-handler';
import { getDataPlugin } from '../../kibana-services';

export const AgentsPreview = (props) => {

  const [rootScope, setRootScope] = useState();
  const [checks, setChecks] = useState([]);
  const [results, setResults] = useState([]);
  const [error, setError] = useState([]);
  const [errorInit, setErrorInit] = useState(false);

  useEffect(() => {
    getWazuhVersion()
  }, []);

  async function getWazuhVersion() {
    try {
      const data = await WzRequest.apiReq('GET', '//', {});
      const result = ((data || {}).data || {}).data || {};
      console.log("RESULT");
      console.log(result);
      return result.api_version
    } catch (error) {
      console.log("error");
      console.log(error);      
      return version
    }
  }

  return (
    <div>
      
    </div>
  )
}
