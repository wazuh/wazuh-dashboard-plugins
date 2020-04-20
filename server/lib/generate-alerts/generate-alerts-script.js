/*
 * Wazuh app - Script to generate sample alerts
 * Copyright (C) 2015-2020 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

// General
import { IPs, Users, Ports, Paths, Win_Hostnames, GeoLocation, Agents } from './sample-data/common';
import { PCI_DSS, GDPR, HIPAA, GPG13, NIST_800_53 } from './sample-data/regulatory-compliance';

//AWS
import * as Audit from './sample-data/audit';
import * as Authentication from './sample-data/authentication';
import * as AWS from './sample-data/aws';
import * as IM from './sample-data/im';
import * as CISCAT from './sample-data/ciscat';
import * as Docker from './sample-data/docker';
import * as Mitre from './sample-data/mitre';
import * as Osquery from './sample-data/osquery';
import * as OpenSCAP from './sample-data/openscap';
import * as PolicyMonitoring from './sample-data/policy-monitoring';
import * as Virustotal from './sample-data/virustotal';
import * as Vulnerability from './sample-data/vulnerabilities';

//Alert
const alertIDMax = 6000;

// Rule
const ruleDescription = ["Sample alert 1", "Sample alert 2", "Sample alert 3", "Sample alert 4", "Sample alert 5"];
const ruleMaxLevel = 14;
const ruleMaxFiredtimes = 10;

/**
 * Get a random element of an array
 * @param {[]} array - Array to get a randomized element
 * @returns {any} - Element randomized
 */
function randomArrayItem(array) {
    return array[Math.floor(array.length * Math.random())];
}

/**
 * Generate a alert
 * @param {any} params - params to configure the alert
 * @param {boolean} params.aws - if true, set aws fields
 * @param {boolean} params.audit - if true, set System Auditing fields
 * @param {boolean} params.ciscat - if true, set CIS-CAT fields
 * @param {boolean} params.docker - if true, set Docker fields
 * @param {boolean} params.mitre - if true, set Mitre att&ck fields
 * @param {boolean} params.openscap - if true, set OpenSCAP fields
 * @param {boolean} params.osquery - if true, set Osquery fields
 * @param {boolean} params.rootcheck - if true, set Policy monitoring fields
 * @param {boolean} params.syscheck - if true, set integrity monitoring fields
 * @param {boolean} params.virustotal - if true, set VirusTotal fields
 * @param {boolean} params.vulnerabilities - if true, set vulnerabilities fields
 * @param {boolean} params.pci_dss - if true, set pci_dss fields
 * @param {boolean} params.gdpr - if true, set gdpr fields
 * @param {boolean} params.gpg13 - if true, set gpg13 fields
 * @param {boolean} params.hipaa - if true, set hipaa fields
 * @param {boolean} params.nist_800_53 - if true, set nist_800_53 fields
 * @param {boolean} params.nist_800_53 - if true, set nist_800_53 fields
 * @param {boolean} params.win_authentication_failed - if true, add win_authentication_failed to rule.groups
 * @param {number} params.probability_win_authentication_failed - probability to add win_authentication_failed to rule.groups. Example: 20 will be 20% of probability to add this to rule.groups
 * @param {boolean} params.authentication_failed - if true, add win_authentication_failed to rule.groups
 * @param {number} params.probability_authentication_failed - probability to add authentication_failed to rule.groups
 * @param {boolean} params.authentication_failures - if true, add win_authentication_failed to rule.groups
 * @param {number} params.probability_authentication_failures - probability to add authentication_failures to rule.groups
 * @return {any} - Alert generated 
 */
