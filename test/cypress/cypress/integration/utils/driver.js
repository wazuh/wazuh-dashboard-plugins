/// <reference types="cypress" />
import { XPACK_PAGES_MAPPER } from "./mappers/xpack-pages-mapper";
import { ODFE_PAGES_MAPPER } from "./mappers/odfe-pages-mapper";
import { BASIC_PAGES_MAPPER } from "./mappers/basic-pages-mapper";
import { WZD_PAGES_MAPPER } from "./mappers/wzd-pages-mapper";

export const clickElement = (selector) => {
  getElement(selector).should('not.be.disabled').click();
  return this;
};

export const forceClickElement = (cssSelector) => {
  cy.wait(1000);
  getElement(cssSelector).click({ force: true })
  return this;
};

export const clickElementByContains = (selector, label) => {
  return cy.contains(selector,label).click();
};

export const forceCheckElement = (selector) => {
  getElement(selector).check({ force: true })
  return this;
};

export const forceEnter = (cssSelector) => {
  cy.wait(1000);
  getElement(cssSelector).type('{enter}')
};

export const forceClickElementByXpath = (xpathSelector) => {
  cy.wait(1000);
  getElementByXpath(xpathSelector).click({ force: true })
  return this;
};

export const getAttributeElement = (selector) => {
  return getElement(selector).invoke('attr', 'aria-checked').then(($element) => {
    const value = $element
    return value;
  });
};

export const elementIsNotVisible = (selector) => {
  return getElement(selector).should('not.exist');
};

export const elementIsVisible = (selector) => {
  return getElement(selector).should('exist').should('be.visible');
};

export const elementTextIncludes = (selector, text) => {
  getElement(selector).should('contain', text);
};

export const cleanAndfillField = (selector, text) => {
  getElement(selector).clear().type(text);
  return this;
};

export const fillField = (selector, text) => {
  getElement(selector).type(text);
  return this;
};

export const getElement = (selector) => {
  return cy.get(selector, { timeout: 18000 });
};

export const getSelector = (name, page) => {
  switch (Cypress.env('type')) {
    case 'xpack':
      return XPACK_PAGES_MAPPER[page][name];
    case 'odfe':
      return ODFE_PAGES_MAPPER[page][name];
    case 'basic':
      return BASIC_PAGES_MAPPER[page][name];
    case 'wzd':
      return WZD_PAGES_MAPPER[page][name];
    default:
      return '';
  }
};

export const getAvailableElement = (selector) => {
  return cy.get(selector).should('not.be.disabled');
};

export const interceptAs = (methodUsed, urlUsed, alias) => {
  cy.intercept({
    method: methodUsed,
    url: urlUsed
  }).as(alias);
};

export const navigate = (url) => {
  cy.visit(url);
};

export const validateURLIncludes = (include) => {
  cy.url().should('include', include);
};


// Function that's return the selector by xpath
export const getElementByXpath = (xpathSelector) => {
  return cy.xpath(xpathSelector);
};

export const clickElementByXpath = (xpathSelector) => {
  getElementByXpath(xpathSelector).click();
  return this;
};

export const xpathElementIsVisible = (xpathSelector) => {
  return getElementByXpath(xpathSelector).should('exist').should('be.visible');
};

export const generateRandomName = () => {
  const uniqueSeed = Date.now().toString();
  const getUniqueId = () => Cypress._.uniqueId(uniqueSeed);
  return 'Test-'+getUniqueId();
};

export const timestampToDate = (e) => {
  let newDates = e.getDate() + "/" + (e.getMonth() + 1) + "/" + e.getFullYear() + " " + e.getHours() + ":" + e.getMinutes() + ":" + e.getSeconds();
  return newDates;
};

export const checkInformationElement =  (webLocator, optionsNames, optionLength) => {
  cy.get(webLocator, { timeout: 2000 }).should("be.visible")
  cy.get(webLocator)
    .should(($) => {
      const texts = $.map((i, el) => Cypress.$(el).text())
      const paragraphs = texts.get()
      expect(paragraphs, 'has ' + optionLength + ' paragraphs').to.have.length(optionLength)
      expect(optionsNames, 'has expected [' + optionsNames + '] text in each paragraph [' + paragraphs + ']').to.contains(paragraphs)
    })
}

export const xpathCheckInformationElement=  (webLocator, optionsNames, optionLength) => {
  cy.xpath(webLocator, { timeout: 2000 }).should("be.visible")
  cy.xpath(webLocator)
    .should(($) => {
      const texts = $.map((i, el) => Cypress.$(el).text())
      const paragraphs = texts.get()
      expect(paragraphs, 'has ' + optionLength + ' paragraphs').to.have.length(optionLength)
      expect(optionsNames, 'has expected [' + optionsNames + '] text in each paragraph [' + paragraphs + ']').to.contains(paragraphs)
    })
}


export const getCookiesFromBrowser = (values) => {
  return values.filter(item=>['wz-token', 'wz-user', 'wz-api', 'security_authentication'].includes(item.name))
  .map(item=>{
      return `${item.name}:${item.value}`
  }).join(';');
}

export const retrieveInformation = (url,method,headers,bodyPost) => {
  return cy.request({
    method: method,
    url: url,
    headers: headers,
    body: bodyPost
  }).as('response');
}