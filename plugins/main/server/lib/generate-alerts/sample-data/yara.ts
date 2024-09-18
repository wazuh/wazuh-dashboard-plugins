import { Random } from '../helpers/random';
import { Rule } from '../types';
import { AlertRandomData } from './alert-random-data';
import { DECODER } from './common';
import { RuleGenerator } from './rule-random-date';

class YaraRandomData extends AlertRandomData {
  private readonly LOCATION = ['/var/ossec/logs/active-responses.log'];

  private readonly SCANNED_FILE = ['webshell', 'exploit', 'backdoor'];

  private readonly TAGS = ['DEMO', 'LINUX', 'SCRIPT', 'T1505_003', 'WEBSHELL'];

  private readonly FILE_EXTENSIONS = ['php', 'html', 'js', 'txt'];

  private readonly RULE_BASE = 'Webshell';

  private readonly RULE_STATE = ['Worse', 'Better'];

  private readonly RULE_AUTHOR = [
    'Lilli Pfister',
    'Niina Nyholm',
    'Salma Sundqvist',
    'Bety Guzman',
    'Itumeleng Smit',
  ];

  private readonly LOG_TYPES = ['INFO', 'WARNING', 'ERROR'];

  private readonly API_CUSTOMERS = ['demo', 'test', 'prod'];

  constructor(private ruleGenerator: RuleGenerator) {
    super();
  }

  override get decoder() {
    return DECODER.YARA;
  }

  override get location(): string {
    return Random.arrayItem(this.LOCATION);
  }

  override get rule(): Rule {
    return {
      level: this.ruleGenerator.level,
      id: this.ruleGenerator.id,
      description: 'File "" is a positive match. Yara rule: ',
      firedtimes: this.ruleGenerator.firedtimes,
      mail: this.ruleGenerator.mail,
      groups: ['yara'],
    };
  }

  override get data() {
    return {
      YARA: {
        reference: Random.createHash(32),
        api_customer: Random.arrayItem(this.API_CUSTOMERS),
        log_type: Random.arrayItem(this.LOG_TYPES),
        scanned_file: this.scanned_file,
        rule_author: Random.arrayItem(this.RULE_AUTHOR),
        rule_name: this.rule_name,
        rule_description: this.rule_description,
        tags: this.TAGS,
        published_date: Random.date(),
      },
    };
  }

  private get rule_description() {
    return `Web Shell - file ${Random.arrayItem(
      this.RULE_STATE,
    )}.${Random.arrayItem(this.FILE_EXTENSIONS)}`;
  }

  private get rule_name() {
    return `${this.RULE_BASE}_${Random.arrayItem(
      this.RULE_STATE,
    )}_Linux_Shell_${Random.number(1, 10)}_RID${Random.number(100, 999)}`;
  }

  private get scanned_file() {
    return `/home/wazuh-user/yara/malware/${Random.arrayItem(
      this.SCANNED_FILE,
    )}/${Random.arrayItem(this.FILE_EXTENSIONS)}`;
  }
}

export default new YaraRandomData(new RuleGenerator());