function generateAlert(params) {
    let alert = {
        "timestamp": "2020-01-27T11:08:47.777+0000",
        "rule": {
            "level": 3,
            "description": "Sample alert",
            "id": "5502",
            "firedtimes": 3,
            "mail": false,
            "groups": ["ossec"],
            // "pci_dss": ["10.2.5"],
            // "gpg13": ["7.8", "7.9"],
            // "gdpr": ["IV_32.2"],
            // "hipaa": ["164.312.b"],
            // "nist_800_53": ["AU.14", "AC.7"]
        },
        "agent": {
            "id": "000",
            "name": "master"
        },
        "manager": {
            "name": "master"
        },
        "cluster": {
            "name": "wazuh"
        },
        "id": "1580123327.49031",
        "full_log": "Sample alert full log",
        "predecoder": {
            "program_name": "sshd",
            "timestamp": "Jan 27 11:08:46",
            "hostname": "master"
        },
        "decoder": {
            "parent": "pam",
            "name": "pam"
        },
        "data": {
            "dstuser": "root"
        },
        "location": "/random"
    }

    // alert.id = // TODO: generate random?;
    alert.agent = randomArrayItem(Agents);
    alert.rule.description = randomArrayItem(ruleDescription);
    alert.rule.id = randomIntervalInteger(1,alertIDMax);
    alert.rule.level = randomIntervalInteger(1,ruleMaxLevel);
    alert.rule.firedtimes = randomIntervalInteger(1,ruleMaxFiredtimes);
    alert.timestamp = randomDate();
    

    if (params.manager) {
        if (params.manager.name) {
            alert.manager.name = params.manager.name;
        }
    }

    if (params.cluster) {
        if (params.cluster.name) {
            alert.cluster.name = params.cluster.name;
        }
        if (params.cluster.node) {
            alert.cluster.node = params.cluster.node;
        }
    }

    if (params.aws) {
        alert.rule.groups.push("amazon");
        alert.rule.description = randomArrayItem(AWS.ruleDescription);
        alert.data.aws = {};
        alert.data.aws.source = randomArrayItem(AWS.source);
        alert.GeoLocation = {
            location: randomArrayItem(AWS.geoLocation)
        };
        alert.data.aws.log_info = {
            s3bucket: randomArrayItem(AWS.buckets)
        };
        alert.data.aws.accountId = randomArrayItem(AWS.accountId);
        alert.data.aws.region = randomArrayItem(AWS.region);
    }

    if (params.audit) {
        alert.rule.groups.push('audit');
        alert.data.audit = {};
        alert.data.audit.command = randomArrayItem(Audit.command);
        alert.data.audit.file = { name: randomArrayItem(Audit.fileName) };
        alert.data.audit.exe = randomArrayItem(Audit.exe);
        alert.rule.description = randomArrayItem(Audit.ruleDescription);
        alert.rule.description = alert.rule.description === 'Audit: Command: ' ? `Audit: Command: ${alert.rule.description}` : alert.rule.description;
    }

    if (params.ciscat) {
        alert.rule.groups.push("ciscat");
        alert.data.cis = {};

        alert.data.cis.group = randomArrayItem(CISCAT.group);
        alert.data.cis.fail = randomIntervalInteger(0, 100);
        alert.data.cis.rule_title = randomArrayItem(CISCAT.ruleTitle);
        alert.data.cis.notchecked = randomIntervalInteger(0, 100);
        alert.data.cis.score = randomIntervalInteger(0, 100);
        alert.data.cis.pass = randomIntervalInteger(0, 100);
        alert.data.cis.timestamp = new Date(randomDate());
        alert.data.cis.error = randomIntervalInteger(0, 1);
        alert.data.cis.benchmark = randomArrayItem(CISCAT.benchmark);
        alert.data.cis.unknown = randomIntervalInteger(0, 1);
        alert.data.cis.result = randomArrayItem(CISCAT.result);
    }

    if (params.docker) {
        alert.rule.groups.push("docker");
        alert.data.docker = {};
        alert.data.docker.Actor = {};
        alert.data.docker.Actor.Attributes = {};

        alert.data.docker.Actor.Attributes.image = randomArrayItem(Docker.actorAttributesImage);
        alert.data.docker.Actor.Attributes.name = randomArrayItem(Docker.actorAttributesName);
        alert.data.docker.Type = randomArrayItem(Docker.type);
        alert.data.docker.Action = randomArrayItem(Docker.action);
    }

    if (params.mitre) {
        alert.rule.mitre = {
            id: randomUniqueValuesFromArray(Mitre.id, 3).sort(),
            tactics: randomUniqueValuesFromArray(Mitre.tactics, 3).sort()
        }
        //TODO: add info
    }

    if (params.openscap) {
        alert.rule.groups.push("oscap");
        alert.data.oscap = {};
        alert.data.oscap.scan = {};
        alert.data.oscap.scan.profile = {};
        alert.data.oscap.check = {};

        alert.data.oscap.scan.profile.title = randomArrayItem(OpenSCAP.scanProfileTitle);
        alert.data.oscap.scan.content = randomArrayItem(OpenSCAP.scanContent);
        alert.data.oscap.scan.score = randomIntervalInteger(50, 80);
        alert.data.oscap.check.result = randomArrayItem(OpenSCAP.checkResult);
        alert.data.oscap.check.severity = randomArrayItem(OpenSCAP.checkSeverity);
        alert.data.oscap.check.title = randomArrayItem(OpenSCAP.checkTitle);
    }

    if (params.rootcheck) {
        alert.rule.groups.push('rootcheck');
        alert.rule.description = randomArrayItem(PolicyMonitoring.ruleDescription);
        alert.data.title = randomArrayItem(PolicyMonitoring.title);
    }

    if (params.syscheck) {
        alert.rule.groups.push("syscheck");
        alert.syscheck = {};
        alert.syscheck.event = randomArrayItem(IM.events);
        alert.syscheck.path = randomArrayItem(Paths);
        alert.syscheck.uname_after = randomArrayItem(Users);
    }

    if (params.virustotal) {
        alert.rule.groups.push("virustotal");
        alert.data.virustotal = {};
        alert.data.virustotal.source = {};
        alert.data.virustotal.source.file = randomArrayItem(Virustotal.sourceFile);;
        alert.data.virustotal.permalink = randomArrayItem(Virustotal.permalink);;
        alert.data.virustotal.source.md5 = randomArrayItem(Virustotal.sourceMd5);
        alert.data.virustotal.malicious = randomArrayItem(Virustotal.malicious);
        alert.data.virustotal.positives = `${randomIntervalInteger(0,20)}`;
    }

    if (params.vulnerabilities) {
        alert.rule.groups.push("vulnerability-detector");
        alert.data.vulnerability = {};
        alert.data.vulnerability.package = {};

        alert.data.vulnerability.package.name = randomArrayItem(Vulnerability.packageName);
        alert.data.vulnerability.cwe_reference = randomArrayItem(Vulnerability.cweReference);
        const dataVulnerability = randomArrayItem(Vulnerability.data);
        alert.data.vulnerability.severity = dataVulnerability.severity;
        alert.data.vulnerability.state = dataVulnerability.state;
        alert.data.vulnerability.cve = dataVulnerability.cve;
        alert.data.vulnerability.title = dataVulnerability.title;
        alert.rule.description = dataVulnerability.title;
        alert.data.vulnerability.reference = dataVulnerability.reference;
    }
    
    if (params.osquery) {
        alert.rule.groups.push("osquery");
        alert.rule.description = randomArrayItem(Osquery.ruleDescription);
        alert.data.osquery = {};

        alert.data.osquery.name = randomArrayItem(Osquery.name);
        alert.data.osquery.action = randomArrayItem(Osquery.action);
        alert.data.osquery.calendarTime = new Date(randomDate());
        alert.data.osquery.pack = randomArrayItem(Osquery.pack);
    }

    if (params.win_authentication_failed || (params.probability_win_authentication_failed && randomProbability(params.probability_win_authentication_failed))){
        alert.rule.groups.push('win_authentication_failed')
    }

    if (params.authentication_failed || (params.probability_authentication_failed && randomProbability(params.probability_authentication_failed))){
        alert.rule.groups.push('authentication_failed')
    }

    if (params.authentication_failures || (params.probability_authentication_failures && randomProbability(params.probability_authentication_failures))){
        alert.rule.groups.push('authentication_failures')
    }

    // Regulatory compliance
    if (params.pci_dss || params.regulatory_compliance || (params.random_probability_regulatory_compliance && randomProbability(params.random_probability_regulatory_compliance))) {
        alert.rule.pci_dss = [randomArrayItem(PCI_DSS)];
    }
    if (params.gdpr || params.regulatory_compliance || (params.random_probability_regulatory_compliance && randomProbability(params.random_probability_regulatory_compliance))) {
        alert.rule.gdpr = [randomArrayItem(GDPR)];
    }
    if (params.gpg13 || params.regulatory_compliance || (params.random_probability_regulatory_compliance && randomProbability(params.random_probability_regulatory_compliance))) {
        alert.rule.gpg13 = [randomArrayItem(GPG13)];
    }
    if (params.hipaa || params.regulatory_compliance || (params.random_probability_regulatory_compliance && randomIntervalInteger(params.random_probability_regulatory_compliance))) {
        alert.rule.hipaa = [randomArrayItem(HIPAA)];
    }
    if (params.nist_800_83 || params.regulatory_compliance || (params.random_probability_regulatory_compliance && randomIntervalInteger(params.random_probability_regulatory_compliance))) {
        alert.rule.nist_800_53 = [randomArrayItem(NIST_800_53)];
    }

    if (params.authentication) {
        alert.data.srcip = randomArrayItem(IPs);
        alert.data.srcuser = randomArrayItem(Users);
        alert.data.srcport = randomArrayItem(Ports);
        alert.GeoLocation = randomArrayItem(GeoLocation);
        alert.decoder = {
            name: 'sshd',
            parent: 'sshd'
        }
        alert.input = {
            type: 'log'
        };
        alert.location = '/var/log/auth.log';
        alert.rule.description = randomArrayItem(Authentication.sshRuleDescription);
        alert.rule.groups = ['syslog', 'sshd'];
        alert.predecoder = {
            hostname: '',// TODO:ip-10-0-0-179
            program_name: 'sshd',
            timestamp: alert.timestamp // TODO:Apr 16 11:21:10
        }
        alert.rule.pci_dss = [randomArrayItem(PCI_DSS)];
        alert.rule.gdpr = [randomArrayItem(GDPR)];
        alert.rule.gpg13 = [randomArrayItem(GPG13)];
        alert.rule.hipaa = [randomArrayItem(HIPAA)];
        alert.rule.nist_800_53 = [randomArrayItem(NIST_800_53)];

        if(params.authentication.invalid_login_password){
            alert.full_log = `${alert.predecoder.timestamp} ip-${alert.agent.name} sshd[5413]: Failed password for invalid user ${alert.data.srcuser} from ${alert.data.srcip} port ${alert.data.srcport} ssh2`;
            alert.location = '/var/log/secure';
            alert.rule.description = 'sshd: authentication failed.';
            alert.rule.groups = ['syslog', 'sshd', 'invalid_login', 'authentication_failed'];
            alert.rule.id = 5710;
            alert.rule.id = 5;
        }
        if (params.authentication.invalid_login_user){
            alert.full_log = `${alert.predecoder.timestamp} ip-${alert.agent.name} sshd[10022]: Invalid user admin from ${alert.data.srcuser} from ${alert.data.srcip} port ${alert.data.srcport} ssh2`;
            alert.location = '/var/log/secure';
            alert.rule.description = 'sshd: Attempt to login using a non-existent user';
            alert.rule.groups = ['syslog', 'sshd', 'invalid_login', 'authentication_failed'];
            alert.rule.id = 5710;
            alert.rule.id = 5;
        }
        if (params.authentication.multiple_authentication_failures) {
            alert.full_log = alert.full_log = `${alert.predecoder.timestamp} ip-${alert.agent.name} sshd[5413]: Failed password for invalid user ${alert.data.srcuser} from ${alert.data.srcip} port ${alert.data.srcport} ssh2`;
            alert.location = '/var/log/secure';
            alert.rule.description = 'sshd: Multiple authentication failures.';
            alert.rule.frequency = randomIntervalInteger(5,50);
            alert.rule.groups = ['syslog', 'sshd', 'authentication_failures'];
            alert.rule.id = 5720;
            alert.rule.level = 10;
        }
        if (params.authentication.windows_invalid_login_password) {
            alert.full_log = alert.full_log = `${alert.predecoder.timestamp} ip-${alert.agent.name} sshd[5413]: Failed password for invalid user ${alert.data.srcuser} from ${alert.data.srcip} port ${alert.data.srcport} ssh2`;
            alert.data.win = {
                eventdata: {
                    authenticationPackageName: 'NTLM',
                    failureReason: '%%2313',
                    ipAddress: randomArrayItem(IPs),
                    ipPort: randomArrayItem(Ports),
                    keyLength: 0,
                    logonProcessName: 'NtLmSsp',
                    logonType: '3',
                    processId: '0x0',
                    status: '0xc000006d',
                    subStatus: '0xc0000064',
                    subjectLogonId: '0x0',
                    subjectUserSid: "S-1-0-0",
                    targetUserName: "DIRECTION"
                },
                system: {
                    channel: 'Security',
                    computer: randomArrayItem(Win_Hostnames),
                    eventID: `${randomIntervalInteger(1,600)}`,
                    eventRecordID: `${randomIntervalInteger(10000,50000)}`,
                    keywords: '0x8010000000000000',
                    level: '0',
                    message: '',
                    opcode: '0',
                    processID: `${randomIntervalInteger(1,1200)}`,
                    providerGuid: '{54849625-5478-4994-a5ba-3e3b0328c30d}',
                    providerName: 'Microsoft-Windows-Security-Auditing',
                    severityValue: 'AUDIT_FAILURE',
                    systemTime: alert.timestamp,
                    task: `${randomIntervalInteger(1,1800)}`,
                    threadID: `${randomIntervalInteger(1,500)}`,
                    version: '0'
                }
            }
            alert.decoder.name = 'windows_eventchannel';
            alert.location = 'EventChannel';
            alert.rule.description = 'Logon Failure - Unknown user or bad password';
            alert.rule.frequency = randomIntervalInteger(5,50);
            alert.rule.groups = ['windows',  'windows_security', 'win_authentication_failed'];
            alert.rule.id = 60122;
            alert.rule.level = 5
            alert.gdpr = ['IV_35.7.d', 'IV_32.2'];
            alert.gpg13 = ['7.1'];
            alert.hipaa = ['164.312.b'];
            alert.nist_800_53 = ['AU.1', 'AC.7'];
            alert.gdpr = ['10.2.4', '10.2.5'];
        }
    }
    if ( params.windows ){
        alert.rule.groups.push('windows');
        if(params.windows.service_control_manager){
            alert.predecoder = {
                program_name: 'WinEvtLog',
                timestamp: '2020 Apr 17 05:59:05'
            };
            alert.input = {
                type: 'log'
            };
            alert.data = {
                extra_data: 'Service Control Manager',
                dstuser: 'SYSTEM',
                system_name: randomArrayItem(Win_Hostnames),
                id: '7040',
                type: 'type',
                status: 'INFORMATION'
            }
            alert.rule.description = 'Windows: Service startup type was changed.'
            alert.rule.firedtimes = randomIntervalInteger(1,20);
            alert.rule.mail = false
            alert.rule.level = 3;
            alert.rule.groups.push('windows', 'policy_changed');
            alert.rule.pci = ['10.6'];
            alert.rule.hipaa = ['164.312.b'];
            alert.rule.gdpr = ['IV_35.7.d'];
            alert.rule.nist_800_53 = ['AU.6'];
            alert.rule.info = 'This does not appear to be logged on Windows 2000.';
            alert.location = 'WinEvtLog';
            alert.decoder = {
                parent: 'windows',
                name: 'windows'
            }
            alert.full_log = `2020 Apr 17 05:59:05 WinEvtLog: type: INFORMATION(7040): Service Control Manager: SYSTEM: NT AUTHORITY: ${alert.data.system_name}: Background Intelligent Transfer Service auto start demand start BITS ` //TODO: date
            alert.id = 18145;
            alert.fields = {
                timestamp: alert.timestamp
            };
        }

    }
    return alert;
}

