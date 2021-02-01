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
  const [api, setApi] = useState("");
  const [isClusterEnabled, setIsClusterEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mostActiveAgent, setMostActiveAgent] = useState({ name: '', id: '' });
  const [prevSearch, setPrevSearch] = useState(false);
  const [addingNewAgent, setAddingNewAgent] = useState(false);
  const [registerAgentsProps, setRegisterAgentsProps] = useState({});
  const [pattern, setPattern] = useState('');
  const [firstUrlParam, setFirstUrlParam] = useState('');
  const [secondUrlParam, setSecondUrlParam] = useState('');
  // const [summary, setSummary] = useState(false);
  const [currentApiAddress, setCurrentApiAddress] = useState();
  const [wazuhVersion, setWazuhVersion] = useState();


  useEffect(() => {
    console.log(firstUrlParam);
    if(firstUrlParam != "" && secondUrlParam != "" && pattern != ""){
      getMostActive()
    }
  }, [secondUrlParam]);

  useEffect(() => {
    setApi(JSON.parse(AppState.getCurrentAPI()).id)
    setIsClusterEnabled(AppState.getClusterInfo() && AppState.getClusterInfo().status === 'enabled')
    setIsLoading(true)
    setErrorInit(false)

    //functions
    loadStatus()
    load()
    setCurrentApiAddress(getCurrentApiAddress())
    setWazuhVersion(getCurrentApiAddress())
    // getWazuhVersion()
    // downloadCsv([])
  }, []);

  function load() {
    try {
      setErrorInit(false)

      console.log("-----------------");
      console.log(AppState.getClusterInfo());
      console.log(AppState.getCurrentPattern());
      console.log("-----------------");
      

      const clusterInfo = AppState.getClusterInfo();
      setPattern(AppState.getCurrentPattern())
      setFirstUrlParam(clusterInfo.status === 'enabled' ? 'cluster' : 'manager')
      setSecondUrlParam(clusterInfo[clusterInfo.status === 'enabled' ? 'cluster' : 'manager'])

    } catch (error) {
      setErrorInit(ErrorHandler.handle(error, '', { silent: true }))
    }
    setIsLoading(false)
    // this.$scope.$applyAsync();
  }

  async function getMostActive() {
   
    try {
      const data = await WzRequest.genericReq(
        'GET',
        `/elastic/top/${firstUrlParam}/${secondUrlParam}/agent.name/${pattern}`
      );
      setMostActiveAgent({name: data.data.data})
      const info = await this.genericReq.request(
        'GET',
        `/elastic/top/${firstUrlParam}/${secondUrlParam}/agent.id/${pattern}`
      );
      if (info.data.data === '' && this.mostActiveAgent.name !== '') {
        this.mostActiveAgent.id = '000';
      } else {
        this.mostActiveAgent.id = info.data.data;
      }
      return this.mostActiveAgent;
    } catch (error) { }
  }

  async function downloadCsv(filters) {
    try {
      ErrorHandler.info(
        'Your download should begin automatically...',
        'CSV'
      );
      const output = await WzRequest.csvReq('/agents', filters);
      const blob = new Blob([output], { type: 'text/csv' }); // eslint-disable-line

      FileSaver.saveAs(blob, 'agents.csv');

      return;
    } catch (error) {
      ErrorHandler.handle(error, 'Download CSV');
    }
    return;
  }

  async function loadStatus() {
    const summaryData = await WzRequest.apiReq('GET', '/agents/summary/status', {});
    // setSummary(summaryData.data.data)
    var summary = summaryData.data.data

    if (summary.total === 0) {
      addNewAgent(true)
    }

  }

  function addNewAgent(flag) {
    setAddingNewAgent(flag)
  }

  function openRegistrationDocs() {
    this.$window.open(
      'https://documentation.wazuh.com/current/user-manual/registering/index.html',
      '_blank'
    );
  }

  /**
   * Returns the current API address
   */
  async function getCurrentApiAddress() {
    try {
      console.log("GET CURRENT API");
      const result = await this.genericReq.request('GET', '/hosts/apis');
      const entries = result.data || [];
      const host = entries.filter(e => {
        console.log(e.id == this.api);       
        return e.id == this.api;
      });
      const url = host[0].url;
      const numToClean = url.startsWith('https://') ? 8 : 7;
      console.log(url.substr(numToClean));
      
      return url.substr(numToClean);
    } catch (error) {
      console.log(false);
      return false;
    }
  }

  /**
   * Returns the Wazuh version as x.y.z
   */
  async function getWazuhVersion() {
    try {
      const data = await WzRequest.apiReq('GET', '//', {});
      const result = ((data || {}).data || {}).data || {};
      
      console.log("WAZUH VERSION");
      console.log(result);      
      
      return result.api_version
    } catch (error) {
      return version;
    }
  }

  return (
    <div>
      <p>asdfsdf</p>
    </div>
  )
}
