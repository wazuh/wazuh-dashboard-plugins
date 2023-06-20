import { decodeJsonRule, getJsonFromRule, getSelectedUsersFromRules } from './rule-editor.helper';
const internalUsers = [{ user: 'admin' }, { user: 'test' }, { user: 'test2' }];

const internalUsersRules = [
  { user_field: 'user_name', searchOperation: 'FIND', value: 'admin' },
  { user_field: 'user_name', searchOperation: 'FIND', value: 'test' },
  { user_field: 'user_name', searchOperation: 'FIND', value: 'test2' },
];

const internalUsersRulesJsonObject = {
  OR: [
    {
      FIND: {
        user_name: 'admin',
      },
    },
    {
      FIND: {
        user_name: 'test',
      },
    },
    {
      FIND: {
        user_name: 'test2',
      },
    },
  ],
};

const customRules = [
  { user_field: 'user_name', searchOperation: 'FIND', value: 'admin' },
  { user_field: 'user_email', searchOperation: 'FIND', value: 'admin@admin' },
  { user_field: 'user_id', searchOperation: 'FIND', value: '10' },
];

const customRulesJsonObject = {
  AND: [
    {
      FIND: {
        user_name: 'admin',
      },
    },
    {
      FIND: {
        user_email: 'admin@admin',
      },
    },
    {
      FIND: {
        user_id: '10',
      },
    },
  ],
};

const bothRulesJsonObject = {
  OR: [{ ...internalUsersRulesJsonObject }, { ...customRulesJsonObject }],
};

