import { When } from 'cypress-cucumber-preprocessor/steps';
import { clickElement, elementIsVisible, getSelector } from '../../../utils/driver';
import { DECODERS_PAGE as pageName } from '../../../utils/pages-constants';
const firstCustomDecoder = getSelector('firstCustomDecoder', pageName);
const xmlDecoderFile = getSelector('xmlDecoderFile', pageName);

When('The user selects a custom decoders to edit', () => {
  elementIsVisible(firstCustomDecoder);
  clickElement(firstCustomDecoder);
  elementIsVisible(xmlDecoderFile);
  clickElement(xmlDecoderFile);
});
