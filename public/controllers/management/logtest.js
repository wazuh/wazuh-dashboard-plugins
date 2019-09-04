/*
 * Wazuh app - Management edit ruleset configuration controller
 * Copyright (C) 2015-2019 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
export class LogtestController {
  /**
   * Constructor
   * @param {*} $scope
   * @param {*} $location
   * @param {*} errorHandler
   * @param {*} apiReq
   * @param {*} appState
   */
  constructor(
    $scope,
    $location,
    errorHandler,
    apiReq,
    appState
  ) {
    this.$scope = $scope;
    this.errorHandler = errorHandler;
    this.apiReq = apiReq;
    this.appState = appState;
    this.$location = $location;
  }

  /**
   * When controller loads
   */
  $onInit() {
    this.logInput = `{"timestamp":"2019-09-03T13:22:27.950+0000","rule":{"level":7},"location":"vulnerability-detector"}`;
    this.$scope.$applyAsync();

  }

  test = () => {
    this.processing = true;
    setTimeout(( ) => { 
      this.XMLContent = `
      **Phase 1: Completed pre-decoding.
             full event: 'timestamp:2019-09-03T13:22:27.950+0000 rule:level:7 rule:description:python: Undocumented local_file protocol allows remote attackers to bypass protection mechanisms rule:id:23504 rule:firedtimes:33 rule:mail:false rule:groups:[vulnerability-detector] rule:gdpr:[IV_35.7.d] agent:id:000 agent:name:a205e5b2a1aa manager:{name:a205e5b2a1aa} id:1567516947.252273 cluster:name:wazuh cluster:node:master decoder:{name:json} data:{vulnerability:cve:CVE-2019-9948} data:{vulnerability:title:python: Undocumented local_file protocol allows remote attackers to bypass protection mechanisms} data:{vulnerability:severity:Medium} data:{vulnerability:published:2019-03-23T00:00:00+00:00} data:{vulnerability:state:Fixed} data:{vulnerability:cvss:{cvss3_score:7.400000}} data:{vulnerability:package:name:python} data:{vulnerability:package:version:2.7.5-80.el7_6} data:{vulnerability:package:condition:less than 2.7.5-86.el7} data:{vulnerability:advisories:RHSA-2019:2030,RHSA-2019:1700} data:{vulnerability:cwe_reference:CWE-749} data:{vulnerability:bugzilla_reference:https://bugzilla.redhat.com/show_bug.cgi?id=1695570} data:{vulnerability:reference:https://access.redhat.com/security/cve/CVE-2019-9948} location:vulnerability-detector'
             timestamp: '(null)'
             hostname: 'a205e5b2a1aa'
             program_name: '(null)'
             log: 'timestamp:2019-09-03T13:22:27.950+0000 rule:level:7 rule:description:python: Undocumented local_file protocol allows remote attackers to bypass protection mechanisms rule:id:23504 rule:firedtimes:33 rule:mail:false rule:groups:[vulnerability-detector] rule:gdpr:[IV_35.7.d] agent:id:000 agent:name:a205e5b2a1aa manager:{name:a205e5b2a1aa} id:1567516947.252273 cluster:name:wazuh cluster:node:master decoder:{name:json} data:{vulnerability:cve:CVE-2019-9948} data:{vulnerability:title:python: Undocumented local_file protocol allows remote attackers to bypass protection mechanisms} data:{vulnerability:severity:Medium} data:{vulnerability:published:2019-03-23T00:00:00+00:00} data:{vulnerability:state:Fixed} data:{vulnerability:cvss:{cvss3_score:7.400000}} data:{vulnerability:package:name:python} data:{vulnerability:package:version:2.7.5-80.el7_6} data:{vulnerability:package:condition:less than 2.7.5-86.el7} data:{vulnerability:advisories:RHSA-2019:2030,RHSA-2019:1700} data:{vulnerability:cwe_reference:CWE-749} data:{vulnerability:bugzilla_reference:https://bugzilla.redhat.com/show_bug.cgi?id=1695570} data:{vulnerability:reference:https://access.redhat.com/security/cve/CVE-2019-9948} location:vulnerability-detector'
      **Phase 2: Completed decoding.
             No decoder matched.
      **Phase 3: Completed filtering (rules).
             Rule id: '1002'
             Level: '2'
             Description: 'Unknown problem somewhere in the system.'`;
      this.$scope.$broadcast('XMLContentReady', {
        data: this.XMLContent,
        logs: true
      });
      this.processing = false;
     }, 2000);
  }
}