describe('Rule Editor Helper', () => {
  describe('Decode Json Rule', () => {
    describe('Given a Json with only internal users rules', () => {
      it('Should return all the interal users rules', () => {
        const json = JSON.stringify(internalUsersRulesJsonObject);
        const result = decodeJsonRule(json, internalUsers);
        expect(result).toEqual({
          customRules: [],
          internalUsersRules,
          wrongFormat: false,
          logicalOperator: 'OR',
        });
      });
    });

    describe('Given a Json with only custom rules', () => {
      it('Should return all the custom rules', () => {
        const json = JSON.stringify(customRulesJsonObject);
        const result = decodeJsonRule(json, internalUsers);
        expect(result).toEqual({
          customRules,
          internalUsersRules: [],
          wrongFormat: false,
          logicalOperator: 'AND',
        });
      });
    });

    describe('Given a Json with internal users rules and custom rules', () => {
      it('Should return all the rules', () => {
        const json = JSON.stringify(bothRulesJsonObject);
        const result = decodeJsonRule(json, internalUsers);
        expect(result).toEqual({
          customRules,
          internalUsersRules,
          wrongFormat: false,
          logicalOperator: 'AND',
        });
      });
    });

    describe('Given a Json  without initial operator', () => {
      it('Should return wrong format', () => {
        const json = JSON.stringify(customRulesJsonObject.AND);
        const result = decodeJsonRule(json, internalUsers);
        expect(result).toEqual({
          customRules: [],
          internalUsersRules: [],
          wrongFormat: true,
          logicalOperator: 'AND',
        });
      });
    });

    describe('Given a Json with one wrong format array rules', () => {
      it('Should return all rules but with wrong format', () => {
        const json = JSON.stringify({
          OR: [{ foo: 'bar' }],
        });
        const result = decodeJsonRule(json, internalUsers);
        expect(result.wrongFormat).toEqual(true);
      });
    });

    describe('Given a Json with one wrong format array rules', () => {
      it('Should return all rules but with wrong format', () => {
        const json = JSON.stringify({
          OR: [
            {
              AND: [{ find: { user_name: 'wazuh' } }, { find: { user_email: 'wazuh@wauzh' } }],
            },
          ],
        });
        const result = decodeJsonRule(json, internalUsers);
        expect(result.wrongFormat).toEqual(true);
      });
    });

    describe('Given a Json with two wrong format array rules', () => {
      it('Should return all rules but with wrong format', () => {
        const json = JSON.stringify({
          OR: [
            {
              OR: [{ foo: { bar: 10 } }],
            },
            {
              AND: [{ find: { user_name: 'wazuh' } }, { find: { user_email: 'wazuh@wauzh' } }],
            },
          ],
        });
        const result = decodeJsonRule(json, internalUsers);
        expect(result.wrongFormat).toEqual(true);
      });
    });
  });

  describe('Get Json From Rule', () => {
    describe('Given only an array of internal rules', () => {
      it('Should retuns the correct Json object', () => {
        const JsonObject = getJsonFromRule(internalUsersRules, [], 'AND');

        expect(JsonObject).toEqual(internalUsersRulesJsonObject);
      });
    });

    describe('Given only an array of custom rules', () => {
      it('Should retuns the correct Json object', () => {
        const JsonObject = getJsonFromRule([], customRules, 'AND');

        expect(JsonObject).toEqual(customRulesJsonObject);
      });
    });

    describe('Given an array of custom rules and an array of internal users rules', () => {
      it('Should retuns the correct Json object', () => {
        const JsonObject = getJsonFromRule(internalUsersRules, customRules, 'AND');

        expect(JsonObject).toEqual(bothRulesJsonObject);
      });
    });

    describe('Given no one rule', () => {
      it('Should retuns the correct Json object', () => {
        const JsonObject = getJsonFromRule([], [], 'AND');

        expect(JsonObject).toEqual({});
      });
    });
  });

  describe('Get Selected Users From Rules', () => {
    describe('Given an array of rules', () => {
      it('Should return the correct array mapped of roles', () => {
        const correctSelectedRules = [
          { label: 'admin', id: 'admin' },
          { label: 'test', id: 'test' },
          { label: 'test2', id: 'test2' },
        ];

        const selectedUsers = getSelectedUsersFromRules(internalUsersRules);
        expect(selectedUsers).toEqual(correctSelectedRules);
      });
    });
  });

  describe('Test role-mapping behavior', () => {
    describe('Given a non null rules array and non null internal users array ', () => {
      it('Should return OR array', () => {
        const internalUsers = [{
          searchOperation: "FIND",
          user_field: "user_field",
          value: "Test_User",
        }];
        const rules = [{
          searchOperation: "FIND",
          user_field: "user_field",
          value: "wazuh",
        }];

        const expectedValues = {
          "OR": [
            {"OR": [{"FIND": {"user_field": "Test_User"}}]},
            {"AND": [{"FIND": {"user_field": "wazuh"}}]}
          ]
        };

        const currentData = getJsonFromRule(internalUsers, rules, "AND");

        expect(currentData).toEqual(expectedValues);
      });
    });
    describe('Given a null rules array and internal users array with one element', () => {
      it('Should return an object', () => {
        const internalUsers = [{
          searchOperation: "FIND",
          user_field: "user_field",
          value: "Test_User",
        }];
        const rules = [];

        const expectedValues = {
          "FIND": {
            "user_field": "Test_User"
          }
        }

        const currentData = getJsonFromRule(internalUsers, rules, "AND");

        expect(currentData).toEqual(expectedValues);
      });
    });
    describe('Given a rules array with one element and null internal users array', () => {
      it('Should return an object', () => {
        const internalUsers = [];
        const rules = [{
          searchOperation: "FIND",
          user_field: "user_field",
          value: "wazuh",
        }];

        const expectedValues = {
          "FIND": {
            "user_field": "wazuh"
          }
        }

        const currentData = getJsonFromRule(internalUsers, rules, "AND");

        expect(currentData).toEqual(expectedValues);
      });
    });
    describe('Given a rules array with two or more elements and null internal users array', () => {
      it('should return an object with one item equals to the logicalOperator (AND) array with all items', () => {
        const internalUsers = [];
        const rules = [
          {
            searchOperation: "FIND",
            user_field: "user_name",
            value: "wazuh",
          },
          {
            searchOperation: "FIND",
            user_field: "user_name2",
            value: "wazuh",
          },
        ];

        const expectedValues = {
          "AND": [
            {"FIND": {"user_name": "wazuh"}},
            {"FIND": {"user_name2": "wazuh"}}
          ]
        }

        const currentData = getJsonFromRule(internalUsers, rules, "AND");

        expect(currentData).toEqual(expectedValues);
      });
    });
    describe('Given a rules array with two or more elements and null internal users array', () => {
      it('should return an object with one item equals to the logicalOperator (OR) array with all items', () => {
        const internalUsers = [];
        const rules = [
          {
            searchOperation: "FIND",
            user_field: "user_name",
            value: "wazuh",
          },
          {
            searchOperation: "FIND",
            user_field: "user_name2",
            value: "wazuh",
          },
        ];

        const expectedValues = {
          "OR": [
            {"FIND": {"user_name": "wazuh"}},
            {"FIND": {"user_name2": "wazuh"}}
          ]
        }

        const currentData = getJsonFromRule(internalUsers, rules, "OR");

        expect(currentData).toEqual(expectedValues);
      });
    });
    describe('Given a user rules array with two or more elements and null rules array', () => {
      it('should return an object with one \'OR\' array with all items', () => {
        const internalUsers = [
          {
            searchOperation: "FIND",
            user_field: "user_name",
            value: "Test_User",
          },
          {
            searchOperation: "FIND",
            user_field: "user_name",
            value: "admin",
          }];
        
        const rules = [];

        const expectedValues = 
        {
          "OR": [
            {"FIND": {"user_name": "Test_User"}},
            {"FIND": {"user_name": "admin"}}
          ]
        }

        const currentData = getJsonFromRule(internalUsers, rules, "AND");

        expect(currentData).toEqual(expectedValues);
      });
    });

  });

});