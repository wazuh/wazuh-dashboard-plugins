import { ALERT_ID_MAX } from '../constants';
import { Random } from '../helpers/random';
import { Alert } from '../types';
import { AGENTS, DECODER } from './common';

export abstract class AlertRandomData implements Alert {
  createAlert(): Alert {
    const result: Alert = {
      id: this.id,
      agent: this.agent,
      cluster: this.cluster,
      data: this.data,
      decoder: this.decoder,
      location: this.location,
      manager: this.manager,
      rule: this.rule,
      timestamp: this.timestamp,
    };
    if (this.predecoder) {
      result.predecoder = this.predecoder;
    }
    if (this.fields) {
      result.fields = this.fields;
    }
    if (this.full_log) {
      result.full_log = this.full_log;
    }
    if (this.GeoLocation) {
      result.GeoLocation = this.GeoLocation;
    }
    if (this.input) {
      result.input = this.input;
    }
    if (this.previous_output) {
      result.previous_output = this.previous_output;
    }
    if (this.syscheck) {
      result.syscheck = this.syscheck;
    }
    return result;
  }

  get id(): Alert['id'] {
    return Random.number(1, ALERT_ID_MAX).toString();
  }

  get agent(): Alert['agent'] {
    return Random.arrayItem(AGENTS);
  }

  get cluster(): Alert['cluster'] {
    return {
      node: 'master',
      name: 'wazuh1',
    };
  }

  abstract get data(): Alert['data'];

  get decoder(): Alert['decoder'] {
    return DECODER.JSON;
  }

  abstract get location(): Alert['location'];

  get manager(): Alert['manager'] {
    return { name: 'wazuh-manager-master-0' };
  }

  get predecoder(): Alert['predecoder'] {
    return undefined;
  }

  abstract get rule(): Alert['rule'];

  get timestamp(): Alert['timestamp'] {
    return '2020-01-27T11:08:47.777+0000';
  }

  get fields(): Alert['fields'] {
    return undefined;
  }

  get full_log(): Alert['full_log'] {
    return undefined;
  }

  get GeoLocation(): Alert['GeoLocation'] {
    return undefined;
  }

  get input(): Alert['input'] {
    return undefined;
  }

  get previous_output(): Alert['previous_output'] {
    return undefined;
  }

  get syscheck(): Alert['syscheck'] {
    return undefined;
  }
}
