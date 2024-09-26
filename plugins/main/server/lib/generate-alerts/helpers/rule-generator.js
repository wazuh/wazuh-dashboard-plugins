const {
  ALERT_ID_MAX,
  RULE_MAX_FIREDTIMES,
  RULE_MAX_LEVEL,
} = require('../constants');
const { Random } = require('./random');
const {
  FREQUENCY,
  GDPR,
  GPG13,
  HIPAA,
  NIST_800_53,
  PCI,
  PCI_DSS,
  tsc,
} = require('../sample-data/regulatory-compliance');

const RuleGenerator = {
  id: () => Random.number(1, ALERT_ID_MAX).toString(),
  level: () => Random.number(1, RULE_MAX_LEVEL),
  firedtimes: () => Random.number(1, RULE_MAX_FIREDTIMES),
  mail: () => Math.random() < 0.5,
  gdpr: () => Random.uniqueValues(Random.number(1, 2), GDPR),
  pci_dss: () => Random.uniqueValues(Random.number(1, 3), PCI_DSS),
  tsc: () => Random.uniqueValues(Random.number(1, 6), tsc),
  hipaa: () => Random.uniqueValues(Random.number(1, 3), HIPAA),
  nist_800_53: () => Random.uniqueValues(Random.number(1, 4), NIST_800_53),
  gpg13: () => Random.uniqueValues(Random.number(1, 3), GPG13),
  pci: () => Random.uniqueValues(1, PCI),
  frequency: () => Random.arrayItem(FREQUENCY),
};

module.exports.RuleGenerator = RuleGenerator;