/**
 * Get a random array with unique values
 * @param {[]} array Array to extract the values
 * @param {*} randomMaxRepetitions Number max of random extractions
 * @param {function} sort Funciton to seort elements
 * @return {*} Array with random values extracted of paramater array passed
 */
function randomUniqueValuesFromArray(array, randomMaxRepetitions = 1, sort){
    const repetitions = randomIntervalInteger(1, randomMaxRepetitions);
    const set = new Set();
    for (let i = 0; i < repetitions; i++) {
        set.add(array[randomIntervalInteger(0, array.length - 1)]);
    }
    return sort ? Array.from(set).sort(sort) : Array.from(set)
}

/**
 * Get a integer within a range 
 * @param {number} min - Minimum limit
 * @param {number} max - Maximum limit
 * @returns {number} - Randomized number in interval
 */
function randomIntervalInteger(min, max) {
    return Math.floor(Math.random() * (max - (min - 1))) + min;
}

/**
 * Generate random alerts
 * @param {*} params 
 * @param {number} numAlerts - Define number of alerts
 * @return {*} - Random generated alerts defined with params
 */
function generateAlerts(params, numAlerts = 1) {
    const alerts = [];
    for (let i = 0; i < numAlerts; i++) {
        alerts.push(generateAlert(params));
    }
    return alerts;
}

