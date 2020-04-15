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

 //Alert
const alertIDMax = 6000;

// Agents
const agents = [{ "id": "000", "name": "master" }, { "id": "001", "name": "agent-jcr" }, { "id": "002", "name": "agent-pt" }, { "id": "003", "name": "agent-js" }, { "id": "004", "name": "agent-aa" }, { "id": "005", "name": "agent-vs" }, { "id": "006", "name": "agent-ag" }, { "id": "007", "name": "agent-jr" }] // Yes, each developer has an agent :P

// Rule
const ruleDescription = ["Sample alert 1", "Sample alert 2", "Sample alert 3", "Sample alert 4", "Sample alert 5"];
const ruleMaxLevel = 14;
const ruleMaxFiredtimes = 10;

// Modules

// Amazon AWS services
const awsSource = ["guardduty", "cloudtrail", "vpcflow", "config"];
const awsGeoLocation = [{ "lat": 40.12, "lon": -71.34 }, { "lat": 37.14, "lon": -3.61 }, { "lat": 31, "lon": 121 }, { "lat": 28, "lon": 77 }, { "lat": 55, "lon": 13 }];
const awsAccountId = ["aws-account1", "aws-account2", "aws-account3"];
const awsRegion = ["eu-west-1", "eu-west-2", "us-east-1", "us-east-2", "us-west-1", "us-west-2", "me-south-1", "ap-east-1", "ap-south-1"]; // https://docs.aws.amazon.com/es_es/AWSEC2/latest/UserGuide/using-regions-availability-zones.html#concepts-regions
const awsBuckets = ["aws-bucket1", "aws-bucket2", "aws-bucket3"];

// Audit
const auditCommand = ["sudo", "ssh", "cron", "ls"];
const auditExe = ["/usr/sbin/sudo", "/usr/sbin/sshd", "/usr/sbin/crond", "/usr/bin/ls"]; // https://wazuh.com/blog/monitoring-root-actions-on-linux-using-auditd-and-wazuh/
const auditFileName = ["/etc/samplefile", "/etc/sample/file", "/var/sample"];

// CIS-CAT
// More info https://documentation.wazuh.com/3.12/user-manual/capabilities/policy-monitoring/ciscat/ciscat.html
const ciscatRuleTitle = ["Sample CIS-CAT 1", "Sample CIS-CAT 2", "Sample CIS-CAT 3", "Sample CIS-CAT 4", "Sample CIS-CAT 5", "Sample CIS-CAT 6"];
const ciscatGroup = ["Access, Authentication and Authorization"];
const ciscatBenchmark = ["CIS Ubuntu Linux 16.04 LTS Benchmark"]; // TODO: add more benchmarks
const ciscatResult = ["fail", "error"]; // FIXME: 'fail' seems to exists, but 'error' is valid?

// Docker listener
const dockerActorAttributesImage = ["wazuh/wazuh:3.12.0-7.6.1", "docker.elastic.co/elasticsearch/elasticsearch:7.6.2", "docker.elastic.co/kibana/kibana:7.6.2", "nginx:latest"];
const dockerType = ["container", "image", "volume", "network"];
const dockerAction = ["start", "stop", "pause", "unpause"];
const dockerActorAttributesName = ["wonderful_page", "nostalgic_gates", "jovial_zuckerberg", "inspiring_jobs", "opening_torvalds", "gifted_bezos", "clever_wales", "laughing_tesla", "kind_nobel"]; // https://github.com/moby/moby/blob/5aa44cdf132788cc0cd28ce2393b44265dd400e9/pkg/namesgenerator/names-generator.go#L600

// Mitre
const mitreId = ["T1021", "T1040", "T1043", "T1046", "T1055", "T1063", "T1063", "T1070", "T1071", "T1083", "T1089", "T1090", "T1093", "T1096", "T1098", "T1100", "T1102", "T1107", "T1110", "T1112", "T1133", "T1169", "T1204", "T1210", "T1215", "T1484", "T1485", "T1489", "T1492", "T1497", "T1529"]
const mitreTactics = ["Execution", "Persistence", "Privilege Escalation", "Defense Evasion", "Credential Access", "Discovery", "Lateral Movement", "Collection", "Command and Control", "Exfiltration", "Impact", "Initial Access"]

