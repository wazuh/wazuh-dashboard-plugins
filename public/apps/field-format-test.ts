import { FieldFormat } from '../../../../src/plugins/data/common/'
import { HtmlContextTypeConvert } from '../../../../src/plugins/data/common/';
import { OSD_FIELD_TYPES } from '../../../../src/plugins/data/common/';
import { template } from 'lodash';

const convertTemplate = template('<span style="<%- style %>"><%- val %></span>');

export class CustomFieldFormat extends FieldFormat {
  static id = 'WAZUH-CUSTOM-FORMAT';
  static title = 'Wazuh custom format';
  static fieldType = [OSD_FIELD_TYPES.NUMBER, OSD_FIELD_TYPES.STRING];


  htmlConvert: HtmlContextTypeConvert = (val) => {

    let style = '';
    style += `color: #F00;`;
    style += `background-color: #CCC;`;
    return convertTemplate({ val, style });
  };
}