/**
 * Get a random Date in range(7 days ago - now)
 * @returns {date} - Random date in range (7 days ago - now)
 */
function randomDate(inf, sup) {

    const nowTimestamp = Date.now();
    const time = randomIntervalInteger(0, 604800000); // Random 7 days in miliseconds

    const unix_timestamp = nowTimestamp - time; // Last 7 days from now

    const lastWeek = new Date(unix_timestamp); 
    return formatDate(lastWeek, 'Y-M-DTh:m:s.l+0000')
}

// Format date
const formatterNumber = (number, zeros = 0) => ("0".repeat(zeros) + `${number}`).slice(-zeros);
const monthNames = {
    long: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    short: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
};
function formatDate(date, format){ // It could use "moment" library to format strings too,
    const tokens = {
        'D': (d) => formatterNumber(date.getDate(), 2), // 01-31
        'M': (d) => formatterNumber(date.getMonth() + 1, 2), // 01-12
        'J': (d) => monthNames.long(date.getMonth()), // 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
        'N': (d) => monthNames.short(date.getMonth()), // 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'
        'Y': (d) => date.getFullYear(), // 2020
        'h': (d) => formatterNumber(date.getHours(), 2), // 00-23
        'm': (d) => formatterNumber(date.getMinutes(), 2), // 00-59
        's': (d) => formatterNumber(date.getSeconds(), 2), // 00-59
        'l': (d) => formatterNumber(date.getMilliseconds(), 3) // 000-999
    }

    return format.split('').reduce((accum, token) => {
        if(tokens[token]){
            return accum + tokens[token](date)
        }
        return accum + token
    },'')
}

/**
 * Return a random probability
 * @param {number} probability 
 * @param {number[=100]} maximum 
 */
function randomProbability(probability, maximum = 100){
    return randomIntervalInteger(0,maximum) <= probability
}

export {
    generateAlert,
    generateAlerts
};

/* Use:
    generateAlert(params)
    generateAlerts(params, numberAlerts)

Examples:

    // --------- Generate one alert ---------

    - Generate syscheck (Integrity monitoring) sample alert
    generateAlert({syscheck: true});
    
    - Generate syscheck alert with PCI DSS
    generateAlert({syscheck: true, pci_dss: true});
    
    - Generate OpenSCAP alert with manager name and cluster info
    generateAlert({openscap: true, manager: {name: 'mymanager'}, cluster: {name: 'mycluster', node: 'mynode'}});

    // --------- Generate multiple alerts ---------

    - Generate 1000 random alerts of Osquery
    generateAlerts({osquery: true}, 1000);

    - Generate 1000 random alerts of PCI DSS with manager name and cluster info
    generateAlerts({pci_dss: true, manager: {name: 'mymanager'}, cluster: {name: 'mycluster', node: 'mynode'}}, 1000);
*/