// Syscheck
const syscheckEvents = ["modified", "deleted", "added"];
const syscheckPath = ["/home/user/sample", "/tmp/sample", "/etc/sample"];
const syscheckUname = ["root", "juanca", "pablo", "jose", "alberto", "victor", "antonio", "jesus"];

// Regulatory compliance
const pci_dss = ["1.1.1","1.3.4","1.4","10.1","10.2.1","10.2.2","10.2.4","10.2.5","10.2.6","10.2.7","10.4","10.5.2","10.5.5","10.6","10.6.1","11.2.1","11.2.3","11.4","11.5","2.2","2.2.3","4.1","5.1","5.2","6.2","6.5","6.5.1","6.5.10","6.5.2","6.5.5","6.5.7","6.5.8","6.6","8.1.2","8.1.4","8.1.5","8.1.6","8.1.8","8.2.4","8.7"];
const gdpr = ["IV_35.7.d", "II_5.1.f", "IV_32.2", "IV_30.1.g"];
const hipaa = ["164.312.a.1","164.312.a.2.I","164.312.a.2.II","164.312.a.2.III","164.312.a.2.IV","164.312.b","164.312.c.1","164.312.c.2","164.312.d","164.312.e.1","164.312.e.2.I","164.312.e.2.II"];
const nist_800_53 = ["AC.12","AC.2","AC.6","AC.7","AU.12","AU.14","AU.5","AU.6","AU.8","AU.9","CA.3","CM.1","CM.3","CM.5","IA.4","IA.5","SA.11","SC.2","SC.5","SC.7","SC.8","SI.2","SI.3","SI.4","SI.7"];

const gpg13 = ["7.8", "7.9"]

// OpenSCAP
const oscapScanProfileTitle = ["xccdf_org.ssgproject.content_profile_standard", "xccdf_org.ssgproject.content_profile_pci-dss", "xccdf_org.ssgproject.content_profile_common", "xccdf_org.ssgproject.content_profile_anssi_np_nt28_minimal"];
const oscapCheckSeverity = ["low", "medium", "high"];
const oscapCheckResult = ["fail"];
const oscapScanContent = ["ssg-centos-7-ds.xml", "ssg-centos-6-ds.xml", "ssg-rhel6-ds.xml", "ssg-ubuntu18-ds.xml", "ssg-debian-ds.xml", "ssg-fedora-ds.xml"];
const oscapCheckTitle = ["Sample OpenSCAP title 1", "Sample OpenSCAP title 2", "Sample OpenSCAP title 3", "Sample OpenSCAP title 4", "Sample OpenSCAP title 5", "Sample OpenSCAP title 6"];

// Osquery
const osqueryName = ["Sample Osquery alert 1", "Sample Osquery alert 2", "Sample Osquery alert 3", "Sample Osquery alert 4", "Sample Osquery alert 5"];
const osqueryAction = ["added", "removed"];
const osqueryPack = ["/etc/osquery-packs/custom_pack.conf", "/etc/osquery-packs/custom_pack2.conf", "/etc/osquery-packs/custom_pack3.conf", "/etc/osquery-packs/custom_pack4.conf", "/etc/osquery-packs/custom_pack5.conf", "/etc/osquery-packs/custom_pack6.conf"];

// Policy monitoring
const pmTitle = ["Sample policy monitoring 1", "Sample policy monitoring 2", "Sample policy monitoring 3", "Sample policy monitoring 4", "Sample policy monitoring 5", "Sample policy monitoring 6"];

