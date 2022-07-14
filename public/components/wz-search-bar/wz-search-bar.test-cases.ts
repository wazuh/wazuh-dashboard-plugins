interface iTestCase {
  inputs: string[];
  expectedObjectFilters?: { q: string };
}

export const SEARCHBAR_TESTCASES: iTestCase[] = [
  {
    inputs: ['name=test1'],
    expectedObjectFilters: {
      q: 'name=test1',
    },
  },
  {
    inputs: ['name=test1 AND name=test2'],
    expectedObjectFilters: {
      q: 'name=test1;name=test2',
    },
  },
  {
    inputs: ['name=test1 and more'],
    expectedObjectFilters: {
      q: 'name=test1 and more',
    },
  },
  {
    inputs: ['name=test1 and more and group=value'],
    expectedObjectFilters: {
      q: 'name=test1 and more;group=value',
    },
  },
  {
    inputs: ['name=Microsoft Office Home and Business 2016 - en-us'],
    expectedObjectFilters: {
      q: 'name=Microsoft Office Home and Business 2016 - en-us',
    },
  },
  {
    inputs: ['manager=wazuh-manager-master-v4.3.4-rc1-7.10.2'],
    expectedObjectFilters: {
      q: 'manager=wazuh-manager-master-v4.3.4-rc1-7.10.2',
    },
  },
  {
    inputs: ['name=Mozilla Firefox 53.0 (x64 en-US)'],
    expectedObjectFilters: {
      q: 'name=Mozilla Firefox 53.0 (x64 en-US)',
    },
  },
  {
    inputs: ['name=Mozilla Thunderbird 68.0 (x64 en-US)'],
    expectedObjectFilters: {
      q: 'name=Mozilla Thunderbird 68.0 (x64 en-US)',
    },
  },
  {
    inputs: ['name=Microsoft Office Home and Business 2016 - en-us'],
    expectedObjectFilters: {
      q: 'name=Microsoft Office Home and Business 2016 - en-us',
    },
  },
  {
    inputs: ['name=test1 AND name=test2', 'name=001'],
    expectedObjectFilters: {
      q: 'name=test1;name=test2;(name=001)',
    },
  },
  {
    inputs: ['name=test1 AND name=test2', 'name=001 AND name=002'],
    expectedObjectFilters: {
      q: 'name=test1;name=test2;(name=001;name=002)',
    },
  },
  {
    inputs: ['name=test1 OR name=test2', 'name=001'],
    expectedObjectFilters: {
      q: 'name=test1,name=test2;(name=001)',
    },
  },
  {
    inputs: ['name=test1 OR name=test2', 'name=001 OR name=002'],
    expectedObjectFilters: {
      q: 'name=test1,name=test2;(name=001,name=002)',
    },
  },
];

export const CASES_SEARCHBAR_FILTER_OBJECT = SEARCHBAR_TESTCASES.map((item: iTestCase) => {
  return [item.inputs, item.expectedObjectFilters];
});

export const CASES_SEARCHBAR: Array<[string[]]> = SEARCHBAR_TESTCASES.map((item: iTestCase) => {
  return [item.inputs];
});
