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

import VulnerabilityRequest from '../reporting/vulnerability-request';
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
                }
            },
            header: {
                columns: [
                    { image: path.join(__dirname, '../../public/img/logo.png'), fit: [190, 90], style: 'rightme', margin: [0, 10, 0, 0] },
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
                this.dd.content.push({ text: table.title, style: 'subtitlenobold', pageBreak: 'before' });

                const full_body = [];
                const sortFunction = (a, b) => parseInt(a[a.length - 1]) < parseInt(b[b.length - 1]) ?
                    1 :
                    parseInt(a[a.length - 1]) > parseInt(b[b.length - 1]) ?
                        -1 :
                        0;
                TimSort.sort(rows, sortFunction);
                const widths = Array(table.columns.length).fill('*');
                
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

    renderHeader(section, tab, isAgents) {
        if (section && typeof section === 'string') {
            this.dd.content.push({
                text: descriptions[tab].title + ' report', style: 'title'
            });
            this.dd.content.push('\n');
        }

        if(isAgents && typeof isAgents === 'string'){
            this.dd.content.push({text: `Report for agent ${isAgents}`, style:'subtitlenobold'});
            this.dd.content.push('\n');
        }

        if(descriptions[tab] && descriptions[tab].description){
            this.dd.content.push({ text: descriptions[tab].description, style: 'quote' });
            this.dd.content.push('\n');
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
            this.dd.content.push({ text: title[0]._source.title, style: 'subtitlenobold' });
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
                        { text: title_1[0]._source.title, style: 'subtitlenobold', width: 280 },
                        { text: title_2[0]._source.title, style: 'subtitlenobold', width: 280 }
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
                    { text: title[0]._source.title, style: 'subtitlenobold', width: 280 }
                ]
            });
            this.dd.content.push({ columns: [{ image: item.element, width: 280 }] });
            this.dd.content.push('\n');
        }
    }

    async extendedInformation(section, tab, apiId, from, to, filters) {
        try {
            if(section === 'overview' && tab === 'vuls'){
                const agents = await this.apiRequest.makeGenericRequest('GET','/agents',{limit:1},apiId);
                const totalAgents = agents.data.totalItems;
                
                const low      = await this.vulnerabilityRequest.uniqueSeverityCount(from,to,'Low',filters);
                const medium   = await this.vulnerabilityRequest.uniqueSeverityCount(from,to,'Medium',filters);
                const high     = await this.vulnerabilityRequest.uniqueSeverityCount(from,to,'High',filters);
                const critical = await this.vulnerabilityRequest.uniqueSeverityCount(from,to,'Critical',filters);

                this.dd.content.push({ text: 'Count summary', style: 'subtitle' });
                this.dd.content.push({ text: `- ${critical+high+medium+low}/${totalAgents} agents have vulnerabilities.`, style: 'gray' });
                this.dd.content.push({ text: `- ${critical}/${totalAgents} agents have critical vulnerabilities.`, style: 'gray' });
                this.dd.content.push({ text: `- ${high}/${totalAgents} agents have high vulnerabilities.`, style: 'gray' });
                this.dd.content.push({ text: `- ${medium}/${totalAgents} agents have medium vulnerabilities.`, style: 'gray' });
                this.dd.content.push({ text: `- ${low}/${totalAgents} agents have low vulnerabilities.`, style: 'gray' });
                this.dd.content.push('\n');

                const lowRank      = await this.vulnerabilityRequest.topAgentCount(from,to,'Low',filters);
                const mediumRank   = await this.vulnerabilityRequest.topAgentCount(from,to,'Medium',filters);
                const highRank     = await this.vulnerabilityRequest.topAgentCount(from,to,'High',filters);
                const criticalRank = await this.vulnerabilityRequest.topAgentCount(from,to,'Critical',filters);

                if(criticalRank.length){
                    this.dd.content.push({ text: 'Top 3 agents with critical severity vulnerabilities', style: 'subtitle' });
                    for(const item of criticalRank){
                        this.dd.content.push({ text: `- Agent ${item}`, style: 'gray' });
                    }
                    this.dd.content.push('\n');
                }

                if(highRank.length){
                    this.dd.content.push({ text: 'Top 3 agents with high severity vulnerabilities', style: 'subtitle' });
                    for(const item of highRank){
                        this.dd.content.push({ text: `- Agent ${item}`, style: 'gray' });
                    }
                    this.dd.content.push('\n');
                }

                if(mediumRank.length){
                    this.dd.content.push({ text: 'Top 3 agents with medium severity vulnerabilities', style: 'subtitle' });
                    for(const item of mediumRank){
                        this.dd.content.push({ text: `- Agent ${item}`, style: 'gray'});
                    }
                    this.dd.content.push('\n');  
                }

                if(lowRank.length){
                    this.dd.content.push({ text: 'Top 3 agents with low severity vulnerabilities', style: 'subtitle' });
                    for(const item of lowRank){
                        this.dd.content.push({ text: `- Agent ${item}`, style: 'gray'});
                    }
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

                this.renderHeader(req.payload.section, tab, req.payload.isAgents);

                if (req.payload.time) {
                    this.renderTimeRange(req.payload.time.from, req.payload.time.to);
                }
                
                let filters = false;
                if (req.payload.filters) {
                    filters = this.renderFilters(req.payload.filters, req.payload.searchBar);
                }

                if (req.payload.time) {
                    await this.extendedInformation(
                            req.payload.section,
                            req.payload.tab,
                            req.headers.id,
                            new Date(req.payload.time.from)-1,
                            new Date(req.payload.time.to)-1,
                            filters
                        );
                }

                this.renderVisualizations(req.payload.array, req.payload.isAgents, tab)

                if (req.payload.tables) {
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