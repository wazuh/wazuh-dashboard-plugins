import Chrome from 'selenium-webdriver/chrome';
import {WebDriver, Builder, By, Key, until} from 'selenium-webdriver';

interface Report {
  uri: string,
  tab: string,
  filters: string,
  tFrom: string,
  tTo: string
}

interface AgentReport extends Report {
  agent: number
}

export class AutoReport {
  screen: { width: number; height: number; };
  url: string;
  tab: string;
  filters: string;
  tFrom: string;
  tTo: string;

  constructor(report: Report) {
    this.screen = this.setResolution(1920, 1080);
    this.url = `${report.uri}/app/wazuh#/`;
    this.tab = report.tab;
    this.filters = report.filters;
    this.tFrom = report.tFrom;
    this.tTo = report.tTo;
  }


  public setResolution(width:number, height:number){
    this.screen = {
      width: width,
      height: height
    };
    return this.screen;
  }


  async createDriver() {
    return await new Builder()
    .forBrowser('chrome')
    .setChromeOptions(new Chrome.Options().headless().windowSize(this.screen))
    .build();
  }

  async openWazuh(driver:WebDriver){
    driver.get(this.url);
    await driver.wait(until.urlContains('overview'), 10000);
  }

  /**
   * Open de correct controller in the web browser
   *
   * @param {string} type 
   * @param {WebDriver} driver
   */
  async setController(type: string, driver: WebDriver) {
    const ctrls = {
      agent: '[data-test-subj="wzMenuAgents"]',
      overview: '[data-test-subj="wzMenuOverview"]'
    }
    
    const wzMenu = await driver.wait(until.elementLocated(By.css(ctrls[type])), 10000)
    await wzMenu.click();
  }

  async setTab(driver: WebDriver) {
    const exportButton = await driver.wait(until.elementLocated(By.css(this.tab)), 10000);
    await exportButton.click();
  }

  async generateReport(driver: WebDriver) {
    await driver.sleep(2000);
    const selector = '[data-test-subj="overviewGenerateReport"]';
    const eventAlertButton = await driver.wait(until.elementLocated(By.css(selector)), 50000)
    await eventAlertButton.click();
  }

}


export class OverviewAutoReport extends AutoReport {

  public async run(screenshot: (name: string, driver: WebDriver) => any) {
    const driver = await this.createDriver();
    try {
      await this.openWazuh(driver);
      await this.setController('overview', driver);
      await this.setTab(driver);
      await this.generateReport(driver);
      await driver.sleep(30000);
      await screenshot('test', driver);
    } catch (err) {
      await screenshot('error-'+Date.now(), driver);
      return ('error: '+err);
    } finally {
      await driver.quit();
      return 'Reporting success.\n';
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