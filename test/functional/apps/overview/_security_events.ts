/*
 * Wazuh app - Overview -> general test class
 * Copyright (C) 2015-2019 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import expect from '@kbn/expect';
import { FtrProviderContext } from '../../../../../../test/functional/ftr_provider_context';

export default function({getService, getPageObjects, }: FtrProviderContext) {
  const areaChart = getService('areaChart');
  const pieCharts = getService('pieCharts');
  const es = getService('es');
  const esAreaChart = getService('esAreaChart');
  const esPieChart = getService('esPieChart');
  const find = getService('find');
  const PageObjects = getPageObjects(['common', 'wazuhCommon', 'timePicker', ]);
  const testSubjects = getService('testSubjects');

  describe('security_events', () => {
    let es_index: string;
    before(async () => {
      await PageObjects.wazuhCommon.OpenSecurityEvents();
      es_index = await testSubjects.getVisibleText('wzMenuPatternTitle');
    });

    it('should alertStats values are correct', async () => {
      await PageObjects.timePicker.setCommonlyUsedTime('superDatePickerCommonlyUsed_Today');
      await PageObjects.common.sleep(3000);
      await testSubjects.click('querySubmitButton');
      await PageObjects.common.sleep(3000);

      const todayAlerts = await es.search({
        index: es_index,
        body: {
          size: 1000,
          query: {
            range: {
              timestamp: {
                gte: 'now/d',
                lt: 'now'
              }
            }
          }
        }
      });

      const esAlerts = {
        alerts: (((todayAlerts || {}).hits || {}).total || {}).value,
        level12: ((todayAlerts || {}).hits || {}).hits.filter(hit => {
          return (((hit || {})._source || {}).rule || {}).level == 12
        }),
        authFail: ((todayAlerts || {}).hits || {}).hits.filter(hit => {
          const groups = (((hit || {})._source || {}).rule || {}).groups
          return (
            groups.includes('authentication_failed') || 
            groups.includes('authentication_failures')
          );
        }),
        authSuccess: ((todayAlerts || {}).hits || {}).hits.filter((hit) => {
          return hit._source.rule.groups.includes('authentication_success');
        })
      }

      const alertStats = await find.byName('AlertsStats');
      const rePatter = /.+\s(?<alerts>\d+)\s.*\s(?<level12>\d+)\s.*\s(?<authFail>\d+)\s.*\s(?<authSuccess>\d+)/;
      const alertStatsGroups = rePatter.exec(await alertStats.getVisibleText());

      expect(Number(alertStatsGroups.groups.alerts)).to.be(esAlerts.alerts);
      expect(Number(alertStatsGroups.groups.level12)).to.be(Object.keys(esAlerts.level12).length);
      expect(Number(alertStatsGroups.groups.authFail)).to.be(Object.keys(esAlerts.authFail).length);
      expect(Number(alertStatsGroups.groups.authSuccess)).to.be(Object.keys(esAlerts.authSuccess).length);
    });

    it('should alert level evolution chart value ​​are correct', async () => {
      await PageObjects.timePicker.setCommonlyUsedTime('superDatePickerCommonlyUsed_Today');
      await PageObjects.common.sleep(3000);
      await testSubjects.click('querySubmitButton');
      await PageObjects.common.sleep(3000);

      const chartSelector: string = '#Wazuh-App-Overview-General-Alert-level-evolution';
      const values:object = await areaChart.getValues(chartSelector);

      const esValues = await esAreaChart.getData('rule.level');

      expect(JSON.stringify(esValues))
        .to.be.equal(JSON.stringify(values));

    });

    it('should alert level evolution chart value ​​are correct', async () => {
      await PageObjects.timePicker.setCommonlyUsedTime('superDatePickerCommonlyUsed_Today');
      await PageObjects.common.sleep(3000);
      await testSubjects.click('querySubmitButton');
      await PageObjects.common.sleep(3000);

      const chartSelector: string = '#Wazuh-App-Overview-General-Alerts';
      const values:object = await areaChart.getValues(chartSelector);
      
      const esValues = await esAreaChart.getData();      

      expect(JSON.stringify(esValues))
        .to.be.equal(JSON.stringify(values));
    });

    it('should top 5 agent chart pie values are correct', async () => {
      await PageObjects.timePicker.setCommonlyUsedTime('superDatePickerCommonlyUsed_Today');
      await PageObjects.common.sleep(3000);
      await testSubjects.click('querySubmitButton');
      await PageObjects.common.sleep(3000);

      const chartSelector: string = '#Wazuh-App-Overview-General-Top-5-agents';
      const values = await pieCharts.getValues(chartSelector);
      const esValues: object[] = await esPieChart.getData('agent.name');

      expect(JSON.stringify(esValues.slice(0, 5)))
        .to.be.equal(JSON.stringify(values));
    });

    it('should top 5 rule groups chart pie values are correct', async () => {
      await PageObjects.timePicker.setCommonlyUsedTime('superDatePickerCommonlyUsed_Today');
      await PageObjects.common.sleep(3000);
      await testSubjects.click('querySubmitButton');
      await PageObjects.common.sleep(3000);

      const chartSelector: string = '#Wazuh-App-Overview-General-Top-5-rule-groups';
      const values = await pieCharts.getValues(chartSelector);
      const esValues = await esPieChart.getData('rule.groups');

      expect(JSON.stringify(esValues.slice(0, 5)))
        .to.be.equal(JSON.stringify(values));
    });

    it('should alerts evolution - top 5 agents chart values are correct', async () => {
      
      await PageObjects.timePicker.setCommonlyUsedTime('superDatePickerCommonlyUsed_Today');
      await PageObjects.common.sleep(3000);
      await testSubjects.click('querySubmitButton');
      await PageObjects.common.sleep(3000);

      const chartSelector: string = '#Wazuh-App-Overview-General-Alerts-evolution-Top-5-agents';
      const values:object = await areaChart.getValues(chartSelector);

      const esValues = await esAreaChart.getData('agent.name');

      expect(JSON.stringify(esValues))
        .to.be.equal(JSON.stringify(values));
    });

  });
}