/*
 * Wazuh app - Classes to generate PDF reports from the backend
 * Copyright (C) 2015-2019 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import Chrome from 'selenium-webdriver/chrome';
import {WebDriver, Builder, By, until} from 'selenium-webdriver';
import Chromedriver from 'chromedriver';
import { DriverService } from 'selenium-webdriver/remote';

interface Report {
  uri: string,
  tab: string,
  filters: string,
  tlapse: string
  // TODO: Generate report from custom time input
  // tFrom: string,
  // tTo: string
}

interface AgentReport extends Report {
  agent: number
}

/**
 * Class with the methods to generate a PDF report from the backend
 *
 * @class AutoReport
 */
class AutoReport {
  screen: { width: number; height: number; };
  url: string;
  tab: string;
  tabs: {};
  filters: string;
  tlapse: string;
  // tFrom: string;
  // tTo: string;
  driver!: WebDriver;
  controller!: string;
  driverService!: DriverService;

  dateSelectors = {
    today: '[data-test-subj="superDatePickerCommonlyUsed_Today"]',
    week: '[data-test-subj="superDatePickerCommonlyUsed_This_week"]',
    min15: '[data-test-subj="superDatePickerCommonlyUsed_Last_15 minutes"]',
    min30: '[data-test-subj="superDatePickerCommonlyUsed_Last_30 minutes"]',
    hours1: '[data-test-subj="superDatePickerCommonlyUsed_Last_1 hour"]',
    hours24: '[data-test-subj="superDatePickerCommonlyUsed_Last_24 hours"]',
    days7: '[data-test-subj="superDatePickerCommonlyUsed_Last_7 days"]',
    days30: '[data-test-subj="superDatePickerCommonlyUsed_Last_30 days"]',
    days90: '[data-test-subj="superDatePickerCommonlyUsed_Last_90 days"]',
    year: '[data-test-subj="superDatePickerCommonlyUsed_Last_1 year"]',
  }

  constructor(report: Report) {
    this.screen = { width: 1920, height: 1080 };
    this.url = `${report.uri}/app/wazuh#/`;
    this.tab = report.tab;
    this.tabs = {};
    this.filters = report.filters;
    this.tlapse = this.selectDate(report.tlapse);
    // this.tFrom = report.tFrom;
    // this.tTo = report.tTo;
  }

  /**
   * Check if the tab is available else trow a error
   *
   * @returns {boolean}
   */
  availableTab() {
    if(this.tab in this.tabs) {
      return true;
    }
    throw new Error(
      `The tab don't exists for the current context`
    );
  }

  /**
   * Return the selector of the time lapse or undefined
   *
   * @param {string} tlapse
   * @returns
   */
  selectDate(tlapse: string) {
    if (tlapse == undefined) {
      return undefined;
    }
    if (tlapse in this.dateSelectors) {
      return this.dateSelectors[tlapse];
    }
    throw new Error(
      `The time lapse don't exists`
    );
  }

  /**
   * Click on the button or link after verifying if this exists or if it is enabled
   *
   * @param {string} selector Css selector of the button or link
   * @param {string} errorMessage Custom error message if throw error
   * @param {boolean} [apendError=false] Append the throw error to the `errorMessage`
   */
  async clickButton(selector: string, errorMessage: string, apendError=false) {
    try {
      await this.driver.wait(until.elementLocated(By.css(selector)), 10000).then(async (button) => {
        await this.driver.wait(until.elementIsEnabled(button), 10000)
        .then(async () => {
          await button.click();
        })
      })
    } catch (e) {
      throw new Error(
        `${errorMessage} ${apendError ? e:''}`
      )
    }
  }

  /**
   * Create and return a webdriver
   *
   * @returns {WebDriver}
   */
  async createDriver() {
    this.driverService = new Chrome.ServiceBuilder(Chromedriver.path).build();
    Chrome.setDefaultService(this.driverService);
    return await new Builder()
    .forBrowser('chrome')
    .setChromeOptions(new Chrome.Options().headless().windowSize(this.screen))
    .build();
  }

