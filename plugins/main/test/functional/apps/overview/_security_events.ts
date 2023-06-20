/*
 * Wazuh app - Overview -> general test
 * Copyright (C) 2015-2022 Wazuh, Inc.
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
import { SearchParams } from 'elasticsearch';
import { getSettingDefaultValue } from '../../../../common/services/settings';

export default function({getService, getPageObjects, }: FtrProviderContext) {
  const areaChart = getService('areaChart');
  const arrayHelper = getService('arrayHelper');
  const es = getService('es');
  const esAreaChart = getService('esAreaChart');
  const esPieChart = getService('esPieChart');
  const esTableViz = getService('esTableViz');
  const filterBar = getService('filterBar');
  const find = getService('find');
  const PageObjects = getPageObjects(['wazuhCommon', 'common']);
  const pieCharts = getService('pieCharts');
  const queryBar = getService('queryBar');
  const tableViz = getService('tableViz');
  const testSubjects = getService('testSubjects');

  describe('security_events', () => {
    let es_index: string;
    before(async () => {
      await PageObjects.wazuhCommon.OpenSecurityEvents();
      es_index = getSettingDefaultValue('pattern');
    });

    beforeEach(async () => {
      await PageObjects.wazuhCommon.setTodayRange();
    })

    //#region Visualization tests

    it('should alertStats values are correct', async () => {
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

    it('should alert level evolution chart value ​​are correct',async () => {
      const chartSelector: string = '#Wazuh-App-Overview-General-Alert-level-evolution';
      const values:object = await areaChart.getValues(chartSelector);

      const query:SearchParams = {
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
      };
      const esValues = await esAreaChart.getData(query, 'rule.level');

      expect(JSON.stringify(esValues))
        .to.be.equal(JSON.stringify(values));

    });

    it('should alert chart values are correct',async () => {
      const chartSelector: string = '#Wazuh-App-Overview-General-Alerts';
      const values:object = await areaChart.getValues(chartSelector);

      const query:SearchParams = {
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
      };
      const esValues = await esAreaChart.getData(query);

      expect(JSON.stringify(esValues))
        .to.be.equal(JSON.stringify(values));
    });

    it('should top 5 agent chart pie values are correct',async () => {
      const chartSelector: string = '#Wazuh-App-Overview-General-Top-5-agents';
      const values = await pieCharts.getValues(chartSelector);

      const query:SearchParams = {
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
      };
      const esValues: object[] = await esPieChart.getData(query, 'agent.name');

      expect(JSON.stringify(esValues.slice(0, 5)))
        .to.be.equal(JSON.stringify(values));
    });

    it('should top 5 rule groups chart pie values are correct',async () => {
      const chartSelector: string = '#Wazuh-App-Overview-General-Top-5-rule-groups';
      const values = await pieCharts.getValues(chartSelector);
      const query:SearchParams = {
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
      };
      const esValues = await esPieChart.getData(query, 'rule.groups');

      expect(JSON.stringify(esValues.slice(0, 5)))
        .to.be.equal(JSON.stringify(values));
    });

    it('should alerts evolution - top 5 agents chart values are correct',async () => {
      const chartSelector: string = '#Wazuh-App-Overview-General-Alerts-evolution-Top-5-agents';
      const values:object = await areaChart.getValues(chartSelector);

      const query:SearchParams = {
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
      };
      const esValues = await esAreaChart.getData(query, 'agent.name');

      expect(JSON.stringify(esValues))
        .to.be.equal(JSON.stringify(values));
    });

    it('should alerts summary table values are correct',async () => {
      const summarySelector: string = '#Wazuh-App-Overview-General-Alerts-summary';
      const values: object[] = await tableViz.getValues(summarySelector);

      const fields = [
        {field: 'rule.id', label: 'Rule ID'},
        {field: 'rule.description', label: 'Description'},
        {field: 'rule.level', label: 'Level'},
        {method: 'count', field: 'rule.id', label: 'Count'},
      ];
      const query:SearchParams = {
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
      };
      const esValues: object[] = await esTableViz.getData(query, fields, ['-Count', 'Level', '-Rule ID', ]);
      let result = false;
      for (const value of values) {
        for (const esValue of esValues) {
          if (JSON.stringify(value) === JSON.stringify(esValue)) {
            result = true;
            break;
          }
        }
        if(!result){
          break
        }
      }
      expect(result)
      .to.be.ok();
    });

    //#endregion

    //#region filter tests

    it('should alertStats values ​​are correct when add the filter rule.level: 7',async () => {
      await filterBar.addFilter('rule.level', 'is', '7');
      await PageObjects.common.sleep(3000);

      const todayAlerts = await es.search({
        index: es_index,
        body: {
          size: 1000,
          query: {
            bool: {
              must: [
                {
                  term: {
                    "rule.level": 7
                  }
                },
                {
                  range : {
                    timestamp : {
                      gte : "now/d",
                      lt :  "now"
                    }
                  }
                }
              ]
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
      await filterBar.removeAllFilters();
    });

    it('should alert level evolution chart values are correct when add the filter rule.level: 7',async () => {
      await filterBar.addFilter('rule.level', 'is', '7');
      await PageObjects.common.sleep(3000);

      const chartSelector: string = '#Wazuh-App-Overview-General-Alerts';
      const values:object = await areaChart.getValues(chartSelector);

      const query:SearchParams = {
        index: es_index,
        body: {
          size: 1000,
          query: {
            bool: {
              must: [
                {
                  term: {
                    "rule.level": 7
                  }
                },
                {
                  range : {
                    timestamp : {
                      gte : "now/d",
                      lt :  "now"
                    }
                  }
                }
              ]
            }
          }
        }
      };
      const esValues = await esAreaChart.getData(query);

      expect(JSON.stringify(esValues))
        .to.be.equal(JSON.stringify(values));
      await filterBar.removeAllFilters();
    });

    it('should alert chart values are correct when add the filter rule.level: 7',async () => {
      await filterBar.addFilter('rule.level', 'is', '7');
      await PageObjects.common.sleep(3000);

      const chartSelector: string = '#Wazuh-App-Overview-General-Alerts';
      const values:object = await areaChart.getValues(chartSelector);

      const query:SearchParams = {
        index: es_index,
        body: {
          size: 1000,
          query: {
            bool: {
              must: [
                {
                  term: {
                    "rule.level": 7
                  }
                },
                {
                  range : {
                    timestamp : {
                      gte : "now/d",
                      lt :  "now"
                    }
                  }
                }
              ]
            }
          }
        }
      };
      const esValues = await esAreaChart.getData(query);

      expect(JSON.stringify(esValues))
        .to.be.equal(JSON.stringify(values));
      await filterBar.removeAllFilters();
    });

    it('should top 5 agent chart pie values are correct when add the filter rule.level: 7',async () => {
      await filterBar.addFilter('rule.level', 'is', '7');
      await PageObjects.common.sleep(3000);

      const chartSelector: string = '#Wazuh-App-Overview-General-Top-5-agents';
      const values = await pieCharts.getValues(chartSelector);

      const query:SearchParams = {
        index: es_index,
        body: {
          size: 1000,
          query: {
            bool: {
              must: [
                {
                  term: {
                    "rule.level": 7
                  }
                },
                {
                  range : {
                    timestamp : {
                      gte : "now/d",
                      lt :  "now"
                    }
                  }
                }
              ]
            }
          }
        }
      };
      const esValues: object[] = await esPieChart.getData(query, 'agent.name');

      expect(JSON.stringify(esValues.slice(0, 5)))
        .to.be.equal(JSON.stringify(values));
      await filterBar.removeAllFilters();
    });

    it('should top 5 rule groups chart pie values are correct when add the filter rule.level: 7',async () => {
      await filterBar.addFilter('rule.level', 'is', '7');
      await PageObjects.common.sleep(3000);

      const chartSelector: string = '#Wazuh-App-Overview-General-Top-5-rule-groups';
      const values = await pieCharts.getValues(chartSelector);

      const query:SearchParams = {
        index: es_index,
        body: {
          size: 1000,
          query: {
            bool: {
              must: [
                {
                  term: {
                    "rule.level": 7
                  }
                },
                {
                  range : {
                    timestamp : {
                      gte : "now/d",
                      lt :  "now"
                    }
                  }
                }
              ]
            }
          }
        }
      };
      const esValues = await esPieChart.getData(query, 'rule.groups');

      expect(arrayHelper.compareObjects(values, esValues))
      .to.be.ok();
      await filterBar.removeAllFilters();
    });

    it('should alerts evolution - top 5 agents chart values are correct when add the filter rule.level: 7',async () => {
      await filterBar.addFilter('rule.level', 'is', '7');
      await PageObjects.common.sleep(3000);

      const chartSelector: string = '#Wazuh-App-Overview-General-Alerts-evolution-Top-5-agents';
      const values:object = await areaChart.getValues(chartSelector);

      const query:SearchParams = {
        index: es_index,
        body: {
          size: 1000,
          query: {
            bool: {
              must: [
                {
                  term: {
                    "rule.level": 7
                  }
                },
                {
                  range : {
                    timestamp : {
                      gte : "now/d",
                      lt :  "now"
                    }
                  }
                }
              ]
            }
          }
        }
      };
      const esValues = await esAreaChart.getData(query, 'agent.name');

      expect(JSON.stringify(esValues))
        .to.be.equal(JSON.stringify(values));
      await filterBar.removeAllFilters();
    });

    it('should alerts summary table values are correct when add the filter rule.level: 7',async () => {
      await filterBar.addFilter('rule.level', 'is', '7');
      await PageObjects.common.sleep(3000);

      const summarySelector: string = '#Wazuh-App-Overview-General-Alerts-summary';
      const values: object[] = await tableViz.getValues(summarySelector);

      const fields = [
        {field: 'rule.id', label: 'Rule ID'},
        {field: 'rule.description', label: 'Description'},
        {field: 'rule.level', label: 'Level'},
        {method: 'count', field: 'rule.id', label: 'Count'},
      ];
      const query:SearchParams = {
        index: es_index,
        body: {
          size: 1000,
          query: {
            bool: {
              must: [
                {
                  term: {
                    "rule.level": 7
                  }
                },
                {
                  range : {
                    timestamp : {
                      gte : "now/d",
                      lt :  "now"
                    }
                  }
                }
              ]
            }
          }
        }
      };
      const esValues: object[] = await esTableViz.getData(query, fields, ['-Count', '-Level', '-Rule ID']);

      expect(arrayHelper.compareObjects(values, esValues))
      .to.be.ok();
      await filterBar.removeAllFilters();
    });

    //#endregion

    //#region query bar tests

    it('should alertStats values ​​are correct when add to the query bar rule.level: 7',async () => {
      await queryBar.setQuery('rule.level:7');
      await queryBar.submitQuery();
      await PageObjects.common.sleep(3000);

      const todayAlerts = await es.search({
        index: es_index,
        body: {
          size: 1000,
          query: {
            bool: {
              must: [
                {
                  term: {
                    "rule.level": 7
                  }
                },
                {
                  range : {
                    timestamp : {
                      gte : "now/d",
                      lt :  "now"
                    }
                  }
                }
              ]
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
      await queryBar.setQuery('');
      await queryBar.submitQuery();
    });

    it('should alert level evolution chart values are correct when add to the query bar rule.level: 7',async () => {
      await queryBar.setQuery('rule.level:7');
      await queryBar.submitQuery();
      await PageObjects.common.sleep(3000);

      const chartSelector: string = '#Wazuh-App-Overview-General-Alerts';
      const values:object = await areaChart.getValues(chartSelector);

      const query:SearchParams = {
        index: es_index,
        body: {
          size: 1000,
          query: {
            bool: {
              must: [
                {
                  term: {
                    "rule.level": 7
                  }
                },
                {
                  range : {
                    timestamp : {
                      gte : "now/d",
                      lt :  "now"
                    }
                  }
                }
              ]
            }
          }
        }
      };
      const esValues = await esAreaChart.getData(query);

      expect(JSON.stringify(esValues))
        .to.be.equal(JSON.stringify(values));
      await queryBar.setQuery('');
      await queryBar.submitQuery();
    });

    it('should alert chart values are correct when add the filter rule.level: 7',async () => {
      await queryBar.setQuery('rule.level:7');
      await queryBar.submitQuery();
      await PageObjects.common.sleep(3000);

      const chartSelector: string = '#Wazuh-App-Overview-General-Alerts';
      const values:object = await areaChart.getValues(chartSelector);

      const query:SearchParams = {
        index: es_index,
        body: {
          size: 1000,
          query: {
            bool: {
              must: [
                {
                  term: {
                    "rule.level": 7
                  }
                },
                {
                  range : {
                    timestamp : {
                      gte : "now/d",
                      lt :  "now"
                    }
                  }
                }
              ]
            }
          }
        }
      };
      const esValues = await esAreaChart.getData(query);

      expect(JSON.stringify(esValues))
        .to.be.equal(JSON.stringify(values));
      await queryBar.setQuery('');
      await queryBar.submitQuery();
    });

    it('should top 5 agent chart pie values are correct when add to the query bar rule.level: 7',async () => {
      await queryBar.setQuery('rule.level:7');
      await queryBar.submitQuery();
      await PageObjects.common.sleep(3000);

      const chartSelector: string = '#Wazuh-App-Overview-General-Top-5-agents';
      const values = await pieCharts.getValues(chartSelector);

      const query:SearchParams = {
        index: es_index,
        body: {
          size: 1000,
          query: {
            bool: {
              must: [
                {
                  term: {
                    "rule.level": 7
                  }
                },
                {
                  range : {
                    timestamp : {
                      gte : "now/d",
                      lt :  "now"
                    }
                  }
                }
              ]
            }
          }
        }
      };
      const esValues: object[] = await esPieChart.getData(query, 'agent.name');

      expect(JSON.stringify(esValues.slice(0, 5)))
        .to.be.equal(JSON.stringify(values));
      await queryBar.setQuery('');
      await queryBar.submitQuery();
    });

    it('should top 5 rule groups chart pie values are correct when add to the query bar rule.level: 7',async () => {
      await queryBar.setQuery('rule.level:7');
      await queryBar.submitQuery();
      await PageObjects.common.sleep(3000);

      const chartSelector: string = '#Wazuh-App-Overview-General-Top-5-rule-groups';
      const values = await pieCharts.getValues(chartSelector);

      const query:SearchParams = {
        index: es_index,
        body: {
          size: 1000,
          query: {
            bool: {
              must: [
                {
                  term: {
                    "rule.level": 7
                  }
                },
                {
                  range : {
                    timestamp : {
                      gte : "now/d",
                      lt :  "now"
                    }
                  }
                }
              ]
            }
          }
        }
      };
      const esValues = await esPieChart.getData(query, 'rule.groups');
      expect(arrayHelper.compareObjects(values, esValues))
      .to.be.ok();
      await queryBar.setQuery('');
      await queryBar.submitQuery();
    });

    it('should alerts evolution - top 5 agents chart values are correct when add to the query bar rule.level: 7',async () => {
      await queryBar.setQuery('rule.level:7');
      await queryBar.submitQuery();
      await PageObjects.common.sleep(3000);

      const chartSelector: string = '#Wazuh-App-Overview-General-Alerts-evolution-Top-5-agents';
      const values:object = await areaChart.getValues(chartSelector);

      const query:SearchParams = {
        index: es_index,
        body: {
          size: 1000,
          query: {
            bool: {
              must: [
                {
                  term: {
                    "rule.level": 7
                  }
                },
                {
                  range : {
                    timestamp : {
                      gte : "now/d",
                      lt :  "now"
                    }
                  }
                }
              ]
            }
          }
        }
      };
      const esValues = await esAreaChart.getData(query, 'agent.name');

      expect(JSON.stringify(esValues))
        .to.be.equal(JSON.stringify(values));
      await queryBar.setQuery('');
      await queryBar.submitQuery();
    });

    it('should alerts summary table values are correct when add to the query bar rule.level: 7',async () => {
      await queryBar.setQuery('rule.level:7');
      await queryBar.submitQuery();
      await PageObjects.common.sleep(3000);

      const summarySelector: string = '#Wazuh-App-Overview-General-Alerts-summary';
      const values: object[] = await tableViz.getValues(summarySelector);

      const fields = [
        {field: 'rule.id', label: 'Rule ID'},
        {field: 'rule.description', label: 'Description'},
        {field: 'rule.level', label: 'Level'},
        {method: 'count', field: 'rule.id', label: 'Count'},
      ];
      const query:SearchParams = {
        index: es_index,
        body: {
          size: 1000,
          query: {
            bool: {
              must: [
                {
                  term: {
                    "rule.level": 7
                  }
                },
                {
                  range : {
                    timestamp : {
                      gte : "now/d",
                      lt :  "now"
                    }
                  }
                }
              ]
            }
          }
        }
      };
      const esValues: object[] = await esTableViz.getData(query, fields, ['-Count', '-Level', '-Rule ID']);

      expect(arrayHelper.compareObjects(values, esValues))
      .to.be.ok();
      await queryBar.setQuery('');
      await queryBar.submitQuery();
    });

    //#endregion

  });
}