// Virustotal
const virustotalSourceFile = ['/usr/share/sample/program', "/etc/data/file", "/etc/sample/script", "/root/super-script", "/bin/node", "/var/opt/amazing-file"];
const virustotalPermalink = ['https://www.virustotal.com/gui/file/0a049436fa6c103d4e413fc3a5a8f7152245a36750773a19fdd32f5f6e278347/detection', "https://www.virustotal.com/gui/file/417871ee18a4c782df7ae9b7a64ca060547f7c88a4a405b2fa2487940eaa3c31/detection", "https://www.virustotal.com/gui/file/1bbf37332af75ea682fb4523afc8e61adb22f47f2bf3a8362e310f6d33085a6e/detection", "https://www.virustotal.com/gui/file/e68cda15a436dfcbbabb42c232afe6caa88076c8cb7bc107b6cfe8a08f6044dc/detection", "https://www.virustotal.com/gui/file/509790d92c2c8846bf4ffacfb03c4f8817ac548262c70c13b08ef5cdfba6f596/detection"];
const virustotalSourceMd5 = ["31ce29c49fcbfdb6529619dd4396f86f", "01e24436a87c7e243322db106b963fb7", "0af7650be50a47adb8dcf9c00d210ad9", "a30529c04af5fef076781585ccec4810", "8692d6cc1108db34cd55ce904a991d06", "702be1ff0a5bd7f8f32ab276b87e8d38", "c6d9876d5d92a422525d11f267d37abb"];
const virustotalMalicious = ["0", "1"];
const virustotalPositives = ["0", "1"];

// Vulnerability
const vulnerabilitySeverity = ["Low", "Medium", "High", "Critical"];
const vulnerabilityPackageName = ["bluez", "gcc-mingw-w64", "squashfs-tools", "util-linux", "accountsservice", "git", "node", "zip", "kernel"];
const vulnerabilityCve = ["CVE-2017-11671", "CVE-2008-7320", "CVE-2011-1011", "CVE-2012-0881", "CVE-2012-1093"];
const vulnerabilityCwe_reference = ["CWE-527", "CWE-911", "CWE-409", "CWE-102", "CWE-120", "CWE-420", "CWE-322", "CWE-789"];
const vulnerabilityReference = ["Sample vulnerability reference 1", "Sample vulnerability reference 2", "Sample vulnerability reference 3", "Sample vulnerability reference 4"];
const vulnerabilityTitle = ["Sample vulnerability 1", "Sample vulnerability 2", "Sample vulnerability 3", "Sample vulnerability 4"];

/**
 * Get a random element of an array
 * @param {[]} array - Array to get a randomized element
 * @returns {any} - Element randomized
 */
