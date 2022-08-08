const { WAIT_TIMEOUT, SERVER_URL } = require('../common/constants');
const logger = require('../common/logger');

module.exports = async function (context, commands) {

    await commands.navigate(SERVER_URL);

    try {
        await commands.wait.bySelector('button[data-test-subj="toggleNavButton"]', WAIT_TIMEOUT)
        await commands.click.bySelector('button[data-test-subj="toggleNavButton"]')
        await commands.wait.bySelector('a[href$="/app/wazuh"]', WAIT_TIMEOUT)
        await commands.click.bySelector('a[href$="/app/wazuh"]')

        await commands.wait.byXpath('//*[contains(@class,"euiTitle euiTitle--small euiCard__title")]//*[contains(text(),"Vulnerabilities")]', WAIT_TIMEOUT)
        await commands.wait.byCondition("!isNaN(parseInt(document.querySelector('.statWithLink').innerHTML))", WAIT_TIMEOUT)
        await commands.click.byXpath('//*[contains(@class,"euiTitle euiTitle--small euiCard__title")]//*[contains(text(),"Vulnerabilities")]')
        await commands.wait.byXpath('//button//*[contains(text(),"Select agent")]', WAIT_TIMEOUT)
        await commands.click.byXpath('//button//*[contains(text(),"Select agent")]')
        await commands.wait.byXpath('//*[contains(@class,"wz-select-agent-modal")]', WAIT_TIMEOUT)
        await commands.wait.byXpath('//*[contains(@class,"wz-select-agent-modal")]//tbody//*[contains(@class,"uiTableRow-isClickable")][1]', WAIT_TIMEOUT)
        await commands.click.byXpath('//*[contains(@class,"wz-select-agent-modal")]//tbody//*[contains(@class,"uiTableRow-isClickable")][1]')
        await commands.wait.bySelector('.wz-welcome-page-agent-tabs button.euiTab.euiTab-isSelected:first-child', WAIT_TIMEOUT)
        // Start collecting metrics
        await commands.measure.start('vulnerabilities-events-module')
        logger('--- Initiate measures in dashboard module ---');
        
        await commands.click.byXpath('//react-component//button//*[contains(text(),"Event")]')
        
        logger('--- AGENT TOOLTIP ---')
        await commands.wait.byXpath('//react-component//*[contains(@class,"euiToolTipAnchor")]//button[contains(@class,"euiButtonEmpty--primary")]', WAIT_TIMEOUT)
        
        logger('--- WAZUH ALERT LIST ---')
        await commands.wait.bySelector('[data-test-subj="fieldList-unpopular"] li', WAIT_TIMEOUT)

        logger('--- DISCOVER CHART ---');
        await commands.wait.bySelector('[data-test-subj="discoverChart"] canvas', WAIT_TIMEOUT)

        logger('--- Finish measures ---', 'info');

        // Stop and collect the metrics
        return commands.measure.stop();
    } catch (e) {
        // We try/catch so we will catch if the the input fields can't be found
        // The error is automatically logged in Browsertime an rethrown here
        // We could have an alternative flow ...
        // else we can just let it cascade since it caught later on and reported in
        // the HTML
        throw e;
    }
};