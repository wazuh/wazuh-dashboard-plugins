/*
 * Wazuh app - Generic error response constructor
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
import { Object } from 'core-js';

export default function({getService, getPageObjects}) {
  const PageObjects = getPageObjects(['common', 'wazuhCommon', 'timePicker', ]);
  const es = getService('es');
  const find = getService('find');
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
      es_index = await testSubjects.click('querySubmitButton');
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

  });
}