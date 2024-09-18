import {
  ALERT_ID_MAX,
  RULE_DESCRIPTION,
  RULE_MAX_FIREDTIMES,
  RULE_MAX_LEVEL,
} from '../constants';
import { Random } from '../helpers/random';
import { Rule } from '../types';
import {
  FREQUENCY,
  GDPR,
  GPG13,
  HIPAA,
  NIST_800_53,
  PCI,
  PCI_DSS,
  TSC,
} from './regulatory-compliance';

export class RuleGenerator implements Rule {
  get id() {
    return Random.number(1, ALERT_ID_MAX).toString();
  }

  groups: Rule['groups'] = [];

  get level(): Rule['level'] {
    return Random.number(1, RULE_MAX_LEVEL);
  }

  get description(): Rule['description'] {
    return Random.arrayItem(RULE_DESCRIPTION);
  }

  get firedtimes(): Rule['firedtimes'] {
    return Random.number(1, RULE_MAX_FIREDTIMES);
  }

  get mail(): Rule['mail'] {
    return Math.random() < 0.5;
  }

  get gdpr(): Rule['gdpr'] {
    return Random.uniqueValues(Random.number(1, 2), GDPR);
  }

  get pci_dss(): Rule['pci_dss'] {
    return Random.uniqueValues(Random.number(1, 3), PCI_DSS);
  }

  get tsc(): Rule['tsc'] {
    return Random.uniqueValues(Random.number(1, 6), TSC);
  }

  get hipaa(): Rule['hipaa'] {
    return Random.uniqueValues(Random.number(1, 3), HIPAA);
  }

  get nist_800_53(): Rule['nist_800_53'] {
    return Random.uniqueValues(Random.number(1, 4), NIST_800_53);
  }

  get gpg13(): Rule['gpg13'] {
    return Random.uniqueValues(Random.number(1, 3), GPG13);
  }

  get pci(): Rule['pci'] {
    return Random.uniqueValues(1, PCI);
  }

  get frequency(): Rule['frequency'] {
    return Random.arrayItem(FREQUENCY);
  }

  get info(): Rule['info'] {
    return '';
  }
}
