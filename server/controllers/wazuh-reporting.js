/*
 * Wazuh app - Class for Wazuh reporting controller
 * Copyright (C) 2018 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import path          from 'path';
import fs            from 'fs';
import descriptions  from '../reporting/tab-description';
import * as TimSort  from 'timsort';
import rawParser     from '../reporting/raw-parser';
import PdfPrinter    from 'pdfmake/src/printer';
import ErrorResponse from './error-response';
import sanitize      from '../lib/sanitize-html';

import VulnerabilityRequest from '../reporting/vulnerability-request';
import OverviewRequest      from '../reporting/overview-request';
import RootcheckRequest     from '../reporting/rootcheck-request';
import PciRequest           from '../reporting/pci-request';
import GdprRequest          from '../reporting/gdpr-request';
import AuditRequest         from '../reporting/audit-request';
import SyscheckRequest      from '../reporting/syscheck-request';

import PCI  from '../integration-files/pci-requirements';
import GDPR from '../integration-files/gdpr-requirements';

import PdfTable from '../reporting/generic-table';

import WazuhApi from './wazuh-api';

import { AgentsVisualizations, OverviewVisualizations } from '../integration-files/visualizations';

export default class WazuhReportingCtrl {
    constructor(server){
        this.server = server;
        this.fonts = {
            Roboto: {
                normal: path.join(__dirname, '../../public/utils/roboto/Roboto-Regular.ttf'),
                bold: path.join(__dirname, '../../public/utils/roboto/Roboto-Bold.ttf'),
                italics: path.join(__dirname, '../../public/utils/roboto/Roboto-Italic.ttf'),
                bolditalics: path.join(__dirname, '../../public/utils/roboto/Roboto-BoldItalic.ttf')
            }
        };

        this.vulnerabilityRequest = new VulnerabilityRequest(this.server);
        this.overviewRequest      = new OverviewRequest(this.server);
        this.rootcheckRequest     = new RootcheckRequest(this.server);
        this.pciRequest           = new PciRequest(this.server);
        this.gdprRequest          = new GdprRequest(this.server);
        this.auditRequest         = new AuditRequest(this.server);
        this.syscheckRequest      = new SyscheckRequest(this.server);

        this.printer = new PdfPrinter(this.fonts);

        this.dd = {
            styles: {
                rightme: {
                    alignment: 'right'
                },
                centerme: {
                    alignment: 'center'
                },
                title: {
                    fontSize: 22,
                    bold: true
                },
                subtitle: {
                    fontSize: 16,
                    bold: true
                },
                subtitlenobold: {
                    fontSize: 12
                },
                quote: {
                    color: 'gray',
                    italics: true
                },
                gray: {
                    color: 'gray'
                },
                bold: {
                    bold: true
                }
            },
            header: {
                columns: [
                    { image: path.join(__dirname, '../../public/img/logo.png'), fit: [190, 90], style: 'rightme', margin: [0, 10, 0, 60] }
                ]
            },
            content: [
                
            ],
            footer: {
                columns: [
                    { text: 'Copyright © 2018 Wazuh, Inc.', alignment: 'right', fontSize: 10, margin: [0, 0, 10, 0] }
                ]
            },
            pageBreakBefore: function (currentNode, followingNodesOnPage, nodesOnNextPage, previousNodesOnPage) {
                //check if signature part is completely on the last page, add pagebreak if not
                if (currentNode.id === 'signature' && (currentNode.pageNumbers.length != 1 || currentNode.pageNumbers[0] != currentNode.pages)) {
                    return true;
                }
                //check if last paragraph is entirely on a single page, add pagebreak if not
                else if (currentNode.id === 'closingParagraph' && currentNode.pageNumbers.length != 1) {
                    return true;
                }
                return false;
            }
        };

        this.apiRequest = new WazuhApi(server);
    }

    renderTables(tables) {
        for (const table of tables) {
            const rowsparsed = rawParser(table.rawResponse, table.columns);
            if (Array.isArray(rowsparsed) && rowsparsed.length) {
                const rows = rowsparsed.length > 100 ? rowsparsed.slice(0,99) : rowsparsed;
                this.dd.content.push({ text: table.title, style: 'bold', pageBreak: 'before' });

                const full_body = [];
                const sortFunction = (a, b) => parseInt(a[a.length - 1]) < parseInt(b[b.length - 1]) ?
                    1 :
                    parseInt(a[a.length - 1]) > parseInt(b[b.length - 1]) ?
                        -1 :
                        0;
                TimSort.sort(rows, sortFunction);
                const widths = Array(table.columns.length-1).fill('auto');
                widths.push('*');
                
                full_body.push(table.columns, ...rows);
                this.dd.content.push({
                    fontSize:8,
                    table: {
                        widths,
                        body: full_body
                    },
                    layout: 'lightHorizontalLines'
                });
                this.dd.content.push('\n');
            }
        }
    }

    renderTimeRange(from,to) {
        const str = `${from} to ${to}`;

        this.dd.content.push({
            columns: [
                {

                    image: path.join(__dirname, '../reporting/clock.png'),
                    width: 10,
                    height: 10
                },
                {
                    margin: [5, 0, 0, 0],
                    text: str,
                    fontSize: 10
                }
            ]
        });
        this.dd.content.push('\n');
    }

    renderFilters(filters, searchBar) {
        let str = '';

        const len = filters.length;
        for (let i = 0; i < len; i++) {
            const filter = filters[i];
            
            str += i === len - 1 ?
                (filter.meta.negate ? 'NOT ' : '' ) + filter.meta.key + ': ' + filter.meta.value :
                (filter.meta.negate ? 'NOT ' : '' ) + filter.meta.key + ': ' + filter.meta.value + ' AND ';
        }

        if (searchBar) {
            str += ' AND ' + searchBar;
        }

        this.dd.content.push({
            columns: [{
                image: path.join(__dirname, '../reporting/filters.png'),
                width: 10,
                height: 10
            },{
                margin: [5, 0, 0, 0],
                text: str,
                fontSize: 10
            }]
        });
        this.dd.content.push('\n');
        
        return str;
    }

    async renderHeader(section, tab, isAgents,apiId) {
        try {
            if (section && typeof section === 'string') {
                this.dd.content.push({
                    text: descriptions[tab].title + ' report', style: 'title'
                });
                this.dd.content.push('\n');
            }
    
            if(isAgents && typeof isAgents === 'string'){
                const status = await this.apiRequest.makeGenericRequest('GET',`/agents/${isAgents}`,{select:'status'},apiId);
                if(status && status.data && typeof status.data.status === 'string' && status.data.status !== 'Active') {
                    this.dd.content.push({ text: `Warning. Agent is ${status.data.status.toLowerCase()}`, style: 'bold' });
                    this.dd.content.push('\n');
                }
                await this.buildAgentsTable([isAgents],apiId);
            }
    
            if(descriptions[tab] && descriptions[tab].description){
                this.dd.content.push({ text: descriptions[tab].description, style: 'quote' });
                this.dd.content.push('\n');
            }
       
            return;
        } catch (error) {
            return Promise.reject(error);
        }
    }

    checkTitle(item, isAgents, tab) {
        const title = isAgents ?
                      AgentsVisualizations[tab].filter(v => v._id === item.id) :
                      OverviewVisualizations[tab].filter(v => v._id === item.id);
        return title;
    }

    renderVisualizations(array, isAgents, tab) {
        const single_vis = array.filter(item => item.width >= 600);
        const double_vis = array.filter(item => item.width < 600);

        for (const item of single_vis) {
            const title = this.checkTitle(item, isAgents, tab);
            this.dd.content.push({ text: title[0]._source.title, style: 'bold' });
            this.dd.content.push({ columns: [ { image: item.element, width: 500 } ] });
            this.dd.content.push('\n');
        }

        let pair = [];

        for (const item of double_vis) {
            pair.push(item);
            if (pair.length === 2) {
                const title_1 = this.checkTitle(pair[0], isAgents, tab);
                const title_2 = this.checkTitle(pair[1], isAgents, tab);

                this.dd.content.push({
                    columns: [
                        { text: title_1[0]._source.title, style: 'bold', width: 280 },
                        { text: title_2[0]._source.title, style: 'bold', width: 280 }
                    ]
                });

                this.dd.content.push({
                    columns: [
                        { image: pair[0].element, width: 270 },
                        { image: pair[1].element, width: 270 }
                    ]
                });

                this.dd.content.push('\n');
                pair = [];
            }

        }

        if (double_vis.length % 2 !== 0) {
            const item = double_vis[double_vis.length - 1];
            const title = this.checkTitle(item, isAgents, tab);
            this.dd.content.push({
                columns: [
                    { text: title[0]._source.title, style: 'bold', width: 280 }
                ]
            });
            this.dd.content.push({ columns: [{ image: item.element, width: 280 }] });
            this.dd.content.push('\n');
        }
    }

    async buildAgentsTable (ids, apiId) {
        try {
            const rows = [];
            for(const item of ids){
                let data = false;
                try {
                    const agent = await this.apiRequest.makeGenericRequest('GET',`/agents/${item}`,{},apiId);
                    if(agent && agent.data) {
                        data = {};
                        Object.assign(data,agent.data);
                    }
                } catch (error) {
                    continue;
                }
                const str = Array(6).fill('---');
                str[0] = item;
                if(data && data.name) str[1] = data.name;
                if(data && data.ip) str[2] = data.ip;
                if(data && data.version) str[3] = data.version;
                if(data && data.manager_host) str[4] = data.manager_host;
                if(data && data.os && data.os.name && data.os.version) str[5] = `${data.os.name} ${data.os.version}`;
                rows.push(str);                        
            }

            PdfTable(this.dd,rows,['ID','Name','IP','Version','Manager','OS'],null,null,true);

            this.dd.content.push('\n');
        } catch (error) {
            return Promise.reject(error);
        }
    } 

    async extendedInformation(section, tab, apiId, from, to, filters, pattern = 'wazuh-alerts-3.x-*', agent = null) {
        try {
            if(section === 'agents' && !agent) { 
                throw new Error('Reporting for specific agent needs an agent ID in order to work properly');
            }

            const agents = await this.apiRequest.makeGenericRequest('GET','/agents',{limit:1},apiId);
            const totalAgents = agents.data.totalItems;

            if(section === 'overview' && tab === 'vuls'){                
                const low      = await this.vulnerabilityRequest.uniqueSeverityCount(from,to,'Low',filters,pattern);
                const medium   = await this.vulnerabilityRequest.uniqueSeverityCount(from,to,'Medium',filters,pattern);
                const high     = await this.vulnerabilityRequest.uniqueSeverityCount(from,to,'High',filters,pattern);
                const critical = await this.vulnerabilityRequest.uniqueSeverityCount(from,to,'Critical',filters,pattern);

                this.dd.content.push({ text: 'Summary', style: 'bold' });
                const ulcustom = [`${critical+high+medium+low} of ${totalAgents} agents have vulnerabilities.`];
                if(critical) ulcustom.push(`${critical} of ${totalAgents} agents have critical vulnerabilities.`);
                if(high) ulcustom.push(`${high} of ${totalAgents} agents have high vulnerabilities.`);
                if(medium) ulcustom.push(`${medium} of ${totalAgents} agents have medium vulnerabilities.`);
                if(low) ulcustom.push(`${low} of ${totalAgents} agents have low vulnerabilities.`);

                this.dd.content.push({
                    ul: ulcustom
                });
                this.dd.content.push('\n');

                const lowRank      = await this.vulnerabilityRequest.topAgentCount(from,to,'Low',filters,pattern);
                const mediumRank   = await this.vulnerabilityRequest.topAgentCount(from,to,'Medium',filters,pattern);
                const highRank     = await this.vulnerabilityRequest.topAgentCount(from,to,'High',filters,pattern);
                const criticalRank = await this.vulnerabilityRequest.topAgentCount(from,to,'Critical',filters,pattern);

                if(criticalRank.length){
                    this.dd.content.push({ text: 'Top 3 agents with critical severity vulnerabilities', style: 'bold' });
                    await this.buildAgentsTable(criticalRank,apiId);
                    this.dd.content.push('\n');
                }

                if(highRank.length){
                    this.dd.content.push({ text: 'Top 3 agents with high severity vulnerabilities', style: 'bold' });
                    await this.buildAgentsTable(highRank,apiId);
                    this.dd.content.push('\n');
                }

                if(mediumRank.length){
                    this.dd.content.push({ text: 'Top 3 agents with medium severity vulnerabilities', style: 'bold' });
                    await this.buildAgentsTable(mediumRank,apiId);
                    this.dd.content.push('\n');  
                }

                if(lowRank.length){
                    this.dd.content.push({ text: 'Top 3 agents with low severity vulnerabilities', style: 'bold' });
                    await this.buildAgentsTable(lowRank,apiId);
                    this.dd.content.push('\n');
                }

                const cveRank = await this.vulnerabilityRequest.topCVECount(from,to,filters,pattern);
                if(cveRank.length){
                    this.dd.content.push({ text: 'Top 3 CVE', style: 'bold' });
                    this.dd.content.push({ ol: cveRank });
                    this.dd.content.push('\n');
                }
            }                    

            if(section === 'overview' && tab === 'general'){
                const level15Rank = await this.overviewRequest.topLevel15(from,to,filters,pattern);
                if(level15Rank.length){
                    this.dd.content.push({ text: 'Top 3 agents with level 15 alerts', style: 'bold' });
                    await this.buildAgentsTable(level15Rank,apiId);
                }
            }

            if(section === 'overview' && tab === 'pm'){
                const top5RootkitsRank = await this.rootcheckRequest.top3RootkitsDetected(from,to,filters,pattern);
                if(top5RootkitsRank.length){
                    this.dd.content.push({ text: 'Most common rootkits found along your agents', style: 'bold' });
                    this.dd.content.push('\n');
                    this.dd.content.push({ text: 'Rootkits are a set of software tools that enable an unauthorized user to gain control of a computer system without being detected.',style: 'quote'});
                    this.dd.content.push('\n');
                    this.dd.content.push({ ol: top5RootkitsRank });
                    this.dd.content.push('\n');
                }

                const hiddenPids = await this.rootcheckRequest.agentsWithHiddenPids(from,to,filters,pattern);
                this.dd.content.push({ text: `${hiddenPids} of ${totalAgents} agents have hidden processes`, style: 'bold' });
                this.dd.content.push({ text: `This situation is dangerous and it means ${hiddenPids} agents may have been infected by some kind of malware.`, style: 'quote' });
                this.dd.content.push('\n');

                const hiddenPorts = await this.rootcheckRequest.agentsWithHiddenPorts(from,to,filters,pattern);
                this.dd.content.push({ text: `${hiddenPorts} of ${totalAgents} agents have hidden ports`, style: 'bold' });
                this.dd.content.push({ text: `Netstat is not showing some ports but they are replying from ping command.`, style: 'quote' });
                this.dd.content.push('\n');
            }
            
            if(['overview','agents'].includes(section) && tab === 'pci'){
                const topPciRequirements = await this.pciRequest.topPCIRequirements(from,to,filters,pattern);
                this.dd.content.push({ text: 'Most common PCI DSS requirements alerts found', style: 'bold' });
                this.dd.content.push('\n');
                for(const item of topPciRequirements){
                    const rules = await this.pciRequest.getRulesByRequirement(from,to,filters,item,pattern);
                    this.dd.content.push({ text: `Requirement ${item}`, style: 'bold'});
                    this.dd.content.push('\n');
                    const description = sanitize(PCI[item]);
                    if(description) {
                        this.dd.content.push({ text: `"${description}"`, style: 'quote' });
                        this.dd.content.push('\n');
                    }
                    PdfTable(this.dd,rules,['Rule ID','Description'],['ruleId','ruleDescription'],`Top rules regarding to requirement ${item}`);
                    this.dd.content.push('\n');
                }
            }

            if(['overview','agents'].includes(section) && tab === 'gdpr'){
                const topGdprRequirements = await this.gdprRequest.topGDPRRequirements(from,to,filters,pattern);
                this.dd.content.push({ text: 'Most common GDPR requirements alerts found', style: 'subtitle' });
                this.dd.content.push('\n');
                for(const item of topGdprRequirements){
                    const rules = await this.gdprRequest.getRulesByRequirement(from,to,filters,item,pattern);
                    this.dd.content.push({ text: `Requirement ${item}`, style: 'bold'});
                    this.dd.content.push('\n');
                    const description = sanitize(GDPR[item]);
                    if(description) {
                        this.dd.content.push({ text: `"${description}"`, style: 'quote' });
                        this.dd.content.push('\n');
                    }
                    PdfTable(this.dd,rules,['Rule ID','Description'],['ruleId','ruleDescription'],`Top rules regarding to requirement ${item}`);
                    this.dd.content.push('\n');
                }
                this.dd.content.push('\n');
            }

            if(section === 'overview' && tab === 'audit'){
                const auditAgentsNonSuccess = await this.auditRequest.getTop3AgentsSudoNonSuccessful(from,to,filters,pattern);
                if(auditAgentsNonSuccess.length) {
                    this.dd.content.push({ text: 'Agents with high number of failed sudo commands', style: 'bold' });
                    await this.buildAgentsTable(auditAgentsNonSuccess,apiId);
                }
                const auditAgentsFailedSyscall = await this.auditRequest.getTop3AgentsFailedSyscalls(from,to,filters,pattern);
                if(auditAgentsFailedSyscall.length) {
                    this.dd.content.push({ text: 'Syscalls that usually are failing', style: 'bold' });
                    this.dd.content.push({ text: 'The next table shows the top failing syscall for the top 3 agents that have more failed syscalls.', style: 'quote' });
                    PdfTable(this.dd,auditAgentsFailedSyscall,['Agent ID','Syscall ID','Syscall'],['agent','syscall.id','syscall.syscall'],null,false);
                    this.dd.content.push('\n');
                }
            }   

            if(section === 'overview' && tab === 'fim') {
                const rules = await this.syscheckRequest.top3Rules(from,to,filters,pattern);
                this.dd.content.push({ text: 'Top 3 FIM rules', style: 'bold' });
                this.dd.content.push({ 
                    text: 'Top 3 rules that are generating most alerts.', 
                    style: 'quote' 
                });
                PdfTable(this.dd,rules,['Rule ID','Description'],['ruleId','ruleDescription'],null);

                const agents = await this.syscheckRequest.top3agents(from,to,filters,pattern);
                this.dd.content.push({ text: 'Agents with suspicious FIM activity', style: 'bold' });
                this.dd.content.push({ 
                    text: 'Top 3 agents that have most FIM alerts from level 7 to level 15. Take care about them.', 
                    style: 'quote' 
                });
                await this.buildAgentsTable(agents,apiId);
            }

            if(section === 'agents' && tab === 'pm'){
                const database = await this.apiRequest.makeGenericRequest('GET',`/rootcheck/${agent}`,{limit:15},apiId);
                const cis = await this.apiRequest.makeGenericRequest('GET',`/rootcheck/${agent}/cis`,{},apiId);
                const pci = await this.apiRequest.makeGenericRequest('GET',`/rootcheck/${agent}/pci`,{},apiId);
                const lastScan = await this.apiRequest.makeGenericRequest('GET',`/rootcheck/${agent}/last_scan`,{},apiId);

                if(lastScan && lastScan.data){
                    if(lastScan.data.start && lastScan.data.end) {
                        this.dd.content.push({ text: `Last policy monitoring scan was from ${lastScan.data.start} to ${lastScan.data.end}.` });
                    } else if(lastScan.data.start){
                        this.dd.content.push({ text: `Policy monitoring scan is currently in progress for this agent (started on ${lastScan.data.start}.` });
                    } else {
                        this.dd.content.push({ text: `Policy monitoring scan is currently in progress for this agent.` });
                    }
                    this.dd.content.push('\n');
                }

                if(database && database.data && database.data.items){
                    PdfTable(this.dd,database.data.items,['Date','Status','Event'],['readDay','status','event'],'Last entries from policy monitoring scan');
                    this.dd.content.push('\n');
                }

                if(pci && pci.data && pci.data.items) {
                    this.dd.content.push({ text: 'Rules being fired due to PCI requirements', style: 'bold', pageBreak: 'before' });
                    for(const item of pci.data.items){
                        const rules = await this.pciRequest.getRulesByRequirement(from,to,filters,item,pattern);
                        this.dd.content.push({ text: `Requirement ${item}`, style: 'bold'});
                        this.dd.content.push('\n');
                        const description = sanitize(PCI[item]);
                        if(description) {
                            this.dd.content.push({ text: `"${description}"`, style: 'quote' });
                            this.dd.content.push('\n');
                        }
                        PdfTable(this.dd,rules,['Rule ID','Description'],['ruleId','ruleDescription']);
                        this.dd.content.push('\n');
                    }
                }

                const top5RootkitsRank = await this.rootcheckRequest.top5RootkitsDetected(from,to,filters,pattern,10);
                if(top5RootkitsRank.length){
                    this.dd.content.push({ text: 'Rootkits files found', style: 'bold' });
                    this.dd.content.push('\n');
                    this.dd.content.push({ text: 'Rootkits are a set of software tools that enable an unauthorized user to gain control of a computer system without being detected.',style: 'quote'});
                    this.dd.content.push('\n');
                    this.dd.content.push({ ol: top5RootkitsRank });
                    this.dd.content.push('\n');
                }

            }

            if(section === 'agents' && tab === 'audit'){
                const auditFailedSyscall = await this.auditRequest.getTopFailedSyscalls(from,to,filters,pattern);
                PdfTable(this.dd,auditFailedSyscall,['Syscall ID','Syscall'],['id','syscall'],'Syscalls that usually are failing');
                this.dd.content.push('\n');
            }

            if(section === 'agents' && tab === 'fim'){
                const lastScan = await this.apiRequest.makeGenericRequest('GET',`/syscheck/${agent}/last_scan`,{},apiId);

                if(lastScan && lastScan.data){
                    if(lastScan.data.start && lastScan.data.end) {
                        this.dd.content.push({ text: `Last file integrity monitoring scan was from ${lastScan.data.start} to ${lastScan.data.end}.` });
                    } else if(lastScan.data.start){
                        this.dd.content.push({ text: `File integrity monitoring scan is currently in progress for this agent (started on ${lastScan.data.start}.` });
                    } else {
                        this.dd.content.push({ text: `File integrity monitoring scan is currently in progress for this agent.` });
                    }
                    this.dd.content.push('\n');
                }

                const lastTenDeleted = await this.syscheckRequest.lastTenDeletedFiles(from,to,filters,pattern);
                PdfTable(this.dd,lastTenDeleted,['Path','Date'],['path','date'],'Last ten deleted files');
                this.dd.content.push('\n');

                const lastTenModified = await this.syscheckRequest.lastTenModifiedFiles(from,to,filters,pattern);
                PdfTable(this.dd,lastTenModified,['Path','Date'],['path','date'],'Last ten modified files');
                this.dd.content.push('\n');
            }

            if(section === 'agents' && tab === 'syscollector'){

                const hardware = await this.apiRequest.makeGenericRequest('GET',`/syscollector/${agent}/hardware`,{},apiId);

                if(hardware.data){
                    this.dd.content.push({ text: 'Hardware information', style: 'bold' });
                    this.dd.content.push('\n');
                    const ulcustom = [];
                    if(hardware.data.cpu && hardware.data.cpu.cores) ulcustom.push(hardware.data.cpu.cores + ' cores ');
                    if(hardware.data.cpu && hardware.data.cpu.name) ulcustom.push(hardware.data.cpu.name);
                    if(hardware.data.ram && hardware.data.ram.total) ulcustom.push(Math.round(((hardware.data.ram.total/1024)/1024),2) + 'GB RAM');
                    this.dd.content.push({
                        ul: ulcustom
                    });
                    this.dd.content.push('\n');                    
                }

                const os = await this.apiRequest.makeGenericRequest('GET',`/syscollector/${agent}/os`,{},apiId);

                if(os.data){
                    this.dd.content.push({ text: 'OS information', style: 'bold' });
                    this.dd.content.push('\n');
                    const ulcustom = [];
                    if(os.data.sysname) ulcustom.push(os.data.sysname);
                    if(os.data.version) ulcustom.push(os.data.version);
                    if(os.data.architecture) ulcustom.push(os.data.architecture);
                    if(os.data.release) ulcustom.push(os.data.release);
                    if(os.data.os && os.data.os.name && os.data.os.version) ulcustom.push(os.data.os.name + ' ' + os.data.os.version);
                    this.dd.content.push({
                        ul: ulcustom
                    });
                    this.dd.content.push('\n');
                }

                const topCriticalPackages = await this.vulnerabilityRequest.topPackages(from,to,'Critical',filters,pattern);
                const topHighPackages     = await this.vulnerabilityRequest.topPackages(from,to,'High',filters,pattern);
   
                const affected = [];
                affected.push(...topCriticalPackages,...topHighPackages);
                if(affected.length) {
                    this.dd.content.push({ text: 'Packages with known vulnerabilities',style: 'bold'});
                    this.dd.content.push('\n');
                    this.dd.content.push({ text: 'Vulnerable packages found in the last 24 hours. These packages are installed on your agent, take care about them because they are vulnerable.',style: 'quote'});
                    this.dd.content.push('\n');
                    PdfTable(this.dd,affected,['Package','Severity'],['package','severity'],null);
                    this.dd.content.push('\n');
                }
            }

            return false;
        } catch (error) {
            return Promise.reject(error);
        }
    }
    
    async report(req, reply) {
        try {

            // Init
            this.printer    = new PdfPrinter(this.fonts);
            this.dd.content = [];
            if (!fs.existsSync(path.join(__dirname, '../../../../optimize/wazuh-reporting'))) {
                fs.mkdirSync(path.join(__dirname, '../../../../optimize/wazuh-reporting'));
            }
            
            if (req.payload && req.payload.array) {
                const tab = req.payload.tab;

                await this.renderHeader(req.payload.section, tab, req.payload.isAgents, req.headers.id);

                if (tab !== 'syscollector' && req.payload.time) {
                    this.renderTimeRange(req.payload.time.from, req.payload.time.to);
                }

                let filters = false;
                if (req.payload.filters) {
                    filters = this.renderFilters(req.payload.filters, req.payload.searchBar);
                }

                if (req.payload.time || tab === 'syscollector') {
                        await this.extendedInformation(
                            req.payload.section,
                            req.payload.tab,
                            req.headers.id,
                            tab === 'syscollector' ? req.payload.time.from : new Date(req.payload.time.from)-1,
                            tab === 'syscollector' ? req.payload.time.to : new Date(req.payload.time.to)-1,
                            tab === 'syscollector' ? filters + ' AND rule.groups: "vulnerability-detector"' : filters,
                            req.headers.pattern,
                            req.payload.isAgents
                        );
                } 

                tab !== 'syscollector' && this.renderVisualizations(req.payload.array, req.payload.isAgents, tab)

                if (tab !== 'syscollector' && req.payload.tables) {
                    this.renderTables(req.payload.tables);                    
                }

                const pdfDoc = this.printer.createPdfKitDocument(this.dd);
                await pdfDoc.pipe(fs.createWriteStream(path.join(__dirname, '../../../../optimize/wazuh-reporting/' + req.payload.name)));
                pdfDoc.end();
            }
            return reply({ error: 0, data: null });
        } catch (error) {
            // Delete generated file if an error occurred
            if (req && req.payload && req.payload.name &&
                fs.existsSync(path.join(__dirname, '../../../../optimize/wazuh-reporting/' + req.payload.name))
            ) {
                fs.unlinkSync(path.join(__dirname, '../../../../optimize/wazuh-reporting/' + req.payload.name));
            }
            return ErrorResponse(error.message || error, 5029, 500, reply);
        }
    }

    async getReports(req,reply) {
        try {
            if (!fs.existsSync(path.join(__dirname, '../../../../optimize/wazuh-reporting'))) {
                fs.mkdirSync(path.join(__dirname, '../../../../optimize/wazuh-reporting'));
            }
            const list = [];
            const reportDir = path.join(__dirname, '../../../../optimize/wazuh-reporting');
            const sortFunction = (a,b) => a.date < b.date ? 1 : a.date > b.date ? -1 : 0;
            fs.readdirSync(reportDir).forEach(file => {
                const stats = fs.statSync(reportDir + '/' + file);
                file = {
                    name: file,
                    size: stats.size,
                    date: stats.birthtime
                };
                list.push(file);
            });
            TimSort.sort(list,sortFunction)
            return reply({list: list});
        } catch (error) {
            return ErrorResponse(error.message || error, 5031, 500, reply);
        }
    }

    async getReportByName(req,reply) {
        try {
            return reply.file(path.join(__dirname, '../../../../optimize/wazuh-reporting/' + req.params.name));
        } catch (error) {
            return ErrorResponse(error.message || error, 5030, 500, reply);
        }
    }

    async deleteReportByName(req,reply) {
        try {
            fs.unlinkSync(path.join(__dirname, '../../../../optimize/wazuh-reporting/' + req.params.name));
            return reply({error:0});
        } catch (error) {
            return ErrorResponse(error.message || error, 5032, 500, reply);
        }
    }

}