  /**
   * Close the webdriver and remove all instances of Chromedriver
   */
  async quitDriver() {
    await this.driver.quit();
    await this.driverService.kill();
  }

  /**
   * Throw a error if the dashboard are no results
   *
   */
  async hasResult() {
    const elementStatusLoad = await this.driver.wait(until.elementLocated(By.css('[data-test-subj="reportStatusLoad"]')), 10000);
    await this.driver.wait(until.elementIsNotVisible(elementStatusLoad), 60000);
    const elementStatusNone = await this.driver.wait(until.elementLocated(By.css('[data-test-subj="reportStatusNone"]')), 10000);
    if (await elementStatusNone.isDisplayed()){
      throw new Error(
        'There are no results for selected time range or filters. Try another one.'
      );
    }
  }

  /**
   * Press the 'generate report' button
   *
   */
  async generateReport() {
    const selector = '[data-test-subj="generateReport"]';
    await this.clickButton(
      selector,
      `The generate report button is disabled`
    );
    if (!await this.waitToReport()){
      throw new Error(
        `Unexpected error while trying to generate the report`
      );
    }
  }

  /**
   * Open Wazuh app in the web browser
   *
   */
  async openWazuh(){
    this.driver.get(this.url);
    await this.driver.wait(until.urlContains(this.controller), 30000);
  }

  /**
   * Open de correct controller in the web browser
   *
   * @param {string} type
   * @param {WebDriver} driver
   */
  async setController() {
    const ctrls = {
      agents: '[data-test-subj="wzMenuAgents"]',
      overview: '[data-test-subj="wzMenuOverview"]'
    }

    const selector = ctrls[this.controller];
    await this.clickButton(
      selector,
      `Unexpected error when load the controller`,
      true
    );
  }

  /**
   * Set the KQL query in the filter bar
   *
   */
  async setFilters() {
    if (this.filters != undefined) {
      await this.waitLoad();
      const selector = '[data-test-subj="queryInput"]';
      const filterBar = await this.driver.wait(until.elementLocated(By.css(selector)), 10000);
      await filterBar.sendKeys(this.filters);
      await this.clickButton(
        '[data-test-subj="querySubmitButton"]',
        'Query submit button not found'
      )
      await this.hasResult();
    }
  }

  /**
   * Open the selected tab in the web browser
   *
   */
  async setTab() {
    await this.waitLoad();

    const selector = this.tabs[this.tab];
    await this.clickButton(
      selector,
      `The tab is disabled or don't exists for the current context`
    );
  }

  /**
   * Select in the web browser the time lapse.
   *
   * @memberof AutoReport
   */
  async setTime() {
    if (this.tlapse != undefined){
      await this.waitLoad();
      const datePickerSelector = '[data-test-subj="superDatePickerToggleQuickMenuButton"]';
      await this.clickButton(datePickerSelector, 'Date picker button not found');
      await this.clickButton(this.tlapse, 'The time lapse filter not found');
      await this.hasResult();
    }
  }

  /**
   * Check the status of the Kibana load indicator
   *
   */
  async waitLoad() {
    try {
      await this.driver.wait(until.elementLocated(By.css('[data-test-subj="globalLoadingIndicator-hidden"]')), 10000);
    } catch (error) {
      throw new Error(
        `The view did not load correctly`
      )
    }
  }

  /**
   * Returns true if the report is generated
   *
   * @return {boolean}
   */
  async waitToReport() {
    try {
      const toasts = await this.driver.wait(until.elementLocated(By.css('div.euiGlobalToastList')), 10000);
      await this.driver.wait(until.elementTextContains(toasts, 'Reporting. Success.'), 60000);
      return true;
    } catch (error) {
      return false;
    }
  }

}

/**
 * Extends the class AutoReport to generate the reports of the overview
 *
 * @class OverviewAutoReport
 * @extends {AutoReport}
 */
export class OverviewAutoReport extends AutoReport {

