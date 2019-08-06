import Chrome from 'selenium-webdriver/chrome';
import {WebDriver, Builder, By, until, Key, WebElement, Origin} from 'selenium-webdriver';

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
    return await new Builder()
    .forBrowser('chrome')
    .setChromeOptions(new Chrome.Options().headless().windowSize(this.screen))
    .build();
  }

  /**
   * Press the 'generate report' button
   *
   */
  async generateReport() {
    const selector = '[data-test-subj="overviewGenerateReport"]';
    await this.clickButton(
      selector,
      `The generate report button is disabled`
    );
  }

  /**
   * Open Wazuh app in the web browser
   *
   */
  async openWazuh(){
    this.driver.get(this.url);
    await this.driver.wait(until.urlContains('overview'), 10000);
  }

  /**
   * Open de correct controller in the web browser
   *
   * @param {string} type 
   * @param {WebDriver} driver
   */
  async setController(type: string) {
    const ctrls = {
      agent: '[data-test-subj="wzMenuAgents"]',
      overview: '[data-test-subj="wzMenuOverview"]'
    }
    
    const selector = ctrls[type];
    await this.clickButton(
      selector,
      `Unexpected error when load the controlle`,
      true
    );
  }


  async setFilters() {
    if (this.filters != undefined) {
      await this.driver.sleep(3000);
      const selector = '[data-test-subj="queryInput"]';
      const filterBar = await this.driver.wait(until.elementLocated(By.css(selector)), 10000);
      await filterBar.sendKeys(this.filters);
      await this.clickButton(
        '[data-test-subj="querySubmitButton"]',
        'Query submit button not found'
      )
    }
  }

  /**
   * Open the selected tab in the web browser
   *
   */
  async setTab() {
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
      const datePickerSelector = '[data-test-subj="superDatePickerToggleQuickMenuButton"]';
      await this.driver.sleep(3000);
      await this.clickButton(datePickerSelector, 'Date picker button not found');
      await this.clickButton(this.tlapse, 'The time lapse filter not found');
    }
  }

}


export class OverviewAutoReport extends AutoReport {

  constructor(report: Report) {
    super(report);
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

  public async run(screenshot: (name: string, driver: WebDriver) => any) {
    try {
      this.driver = await this.createDriver();
      await this.openWazuh();
      await this.setController('overview');
      await this.setTab();
      await this.setTime();
      await this.setFilters();
      await this.generateReport();
      await this.driver.sleep(30000);
      await this.driver.quit();
      return 'Reporting success.\n';
    } catch (err) {
      await screenshot('error-'+Date.now(), this.driver);
      await this.driver.quit();
      return `${err}`;
    }
  }
}

export class AgentsAutoReport extends AutoReport {
  agent: number;
  constructor(agentReport: AgentReport) {
    super(agentReport);
    this.agent = agentReport.agent;
  }

}