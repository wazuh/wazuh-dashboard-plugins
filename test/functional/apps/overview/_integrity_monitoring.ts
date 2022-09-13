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
  const esAreaChart = getService('esAreaChart');
  const esPieChart = getService('esPieChart');
  const esTableViz = getService('esTableViz');
  const filterBar = getService('filterBar');
  const PageObjects = getPageObjects(['wazuhCommon', 'common']);
  const pieCharts = getService('pieCharts');
  const queryBar = getService('queryBar');
  const tableViz = getService('tableViz');
  const testSubjects = getService('testSubjects');


  describe('integrity_monitoring', () => {
    let es_index: string;
    before(async () => {
      await PageObjects.wazuhCommon.OpenIntegrityMonitoring();
      es_index = getSettingDefaultValue('pattern');
    });

    beforeEach(async () => {
      await PageObjects.wazuhCommon.setTodayRange();
    })

    //#region Visualization tests

    it('should Alerts by action over time values are correct', async () => {
      const chartSelector: string = '#Wazuh-App-Agents-FIM-Alerts-by-action-over-time';
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
                    "rule.groups": "syscheck"
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
      const esValues = await esAreaChart.getData(query, 'syscheck.event');

      expect(JSON.stringify(esValues))
      .to.be.equal(JSON.stringify(values));
    });

    it('should Top 5 agents values are correct', async () => {
      const chartSelector: string = '#Wazuh-App-Overview-FIM-Top-5-agents-pie';
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
                    "rule.groups": "syscheck"
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
      const esValues = await esPieChart.getData(query, 'agent.name');

      expect(arrayHelper.compareObjects(values, esValues))
      .to.be.ok();
    });

    it('should Events summary values are correct', async () => {
      const chartSelector: string = '#Wazuh-App-Overview-FIM-Events-summary';
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
                    "rule.groups": "syscheck"
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
    });

    it('should Rule distribution values are correct', async () => {
      const chartSelector: string = '#Wazuh-App-Overview-FIM-Top-5-rules';
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
                    "rule.groups": "syscheck"
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
      const esValues = await esPieChart.getData(query, 'rule.description');

      expect(JSON.stringify(esValues.slice(0, 5)))
      .to.be.equal(JSON.stringify(values));
    });

    it('should Actions values are correct', async () => {
      const chartSelector: string = '#Wazuh-App-Overview-FIM-Common-actions';
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
                    "rule.groups": "syscheck"
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
      const esValues = await esPieChart.getData(query, 'syscheck.event');

      expect(JSON.stringify(esValues.slice(0, 5)))
      .to.be.equal(JSON.stringify(values));
    });

    it('should Top 5 users values are correct', async () => {
      const chartSelector: string = '#Wazuh-App-Overview-FIM-top-agents-user';
      const values: object[] = await tableViz.getValues(chartSelector);

      const fields = [
        {field: 'agent.id', label: 'Agent ID'},
        {field: 'agent.name', label: 'Agent name'},
        {field: 'syscheck.uname_after', label: 'Top user'},
        {method: 'count', field: 'agent.id', label: 'Count'},
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
                    "rule.groups": "syscheck"
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
      const esValues: object[] = await esTableViz.getData(query, fields, ['-Count', 'Level', '-Rule ID', ]);

      
      expect(arrayHelper.compareObjects(values, esValues))
      .to.be.ok();
    });

    it('should Alerts summary values are correct', async () => {
      const chartSelector: string = '#Wazuh-App-Overview-FIM-Alerts-summary';
      const values: object[] = await tableViz.getValues(chartSelector);

      const fields = [
        {field: 'agent.name', label: 'Agent'},
        {field: 'syscheck.path', label: 'Path'},
        {field: 'syscheck.event', label: 'Action'},
        {method: 'count', field: 'syscheck.path', label: 'Count'},
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
                    "rule.groups": "syscheck"
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

    it('should Alerts by action over time values are correct when add the filter rule.level: 7', async () => {
      await filterBar.addFilter('rule.level', 'is', '7');
      await PageObjects.common.sleep(3000);

      const chartSelector: string = '#Wazuh-App-Agents-FIM-Alerts-by-action-over-time';
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
                    "rule.groups": "syscheck"
                  }
                },        
                {
                  "term": {
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
      const esValues = await esAreaChart.getData(query, 'syscheck.event');

      expect(JSON.stringify(esValues))
      .to.be.equal(JSON.stringify(values));
      await filterBar.removeAllFilters();
      
    });

    it('should Top 5 agents values are correct when add the filter rule.level: 7', async () => {
      await filterBar.addFilter('rule.level', 'is', '7');
      await PageObjects.common.sleep(3000);

      const chartSelector: string = '#Wazuh-App-Overview-FIM-Top-5-agents-pie';
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
                    "rule.groups": "syscheck"
                  }
                },        
                {
                  "term": {
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
      const esValues = await esPieChart.getData(query, 'agent.name');

      expect(arrayHelper.compareObjects(values, esValues))
      .to.be.ok();
      await filterBar.removeAllFilters();
    });

    it('should Events summary values are correct when add the filter rule.level: 7', async () => {
      await filterBar.addFilter('rule.level', 'is', '7');
      await PageObjects.common.sleep(3000);

      const chartSelector: string = '#Wazuh-App-Overview-FIM-Events-summary';
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
                    "rule.groups": "syscheck"
                  }
                },        
                {
                  "term": {
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

    it('should Rule distribution values are correct when add the filter rule.level: 7', async () => {
      await filterBar.addFilter('rule.level', 'is', '7');
      await PageObjects.common.sleep(3000);

      const chartSelector: string = '#Wazuh-App-Overview-FIM-Top-5-rules';
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
                    "rule.groups": "syscheck"
                  }
                },        
                {
                  "term": {
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
      const esValues = await esPieChart.getData(query, 'rule.description');

      expect(JSON.stringify(esValues.slice(0, 5)))
      .to.be.equal(JSON.stringify(values));
      await filterBar.removeAllFilters();
    });

    it('should Actions values are correct when add the filter rule.level: 7', async () => {
      await filterBar.addFilter('rule.level', 'is', '7');
      await PageObjects.common.sleep(3000);

      const chartSelector: string = '#Wazuh-App-Overview-FIM-Common-actions';
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
                    "rule.groups": "syscheck"
                  }
                },        
                {
                  "term": {
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
      const esValues = await esPieChart.getData(query, 'syscheck.event');

      expect(JSON.stringify(esValues.slice(0, 5)))
      .to.be.equal(JSON.stringify(values));
      await filterBar.removeAllFilters();
    });

    it('should Top 5 users values are correct when add the filter rule.level: 7', async () => {
      await filterBar.addFilter('rule.level', 'is', '7');
      await PageObjects.common.sleep(3000);

      const chartSelector: string = '#Wazuh-App-Overview-FIM-top-agents-user';
      const values: object[] = await tableViz.getValues(chartSelector);

      const fields = [
        {field: 'agent.id', label: 'Agent ID'},
        {field: 'agent.name', label: 'Agent name'},
        {field: 'syscheck.uname_after', label: 'Top user'},
        {method: 'count', field: 'agent.id', label: 'Count'},
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
                    "rule.groups": "syscheck"
                  }
                },        
                {
                  "term": {
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
      await filterBar.removeAllFilters();
    });

    it('should Alerts summary values are correct when add the filter rule.level: 7', async () => {
      await filterBar.addFilter('rule.level', 'is', '7');
      await PageObjects.common.sleep(3000);

      const chartSelector: string = '#Wazuh-App-Overview-FIM-Alerts-summary';
      const values: object[] = await tableViz.getValues(chartSelector);

      const fields = [
        {field: 'agent.name', label: 'Agent'},
        {field: 'syscheck.path', label: 'Path'},
        {field: 'syscheck.event', label: 'Action'},
        {method: 'count', field: 'syscheck.path', label: 'Count'},
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
                    "rule.groups": "syscheck"
                  }
                },        
                {
                  "term": {
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
      await filterBar.removeAllFilters();
    });

    //#endregion

    //#region query bar tests

    it('should Alerts by action over time values are correct when add to the query bar rule.level: 7', async () => {
      await queryBar.setQuery('rule.level:7');
      await queryBar.submitQuery();
      await PageObjects.common.sleep(3000);

      const chartSelector: string = '#Wazuh-App-Agents-FIM-Alerts-by-action-over-time';
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
                    "rule.groups": "syscheck"
                  }
                },        
                {
                  "term": {
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
      const esValues = await esAreaChart.getData(query, 'syscheck.event');

      expect(JSON.stringify(esValues))
      .to.be.equal(JSON.stringify(values));
      await queryBar.setQuery('');
      await queryBar.submitQuery();
      
    });

    it('should Top 5 agents values are correct when add to the query bar rule.level: 7', async () => {
      await queryBar.setQuery('rule.level:7');
      await queryBar.submitQuery();
      await PageObjects.common.sleep(3000);

      const chartSelector: string = '#Wazuh-App-Overview-FIM-Top-5-agents-pie';
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
                    "rule.groups": "syscheck"
                  }
                },        
                {
                  "term": {
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
      const esValues = await esPieChart.getData(query, 'agent.name');

      expect(arrayHelper.compareObjects(values, esValues))
      .to.be.ok();
      await queryBar.setQuery('');
      await queryBar.submitQuery();
    });

    it('should Events summary values are correct when add to the query bar rule.level: 7', async () => {
      await queryBar.setQuery('rule.level:7');
      await queryBar.submitQuery();
      await PageObjects.common.sleep(3000);

      const chartSelector: string = '#Wazuh-App-Overview-FIM-Events-summary';
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
                    "rule.groups": "syscheck"
                  }
                },        
                {
                  "term": {
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

    it('should Rule distribution values are correct when add to the query bar rule.level: 7', async () => {
      await queryBar.setQuery('rule.level:7');
      await queryBar.submitQuery();
      await PageObjects.common.sleep(3000);

      const chartSelector: string = '#Wazuh-App-Overview-FIM-Top-5-rules';
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
                    "rule.groups": "syscheck"
                  }
                },        
                {
                  "term": {
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
      const esValues = await esPieChart.getData(query, 'rule.description');

      expect(JSON.stringify(esValues.slice(0, 5)))
      .to.be.equal(JSON.stringify(values));
      await queryBar.setQuery('');
      await queryBar.submitQuery();
    });

    it('should Actions values are correct when add to the query bar rule.level: 7', async () => {
      await queryBar.setQuery('rule.level:7');
      await queryBar.submitQuery();
      await PageObjects.common.sleep(3000);

      const chartSelector: string = '#Wazuh-App-Overview-FIM-Common-actions';
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
                    "rule.groups": "syscheck"
                  }
                },        
                {
                  "term": {
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
      const esValues = await esPieChart.getData(query, 'syscheck.event');

      expect(JSON.stringify(esValues.slice(0, 5)))
      .to.be.equal(JSON.stringify(values));
      await queryBar.setQuery('');
      await queryBar.submitQuery();
    });

    it('should Top 5 users values are correct when add to the query bar rule.level: 7', async () => {
      await queryBar.setQuery('rule.level:7');
      await queryBar.submitQuery();
      await PageObjects.common.sleep(3000);

      const chartSelector: string = '#Wazuh-App-Overview-FIM-top-agents-user';
      const values: object[] = await tableViz.getValues(chartSelector);

      const fields = [
        {field: 'agent.id', label: 'Agent ID'},
        {field: 'agent.name', label: 'Agent name'},
        {field: 'syscheck.uname_after', label: 'Top user'},
        {method: 'count', field: 'agent.id', label: 'Count'},
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
                    "rule.groups": "syscheck"
                  }
                },        
                {
                  "term": {
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
      await queryBar.setQuery('');
      await queryBar.submitQuery();
    });

    it('should Alerts summary values are correct when add to the query bar rule.level: 7', async () => {
      await queryBar.setQuery('rule.level:7');
      await queryBar.submitQuery();
      await PageObjects.common.sleep(3000);

      const chartSelector: string = '#Wazuh-App-Overview-FIM-Alerts-summary';
      const values: object[] = await tableViz.getValues(chartSelector);

      const fields = [
        {field: 'agent.name', label: 'Agent'},
        {field: 'syscheck.path', label: 'Path'},
        {field: 'syscheck.event', label: 'Action'},
        {method: 'count', field: 'syscheck.path', label: 'Count'},
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
                    "rule.groups": "syscheck"
                  }
                },        
                {
                  "term": {
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
      await queryBar.setQuery('');
      await queryBar.submitQuery();
    });
    
    //#endregion
  });
}