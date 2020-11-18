/*
 * Wazuh app - Module to update the configuration file
 * Copyright (C) 2015-2020 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import fs from 'fs';
import path from 'path';
import { log } from '../logger';

// import { UpdateRegistry } from './update-registry';
// import { initialWazuhConfig } from './initial-wazuh-config';

const OPTIMIZE_NIDS_PATH = '../../../../optimize/wazuh';
const file = path.join(__dirname, `${OPTIMIZE_NIDS_PATH}/config/config.json`);
const credentials = path.join(__dirname, `${OPTIMIZE_NIDS_PATH}/config/credentials.json`);

log('manage-nids-hosts:ManageNidsHosts', `FILE --> ${file}`, 'info');

const axios = require('axios')
const https = require('https');
const CryptoJS = require('crypto-js');
// const fs = require('fs');

let httsAgent = new https.Agent({ rejectUnauthorized: false });
let url = ''
let baseUrl = ''
let config
let NIDStoken = '';
let NIDSuser = '';
let NIDSpass = '';

export class ManageNidsHosts {
  //read credentials
  async getNidsCredentials(){
    let rawdata = fs.readFileSync(credentials);
    config = JSON.parse(rawdata);

    //decrypt password
    var decryptedData = CryptoJS.enc.Base64.parse(config.pass).toString(CryptoJS.enc.Utf8);

    //****IS NEEDED TO SAVE INTO A VARIABLE THE CONTENT OF JSON FILE */
    //save username
    NIDSuser = config.name
    NIDSpass = decryptedData

    //get active master and basic url
    const url = this.getActiveMasterURL()

    var jsonLogin = {};
    jsonLogin["user"] = NIDSuser
    jsonLogin["password"] = decryptedData
    var userLogin = JSON.stringify(jsonLogin);

    //get token from master
    const options = {
      method: 'PUT',
      withCredentials: true,
      timeout: 30000,
      url: `${url}/master/login`,
      data: userLogin
    };
    const response = await axios(options);
    NIDStoken = response.data
  }


  //get active master and return basic url
  getActiveMasterURL(){
    // log('manage-nids-hosts:readConfiguration', 'Read NIDS configuration', 'info');
    let rawdata = fs.readFileSync(file);
    config = JSON.parse(rawdata);

    config.map(master => {
      if (master.active) {
        baseUrl = `https://${master.ip}:${master.port}`
      }
    })

    const recurso = '/v1'
    return `${baseUrl}${recurso}`
  }

  //getNodes
  async getNodes() {
    //check credentials
    if((NIDStoken == "" || NIDStoken == null) || (NIDSuser == "" || NIDSuser == null)){
      await this.getNidsCredentials()
    }

    //get active master and basic url
    const url = this.getActiveMasterURL()

    const options = {
      method: 'GET',
      headers: {
        'content-type': 'application/json',
        'token': NIDStoken,
        'user': NIDSuser
      },
      url: `${url}/node/getAllNodesReact`,
    };
    const response = await axios(options);

    return response.data.Nodes
  }

  //getNodes
  async getRulesets() {
    //check credentials
    if((NIDStoken == "" || NIDStoken == null) || (NIDSuser == "" || NIDSuser == null)){
      await this.getNidsCredentials()
    }

    //get active master and basic url
    const url = this.getActiveMasterURL()

    const options = {
      method: 'GET',
      headers: {
        'content-type': 'application/json',
        'token': NIDStoken,
        'user': NIDSuser
      },
      url: `${url}/ruleset`,
    };
    const response = await axios(options);

    return response.data
  }

  //getNodes
  async getInterfaces() {
    //check credentials
    if((NIDStoken == "" || NIDStoken == null) || (NIDSuser == "" || NIDSuser == null)){
      await this.getNidsCredentials()
    }

    //get active master and basic url
    const url = this.getActiveMasterURL()

    const options = {
      method: 'GET',
      headers: {
        'content-type': 'application/json',
        'token': NIDStoken,
        'user': NIDSuser
      },
      url: `${url}/master/interface`,
    };
    const response = await axios(options);

    return response.data
  }

  //Delete node
  async deleteNode(req) {
    try{
      //check credentials
      if((NIDStoken == "" || NIDStoken == null) || (NIDSuser == "" || NIDSuser == null)){
        await this.getNidsCredentials()
      }

      //get active master and basic url
      const url = this.getActiveMasterURL()

      const options = {
        method: 'DELETE',
        headers: {
          'content-type': 'application/json',
          'token': NIDStoken,
          'user': NIDSuser
        },
        url: `${url}${req.path}`,
      };
      const response = await axios(options);
      
      if(response.data.ack === "false"){
        log('manage-nids-hosts:deleteNode', `${response.data.error}`, 'error');
        return response.data.error
      }
      
      return null

    } catch (error) {
      throw error;
    }
  }

  //add node
  async enrollNode(req) {
    try{
      //check credentials
      if((NIDStoken == "" || NIDStoken == null) || (NIDSuser == "" || NIDSuser == null)){
        await this.getNidsCredentials()
      }

      //get active master and basic url
      const url = this.getActiveMasterURL()

      const options = {
        method: req.method,
        headers: {
          'content-type': 'application/json',
          'token': NIDStoken,
          'user': NIDSuser
        },
        url: `${url}${req.path}`,
        data: JSON.stringify(req.data)
      };
      const response = await axios(options);
      
      if(response.data.ack === "false"){
        log('manage-nids-hosts:deleteNode', `${response.data.error}`, 'error');
        return response.data.error
      }
            
      return null

    } catch (error) {
      throw error;
    }
  }

  //edit node
  async editNode(req) {
    try{
      //check credentials
      if((NIDStoken == "" || NIDStoken == null) || (NIDSuser == "" || NIDSuser == null)){
        await this.getNidsCredentials()
      }

      //get active master and basic url
      const url = this.getActiveMasterURL()

      const options = {
        method: req.method,
        headers: {
          'content-type': 'application/json',
          'token': NIDStoken,
          'user': NIDSuser
        },
        url: `${url}${req.path}`,
        data: JSON.stringify(req.data)
      };
      const response = await axios(options);
      
      if(response.data.ack === "false"){
        log('manage-nids-hosts:deleteNode', `${response.data.error}`, 'error');
        return response.data.error
      }
            
      return null

    } catch (error) {
      throw error;
    }
  }

  //changeServiceStatus
  async changeServiceStatus(req) {
    try{
      //check credentials
      if((NIDStoken == "" || NIDStoken == null) || (NIDSuser == "" || NIDSuser == null)){
        await this.getNidsCredentials()
      }

      //get active master and basic url
      const url = this.getActiveMasterURL()


      req.data.param="status"

      const options = {
        method: req.method,
        headers: {
          'content-type': 'application/json',
          'token': NIDStoken,
          'user': NIDSuser
        },
        url: `${url}${req.path}`,
        data: JSON.stringify(req.data)
      };
      const response = await axios(options);
             
      return null

    } catch (error) {
      throw error;
    }
  }

  //edit plugin
  async addService(req) {
    try{
      //check credentials
      if((NIDStoken == "" || NIDStoken == null) || (NIDSuser == "" || NIDSuser == null)){
        await this.getNidsCredentials()
      }

      //get active master and basic url
      const url = this.getActiveMasterURL()

      const options = {
        method: req.method,
        headers: {
          'content-type': 'application/json',
          'token': NIDStoken,
          'user': NIDSuser
        },
        url: `${url}${req.path}`,
        data: JSON.stringify(req.data)
      };
      const response = await axios(options);
             
      return null

    } catch (error) {
      throw error;
    }
  }

  //edit plugin
  async updateService(req) {
    try{
      //check credentials
      if((NIDStoken == "" || NIDStoken == null) || (NIDSuser == "" || NIDSuser == null)){
        await this.getNidsCredentials()
      }

      //get active master and basic url
      const url = this.getActiveMasterURL()

      const options = {
        method: req.method,
        headers: {
          'content-type': 'application/json',
          'token': NIDStoken,
          'user': NIDSuser
        },
        url: `${url}${req.path}`,
        data: JSON.stringify(req.data)
      };
      const response = await axios(options);
             
      return null

    } catch (error) {
      throw error;
    }
  }

  //delete plugin
  async deleteService(req) {
    try{
      //check credentials
      if((NIDStoken == "" || NIDStoken == null) || (NIDSuser == "" || NIDSuser == null)){
        await this.getNidsCredentials()
      }

      //get active master and basic url
      const url = this.getActiveMasterURL()

      const options = {
        method: req.method,
        headers: {
          'content-type': 'application/json',
          'token': NIDStoken,
          'user': NIDSuser
        },
        url: `${url}${req.path}`,
        data: JSON.stringify(req.data)
      };
      const response = await axios(options);
             
      return null

    } catch (error) {
      throw error;
    }
  }

  //delete plugin
  async syncRuleset(req) {
    try{
      //check credentials
      if((NIDStoken == "" || NIDStoken == null) || (NIDSuser == "" || NIDSuser == null)){
        await this.getNidsCredentials()
      }

      //get active master and basic url
      const url = this.getActiveMasterURL()

      const options = {
        method: req.method,
        headers: {
          'content-type': 'application/json',
          'token': NIDStoken,
          'user': NIDSuser
        },
        url: `${url}${req.path}`,
        data: JSON.stringify(req.data)
      };
      const response = await axios(options);
             
      return null

    } catch (error) {
      throw error;
    }
  }

  //get node plugins
  async getNodePlugins(req) {
    //check credentials
    if((NIDStoken == "" || NIDStoken == null) || (NIDSuser == "" || NIDSuser == null)){
      await this.getNidsCredentials()
    }

    //get active master and basic url
    const url = this.getActiveMasterURL()

    const options = {
      method: req.method,
      headers: {
        'content-type': 'application/json',
        'token': NIDStoken,
        'user': NIDSuser
      },
      url: `${url}${req.path}`,
      // data: JSON.stringify(req.data)
    };

    const response = await axios(options);

    return response.data
  }

}