function getRandomFromArray(array) {
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
    alert.agent = getRandomFromArray(agents);
    alert.rule.description = getRandomFromArray(ruleDescription);
    alert.rule.id = randomInterval(1,alertIDMax);
    alert.rule.level = randomInterval(1,ruleMaxLevel);
    alert.rule.firedtimes = randomInterval(1,ruleMaxFiredtimes);
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
        alert.data.aws = {};
        alert.data.aws.source = getRandomFromArray(awsSource);
        alert.GeoLocation = {
            location: getRandomFromArray(awsGeoLocation)
        };
        alert.data.aws.log_info = {
            s3bucket: getRandomFromArray(awsBuckets)
        };
        alert.data.aws.accountId = getRandomFromArray(awsAccountId);
        alert.data.aws.region = getRandomFromArray(awsRegion);
    }

    if (params.audit) {
        alert.rule.groups.push('audit');
        alert.data.audit = {};
        alert.data.audit.command = getRandomFromArray(auditCommand);
        alert.data.audit.file = { name: getRandomFromArray(auditFileName) };
        alert.data.audit.exe = getRandomFromArray(auditExe);
    }

    if (params.ciscat) {
        alert.rule.groups.push("ciscat");
        alert.data.cis = {};

        alert.data.cis.group = getRandomFromArray(ciscatGroup);
        alert.data.cis.fail = randomInterval(0, 100);
        alert.data.cis.rule_title = getRandomFromArray(ciscatRuleTitle);
        alert.data.cis.notchecked = randomInterval(0, 100);
        alert.data.cis.score = randomInterval(0, 100);
        alert.data.cis.pass = randomInterval(0, 100);
        alert.data.cis.timestamp = randomDate();
        alert.data.cis.error = randomInterval(0, 1);
        alert.data.cis.benchmark = getRandomFromArray(ciscatBenchmark);
        alert.data.cis.unknown = randomInterval(0, 1);
        alert.data.cis.result = getRandomFromArray(ciscatResult);
    }

    if (params.docker) {
        alert.rule.groups.push("docker");
        alert.data.docker = {};
        alert.data.docker.Actor = {};
        alert.data.docker.Actor.Attributes = {};

        alert.data.docker.Actor.Attributes.image = getRandomFromArray(dockerActorAttributesImage);
        alert.data.docker.Actor.Attributes.name = getRandomFromArray(dockerActorAttributesName);
        alert.data.docker.Type = getRandomFromArray(dockerType);
        alert.data.docker.Action = getRandomFromArray(dockerAction);
    }

    if (params.mitre) {
        alert.rule.mitre = {
            id: generateRandomMitreNumberId(),
            tactics: generateRandomMitreNumberTactics()
        }
        //TODO: add info
    }

    if (params.openscap) {
        alert.rule.groups.push("oscap");
        alert.data.oscap = {};
        alert.data.oscap.scan = {};
        alert.data.oscap.scan.profile = {};
        alert.data.oscap.check = {};

        alert.data.oscap.scan.profile.title = getRandomFromArray(oscapScanProfileTitle);
        alert.data.oscap.scan.content = getRandomFromArray(oscapScanContent);
        alert.data.oscap.scan.score = randomInterval(50, 80);
        alert.data.oscap.check.result = getRandomFromArray(oscapCheckResult);
        alert.data.oscap.check.severity = getRandomFromArray(oscapCheckSeverity);
        alert.data.oscap.check.title = getRandomFromArray(oscapCheckTitle);
    }

    if (params.rootcheck) {
        alert.rule.groups.push('rootcheck');
        alert.data.title = getRandomFromArray(pmTitle);
    }

    if (params.syscheck) {
        alert.rule.groups.push("syscheck");
        alert.syscheck = {};
        alert.syscheck.event = getRandomFromArray(syscheckEvents);
        alert.syscheck.path = getRandomFromArray(syscheckPath);
        alert.syscheck.uname_after = getRandomFromArray(syscheckUname);
    }

    if (params.virustotal) {
        alert.rule.groups.push("virustotal");
        alert.data.virustotal = {};
        alert.data.virustotal.source = {};
        alert.data.virustotal.source.file = getRandomFromArray(virustotalSourceFile);;
        alert.data.virustotal.permalink = getRandomFromArray(virustotalPermalink);;
        alert.data.virustotal.source.md5 = getRandomFromArray(virustotalSourceMd5);
        alert.data.virustotal.malicious = getRandomFromArray(virustotalMalicious);
        alert.data.virustotal.positives = `${randomInterval(0,20)}`;
    }

    if (params.vulnerabilities) {
        alert.rule.groups.push("vulnerability-detector");
        alert.data.vulnerability = {};
        alert.data.vulnerability.package = {};

        alert.data.vulnerability.severity = getRandomFromArray(vulnerabilitySeverity);
        alert.data.vulnerability.package.name = getRandomFromArray(vulnerabilityPackageName);
        alert.data.vulnerability.cve = getRandomFromArray(vulnerabilityCve);
        alert.data.vulnerability.cwe_reference = getRandomFromArray(vulnerabilityCwe_reference);
        alert.data.vulnerability.reference = getRandomFromArray(vulnerabilityReference);
        alert.data.vulnerability.title = getRandomFromArray(vulnerabilityTitle);
    }
    
    if (params.osquery) {
        alert.rule.groups.push("osquery");
        alert.data.osquery = {};

        alert.data.osquery.name = getRandomFromArray(osqueryName);
        alert.data.osquery.action = getRandomFromArray(osqueryAction);
        alert.data.osquery.calendarTime = randomDate();
        alert.data.osquery.pack = getRandomFromArray(osqueryPack);
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
        alert.rule.pci_dss = [getRandomFromArray(pci_dss)];
    }
    if (params.gdpr || params.regulatory_compliance || (params.random_probability_regulatory_compliance && randomProbability(params.random_probability_regulatory_compliance))) {
        alert.rule.gdpr = [getRandomFromArray(gdpr)];
    }
    if (params.gpg13 || params.regulatory_compliance || (params.random_probability_regulatory_compliance && randomProbability(params.random_probability_regulatory_compliance))) {
        alert.rule.gpg13 = [getRandomFromArray(gpg13)];
    }
    if (params.hipaa || params.regulatory_compliance || (params.random_probability_regulatory_compliance && randomInterval(params.random_probability_regulatory_compliance))) {
        alert.rule.hipaa = [getRandomFromArray(hipaa)];
    }
    if (params.nist_800_83 || params.regulatory_compliance || (params.random_probability_regulatory_compliance && randomInterval(params.random_probability_regulatory_compliance))) {
        alert.rule.nist_800_53 = [getRandomFromArray(nist_800_53)];
    }

    return alert;
}

