Then('The backend response indicates that the logs are reloaded', () => {
  cy.get('@apiCheck').should('not.be.null');
  cy.wait('@apiCheck').then( (interceptedObject) => {
    expect(interceptedObject.response.statusCode).to.equal(200);
  });
});
