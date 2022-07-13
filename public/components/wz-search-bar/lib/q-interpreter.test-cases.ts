import { IOperator } from './q-interpreter';

type tQueryObject = {
  conjuntion?: string;
  field?: string;
  operator?: IOperator;
  value?: string;
};

type tQITestCase = {
  queryStringFilter: string | null;
  expectedQueryObjects: tQueryObject[];
};

type tQITestCases = {
  [key: string]: tQITestCase;
};

export const TEST_CASES: tQITestCases = {
  'name=test': {
    queryStringFilter: 'name=test',
    expectedQueryObjects: [
      {
        conjuntion: undefined,
        field: 'name',
        operator: '=',
        value: 'test',
      },
    ],
  },
  'name=test and': {
    queryStringFilter: null,
    expectedQueryObjects: [
      {
        conjuntion: undefined,
        field: 'name',
        operator: '=',
        value: 'test',
      },
      {
        conjuntion: ' and',
        field: '',
        operator: undefined,
        value: undefined,
      },
    ],
  },
  'name=test (description)': {
    queryStringFilter: 'name=test (description)',
    expectedQueryObjects: [
      {
        conjuntion: undefined,
        field: 'name',
        operator: '=',
        value: 'test (description)',
      },
    ],
  },
  'name=test1 and more': {
    queryStringFilter: 'name=test1 and more',
    expectedQueryObjects: [
      {
        conjuntion: undefined,
        field: 'name',
        operator: '=',
        value: 'test1 and more',
      },
    ],
  },
  'OR name=test1 and more OR name=test2': {
    queryStringFilter: null,
    expectedQueryObjects: [
      {
        conjuntion: undefined,
        field: '',
        operator: undefined,
        value: undefined,
      },
      {
        conjuntion: 'OR ',
        field: 'name',
        operator: '=',
        value: 'test1 and more',
      },
      {
        conjuntion: ' OR ',
        field: 'name',
        operator: '=',
        value: 'test2',
      },
    ],
  },
  ' OR name=test1 and more OR name=test2': {
    queryStringFilter: null,
    expectedQueryObjects: [
      {
        conjuntion: undefined,
        field: '',
        operator: undefined,
        value: undefined,
      },
      {
        conjuntion: ' OR ',
        field: 'name',
        operator: '=',
        value: 'test1 and more',
      },
      {
        conjuntion: ' OR ',
        field: 'name',
        operator: '=',
        value: 'test2',
      },
    ],
  },
  'AND name=test1 OR more': {
    queryStringFilter: null,
    expectedQueryObjects: [
      {
        conjuntion: undefined,
        field: '',
        operator: undefined,
        value: undefined,
      },
      {
        conjuntion: 'AND ',
        field: 'name',
        operator: '=',
        value: 'test1 OR more',
      },
    ],
  },
  ' AND name=test1 OR more': {
    queryStringFilter: null,
    expectedQueryObjects: [
      {
        conjuntion: undefined,
        field: '',
        operator: undefined,
        value: undefined,
      },
      {
        conjuntion: ' AND ',
        field: 'name',
        operator: '=',
        value: 'test1 OR more',
      },
    ],
  },
  'OR name=test1 OR less': {
    queryStringFilter: null,
    expectedQueryObjects: [
      {
        conjuntion: undefined,
        field: '',
        operator: undefined,
        value: undefined,
      },
      {
        conjuntion: 'OR ',
        field: 'name',
        operator: '=',
        value: 'test1 OR less',
      },
    ],
  },
  ' OR name=test1 OR less': {
    queryStringFilter: null,
    expectedQueryObjects: [
      {
        conjuntion: undefined,
        field: '',
        operator: undefined,
        value: undefined,
      },
      {
        conjuntion: ' OR ',
        field: 'name',
        operator: '=',
        value: 'test1 OR less',
      },
    ],
  },
  ' AND name=test1 (description) OR some': {
    queryStringFilter: null,
    expectedQueryObjects: [
      {
        conjuntion: undefined,
        field: '',
        operator: undefined,
        value: undefined,
      },
      {
        conjuntion: ' AND ',
        field: 'name',
        operator: '=',
        value: 'test1 (description) OR some',
      },
    ],
  },
  'OR name=test1 (desc) OR name=test2': {
    queryStringFilter: null,
    expectedQueryObjects: [
      {
        conjuntion: undefined,
        field: '',
        operator: undefined,
        value: undefined,
      },
      {
        conjuntion: 'OR ',
        field: 'name',
        operator: '=',
        value: 'test1 (desc)',
      },
      {
        conjuntion: ' OR ',
        field: 'name',
        operator: '=',
        value: 'test2',
      },
    ],
  },
  ' OR name=test1 (desc) OR name=test2': {
    queryStringFilter: null,
    expectedQueryObjects: [
      {
        conjuntion: undefined,
        field: '',
        operator: undefined,
        value: undefined,
      },
      {
        conjuntion: ' OR ',
        field: 'name',
        operator: '=',
        value: 'test1 (desc)',
      },
      {
        conjuntion: ' OR ',
        field: 'name',
        operator: '=',
        value: 'test2',
      },
    ],
  },
  'name=test1 and field.item=test1': {
    queryStringFilter: 'name=test1;field.item=test1',
    expectedQueryObjects: [
      {
        conjuntion: undefined,
        field: 'name',
        operator: '=',
        value: 'test1',
      },
      {
        conjuntion: ' and ',
        field: 'field.item',
        operator: '=',
        value: 'test1',
      },
    ],
  },
  'name=test1 and field_item=test1': {
    queryStringFilter: 'name=test1;field_item=test1',
    expectedQueryObjects: [
      {
        conjuntion: undefined,
        field: 'name',
        operator: '=',
        value: 'test1',
      },
      {
        conjuntion: ' and ',
        field: 'field_item',
        operator: '=',
        value: 'test1',
      },
    ],
  },
  'name=test1 and field-item=test1': {
    queryStringFilter: 'name=test1;field-item=test1',
    expectedQueryObjects: [
      {
        conjuntion: undefined,
        field: 'name',
        operator: '=',
        value: 'test1',
      },
      {
        conjuntion: ' and ',
        field: 'field-item',
        operator: '=',
        value: 'test1',
      },
    ],
  },
  'name=test1 and field-item': {
    queryStringFilter: 'name=test1 and field-item',
    expectedQueryObjects: [
      {
        conjuntion: undefined,
        field: 'name',
        operator: '=',
        value: 'test1 and field-item',
      },
    ],
  },
  'manager=wazuh-manager-master-v4.3.4-rc1-7.10.2': {
    queryStringFilter: 'manager=wazuh-manager-master-v4.3.4-rc1-7.10.2',
    expectedQueryObjects: [
      {
        conjuntion: undefined,
        field: 'manager',
        operator: '=',
        value: 'wazuh-manager-master-v4.3.4-rc1-7.10.2',
      },
    ],
  },
  'and manager=wazuh-manager-master-v4.3.4-rc1-7.10.2 and another': {
    queryStringFilter: null,
    expectedQueryObjects: [
      {
        conjuntion: undefined,
        field: '',
        operator: undefined,
        value: undefined,
      },
      {
        conjuntion: 'and ',
        field: 'manager',
        operator: '=',
        value: 'wazuh-manager-master-v4.3.4-rc1-7.10.2 and another',
      },
    ],
  },
  'and manager=wazuh-manager-master-v4.3.4-rc1-7.10.2 and another=value': {
    queryStringFilter: null,
    expectedQueryObjects: [
      {
        conjuntion: undefined,
        field: '',
        operator: undefined,
        value: undefined,
      },
      {
        conjuntion: 'and ',
        field: 'manager',
        operator: '=',
        value: 'wazuh-manager-master-v4.3.4-rc1-7.10.2',
      },
      {
        conjuntion: ' and ',
        field: 'another',
        operator: '=',
        value: 'value',
      },
    ],
  },
  'manager=wazuh-manager-master-v4.3.4-rc1-7.10.2 and another=value': {
    queryStringFilter: 'manager=wazuh-manager-master-v4.3.4-rc1-7.10.2;another=value',
    expectedQueryObjects: [
      {
        conjuntion: undefined,
        field: 'manager',
        operator: '=',
        value: 'wazuh-manager-master-v4.3.4-rc1-7.10.2',
      },
      {
        conjuntion: ' and ',
        field: 'another',
        operator: '=',
        value: 'value',
      },
    ],
  },
  'manager=wazuh-manager-master-v4.3.4-rc1-7.10.2 and another': {
    queryStringFilter: 'manager=wazuh-manager-master-v4.3.4-rc1-7.10.2 and another',
    expectedQueryObjects: [
      {
        conjuntion: undefined,
        field: 'manager',
        operator: '=',
        value: 'wazuh-manager-master-v4.3.4-rc1-7.10.2 and another',
      },
    ],
  },
};

export const TEST_CASES_ARRAY: Array<[string, Array<tQueryObject>]> = Object.keys(
  TEST_CASES
).map((key) => [key, TEST_CASES[key].expectedQueryObjects]);

export const TEST_CASES_STRING_ARRAY: Array<[string, string | null]> = Object.keys(
  TEST_CASES
).map((key) => [key, TEST_CASES[key].queryStringFilter]);