/**
 * Get a number within a range 
 * @param {number} min - Minimum limit
 * @param {number} max - Maximum limit
 * @returns {number} - Randomized number in interval
 */
function randomInterval(min, max) {
    return Math.floor(Math.random() * (max - (min - 1))) + min;
}

/**
 * Get random Mitre ID
 * @returns {[]} - Random Mitre IDs
 */
function generateRandomMitreNumberId() {
    let random = randomInterval(1, 3);
    let array = [];

    for (let i = 0; i < random; i++) {
        array.push(mitreId[randomInterval(0, mitreId.length - 1)]);
    }

    array.sort();
    return Array.from(new Set(array));
}

/**
 * Get random Mitre Tactics
 * @returns {[]} - Random mitre tactics
 */
function generateRandomMitreNumberTactics() {
    let random = randomInterval(1, mitreTactics.length);
    let array = [];

    for (let i = 0; i < random; i++) {
        array.push(mitreTactics[randomInterval(0, mitreTactics.length - 1)]);
    }

    return Array.from(new Set(array));
}

/**
 * Generate random alerts
 * @param {*} params 
 * @param {number} numAlerts - Define number of alerts
 * @return {*} - Random generated alerts defined with params
 */
function generateAlerts(params, numAlerts) {
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
function randomDate() {

    let nowTimestamp = Date.now();
    let time = randomInterval(0, 604800000); // Random 7 days in miliseconds

    let unix_timestamp = nowTimestamp - time; // Last 7 days from now

    let lastWeek = new Date(unix_timestamp);

    let randomMonth = lastWeek.getMonth() + 1;
    let randomDay = lastWeek.getDate();
    let randomYear = lastWeek.getFullYear();
    let randomHour = lastWeek.getHours();
    let randomMinutes = lastWeek.getMinutes();
    let randomSeconds = lastWeek.getSeconds();
    let randomMilliSeconds = lastWeek.getMilliseconds();

    let randomMonthFormatted = ("00" + randomMonth.toString()).slice(-2);
    let randomDayFormatted = ("00" + randomDay.toString()).slice(-2);
    let randomYearFormatted = ("0000" + randomYear.toString()).slice(-4);
    let randomHourFormatted = ("00" + randomHour.toString()).slice(-2);
    let randomMinutesFormatted = ("00" + randomMinutes.toString()).slice(-2);
    let randomSecondsFormatted = ("00" + randomSeconds.toString()).slice(-2);
    let randomMilliSecondsFormatted = ("000" + randomMilliSeconds.toString()).slice(-3);

    return randomYearFormatted + "-" + randomMonthFormatted + "-" + randomDayFormatted + "T" + randomHourFormatted + ":" + randomMinutesFormatted + ":" + randomSecondsFormatted + "." + randomMilliSecondsFormatted + "+0000";
}

/**
 * Return a random probability
 * @param {number} probability 
 * @param {number[=100]} maximum 
 */
function randomProbability(probability, maximum = 100){
    return randomInterval(0,maximum) <= probability
}

export {
    generateAlert,
    generateAlerts
};

/* Use:
    generateAlert(params)
    generateAlerts(params, numberAlerts)

Examples:

    - Generate syscheck (Integrity monitoring) sample alert
    generateAlert({syscheck: true});
    
    - Generate syscheck alert with PCI DSS
    generateAlert({syscheck: true, pci_dss: true});
    
    - Generate OpenSCAP alert with manager name and cluster info
    generateAlert({openscap: true, manager: {name: 'mymanager'}, cluster: {name: 'mycluster', node: 'mynode'}});

    - Generate 1000 random alerts of Osquery
    generateAlerts({osquery: true}, 1000);

    - Generate 1000 random alerts of PCI DSS with manager name and cluster info
    generateAlerts({pci_dss: true, manager: {name: 'mymanager'}, cluster: {name: 'mycluster', node: 'mynode'}}, 1000);
*/