  constructor(report: Report) {
    super(report);
    this.controller = 'overview';
    this.tabs = {
      general: '[data-test-subj="overviewWelcomeGeneral"]',
      fim: '[data-test-subj="overviewWelcomeFim"]',
      aws: '[data-test-subj="overviewWelcomeAws"]',
      pm: '[data-test-subj="overviewWelcomePm"]',
      audit: '[data-test-subj="overviewWelcomeAudit"]',
      oscap: '[data-test-subj="overviewWelcomeOscap"]',
      ciscat: '[data-test-subj="overviewWelcomeCiscat"]',
      vuls: '[data-test-subj="overviewWelcomeVuls"]',
      virustotal: '[data-test-subj="overviewWelcomeVirustotal"]',
      osquery: '[data-test-subj="overviewWelcomeOsquery"]',
      docker: '[data-test-subj="overviewWelcomeDocker"]',
      pci: '[data-test-subj="overviewWelcomePci"]',
      gdpr: '[data-test-subj="overviewWelcomeGdpr"]',
    }
    this.availableTab();
  }

  public async run() {
    try {
      this.driver = await this.createDriver();
      await this.openWazuh();
      await this.setController();
      await this.setTab();
      await this.setTime();
      await this.setFilters();
      await this.generateReport();
      await this.quitDriver();
      return { finish: true, message: 'Reporting success.' };
    } catch (err) {
      await this.quitDriver();
      return { finish: false, message: `${err}`};
    }
  }
}

/**
 * Extends the class AutoReport to generate the reports of the agents
 *
 * @class AgentsAutoReport
 * @extends {AutoReport}
 */
export class AgentsAutoReport extends AutoReport {
  agent: number;
  constructor(agentReport: AgentReport) {
    super(agentReport);
    this.controller = 'agents';
    this.agent = agentReport.agent;
    this.url += 'agents?_g=()&agent=' + this.agent;
    this.tabs = {
      general: '[data-test-subj="agentsWelcomeGeneral"]',
      fim: '[data-test-subj="agentsWelcomeFim"]',
      syscollector: '[data-test-subj="agentsWelcomeSyscollector"]',
      pm: '[data-test-subj="agentsWelcomePm"]',
      sca: '[data-test-subj="agentsWelcomeSca"]',
      audit: '[data-test-subj="agentsWelcomeAudit"]',
      oscap: '[data-test-subj="agentsWelcomeOscap"]',
      ciscat: '[data-test-subj="agentsWelcomeCiscat"]',
      vuls: '[data-test-subj="agentsWelcomeVuls"]',
      virustotal: '[data-test-subj="agentsWelcomeVirustotal"]',
      osquery: '[data-test-subj="agentsWelcomeOsquery"]',
      docker: '[data-test-subj="agentsWelcomeDocker"]',
      pci: '[data-test-subj="agentsWelcomePci"]',
      gdpr: '[data-test-subj="agentsWelcomeGdpr"]',
    };
    this.availableTab();
  }

  public async run() {
    try {
      this.driver = await this.createDriver();
      await this.openWazuh();
      if (!await this.checkAgent()){
        throw new Error(
          `Agent does not exist`
        );
      }
      await this.setTab();
      if (this.tab != 'syscollector') {
        await this.setTime();
        await this.setFilters();
      }
      await this.generateReport();
      await this.quitDriver();
      return { finish: true, message: 'Reporting success.' };
    } catch (err) {
      await this.quitDriver();
      return { finish: false, message: `${err}`};
    }
  }

  /**
   * Wait for the agent welcome panel to load or
   * return false if the agent does not exist.
   *
   * @return {boolean}
   */
  async checkAgent() {
    try {
      const toasts = await this.driver.wait(until.elementLocated(By.css('div.euiGlobalToastList')), 10000);
      await this.driver.wait(until.elementTextContains(toasts, 'Agent does not exist'), 10000);
      return false;
    } catch (error) {
      return true;
    }
  }
}