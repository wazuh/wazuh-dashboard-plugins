const {
  Random,
} = require('../../../../plugins/main/server/lib/generate-alerts/helpers/random');
const { RuleGenerator } = require('../helpers/rule-generator');

/*
  ┌─────────────────────────────────────────────────────────────────────────┐
  │ CONSTANTS                                                               │
  └─────────────────────────────────────────────────────────────────────────┘
 */

const GROUPS = ['yara'];
const SCANNED_FILE = ['webshell', 'exploit', 'backdoor'];
const TAGS = ['DEMO', 'LINUX', 'SCRIPT', 'T1505_003', 'WEBSHELL'];
const FILE_EXTENSIONS = ['php', 'html', 'js', 'txt'];
const RULE_BASE = 'Webshell';
const RULE_STATE = ['Worse', 'Better'];
const RULE_AUTHOR = [
  'Lilli Pfister',
  'Niina Nyholm',
  'Salma Sundqvist',
  'Bety Guzman',
  'Itumeleng Smit',
];
const LOG_TYPES = ['INFO', 'WARNING', 'ERROR'];
const API_CUSTOMERS = ['demo', 'test', 'prod'];

const rule_description = `Web Shell - file ${Random.arrayItem(
  RULE_STATE,
)}.${Random.arrayItem(FILE_EXTENSIONS)}`;

const rule_name = `${RULE_BASE}_${Random.arrayItem(
  RULE_STATE,
)}_Linux_Shell_${Random.number(1, 10)}_RID${Random.number(100, 999)}`;

const scanned_file = `/home/wazuh-user/yara/malware/${Random.arrayItem(
  SCANNED_FILE,
)}/${Random.arrayItem(FILE_EXTENSIONS)}`;

const DESCRIPTION = ['File "" is a positive match. Yara rule: '];

const LOCATION = '/var/ossec/logs/active-responses.log';

/*
  ┌─────────────────────────────────────────────────────────────────────────┐
  │ GENERATORS                                                              │
  └─────────────────────────────────────────────────────────────────────────┘
 */

const generateRule = () => ({
  level: RuleGenerator.level(),
  id: RuleGenerator.id(),
  description: Random.arrayItem(DESCRIPTION),
  firedtimes: RuleGenerator.firedtimes(),
  mail: RuleGenerator.mail(),
  groups: GROUPS,
});

const generateData = () => ({
  YARA: {
    reference: Random.createHash(32),
    api_customer: Random.arrayItem(API_CUSTOMERS),
    log_type: Random.arrayItem(LOG_TYPES),
    scanned_file: scanned_file,
    rule_author: Random.arrayItem(RULE_AUTHOR),
    rule_name: rule_name,
    rule_description: rule_description,
    tags: TAGS,
    published_date: Random.date(),
  },
});

/*
  ┌─────────────────────────────────────────────────────────────────────────┐
  │ EXPORTS                                                                 │
  └─────────────────────────────────────────────────────────────────────────┘
 */

module.exports.createAlert = () => {
  return {
    location: LOCATION,
    rule: generateRule(),
    data: generateData(),
  };
};
