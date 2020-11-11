export const getJsonFromRule = (internalUserRules, rules, logicalOperator) => {
  const ruleObject: any = {};
  const usersRulesArray = internalUserRules.map(item => {
    const tmpRule = {};
    tmpRule[item.searchOperation] = {};
    tmpRule[item.searchOperation][item.user_field] = item.value;
    return tmpRule;
  });
  const rulesArray = rules.map(item => {
    const tmpRule = {};
    tmpRule[item.searchOperation] = {};
    tmpRule[item.searchOperation][item.user_field] = item.value;
    return tmpRule;
  });
  if (usersRulesArray.length && rulesArray.length) {
    ruleObject['OR'] = [
      {
        OR: usersRulesArray,
      },
      {
        [logicalOperator]: rulesArray,
      },
    ];
  } else {
    if (usersRulesArray.length) {
      ruleObject['OR'] = usersRulesArray;
    }
    if (rulesArray.length) {
      ruleObject[logicalOperator] = rulesArray;
    }
  }
  return ruleObject;
};

const formatRules = rulesArray => {
  let wrongFormat = false;
  const tmpRules = rulesArray.map((item, idx) => {
    if (Object.keys(item).length !== 1 || Array.isArray(item[Object.keys(item)[0]])) {
      wrongFormat = true;
    }
    const searchOperationTmp = Object.keys(item)[0];
    if (Object.keys(item[searchOperationTmp]).length !== 1) {
      wrongFormat = true;
    }
    const userFieldTmp = Object.keys(item[searchOperationTmp])[0];
    const valueTmp = item[searchOperationTmp][userFieldTmp];

    return { user_field: userFieldTmp, searchOperation: searchOperationTmp, value: valueTmp };
  });

  return { tmpRules, wrongFormat };
};

const hasInternalUsers = (rules, internalUsers) => {
  return rules.every(rule => {
    return internalUsers.some(user => user.user === rule.value);
  });
};

const getFormatedRules = (rulesArray, internalUsers) => {
  let customeRules = [];
  let internalUsersRules = [];
  let wrongFormat = false;
  let formatedRules;
  let logicalOperator;

  const operatorsCount = rulesArray.filter(rule => Array.isArray(rule[Object.keys(rule)[0]]))
    .length;
  switch (operatorsCount) {
    case 0: // only custome rules or internal users
      formatedRules = formatRules(rulesArray);
      wrongFormat = formatedRules.wrongFormat;
      if (!wrongFormat && hasInternalUsers(formatedRules.tmpRules, internalUsers)) {
        internalUsersRules = formatedRules.tmpRules;
      } else if (!wrongFormat) {
        customeRules = formatedRules.tmpRules;
      }
      break;
    case 2: // internal users and custome rules
      let operator;
      // get internal users rules
      operator = Object.keys(rulesArray[0])[0];
      formatedRules = formatRules(rulesArray[0][operator]);
      wrongFormat = formatedRules.wrongFormat;
      if (!wrongFormat && hasInternalUsers(formatedRules.tmpRules, internalUsers)) {
        internalUsersRules = formatedRules.tmpRules;
        customeRules = formatedRules.tmpRules;
      } else {
        // set all rules as custome rules
        formatedRules = formatRules(rulesArray);
        customeRules = formatedRules.tmpRules;
        wrongFormat = true;
        break;
      }

      //get custome rules
      operator = Object.keys(rulesArray[1])[0];
      formatedRules = formatRules(rulesArray[1][operator]);
      customeRules = formatedRules.tmpRules;
      wrongFormat = formatedRules.wrongFormat;
      logicalOperator = operator || 'AND';

      break;
    default:
      // set all rules as custome rules
      formatedRules = formatRules(rulesArray);
      customeRules = formatedRules.tmpRules;
      wrongFormat = true;
  }

  return { customeRules, internalUsersRules, wrongFormat, logicalOperator };
};

export const decodeJsonRule = (jsonRule, internalUsers) => {
  try {
    var wrongFormat = false;
    const ruleObject = JSON.parse(jsonRule);
    if (Object.keys(ruleObject).length !== 1) {
      wrongFormat = true;
    }
    var logicalOperator = Object.keys(ruleObject)[0];
    var rulesArray;
    if (logicalOperator === 'AND' || logicalOperator === 'OR') {
      rulesArray = ruleObject[logicalOperator];
    } else {
      rulesArray = [ruleObject];
      logicalOperator = 'AND';
    }
    const formatedRules = getFormatedRules(rulesArray, internalUsers);

    return {
      customeRules: formatedRules.customeRules,
      internalUsersRules: formatedRules.internalUsersRules,
      wrongFormat: wrongFormat || formatedRules.wrongFormat,
      logicalOperator: formatedRules.logicalOperator || logicalOperator,
    };
  } catch (error) {
    return { customeRules: [], internalUsersRules: [], wrongFormat: true };
  }
};

export const getSelectedUsersFromRules = rules => {
  return rules.map(rule => ({ label: rule.value, id: rule.value }));
};
