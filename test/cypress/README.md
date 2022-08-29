# Automation Cypress

This project contains the [Cypress](https://www.cypress.io/) library for testing.\
Remember to have run the `npm install` command. \
If cypress doesn't install and unzip correctly run the following command `npm run cy:install`.\
Before executing the command `npm start` remember to have the client's server up and running.

## Configuration
set your server ip on `"baseUrl":` parameter inside `cypress.json` file

## Execute tests in debug
run `cypress open`

## Execute test using tags
`npx cypress-tags run -e TAGS='@about'`

## Run special environment variable commands

example:
`npm run start -- --env type=odfe --config baseUrl=https://localhost:5600`

### default setting:
type=`xpack`
baseUrl=`https://localhost:5601/`


### start automated test execution (emulated the execution locally)
### Draft on Spanish 
* (generar imagen de Docker de Cypress con la rama que se quiere probar)
* ingresar al template de "WZD" y modificar el .env con el nombre de la imagen de docker de cypress que se genero previamente
* levantar el contenerdo con docker compose up -d
* eliminar el paquete de WZD que viene pre-instalado:
    - ./bin/opensearch-dashboards-plugin remove wazuh
    - docker compose restart 
* instalar el paquete nuevo (el paquete que se usa en el GitHub Action) y ejecutar:
    - ./bin/opensearch-dashboards-plugin install https://packages-dev.wazuh.com/pre-release/ui/dashboard/wazuh-4.3.5-1.zip
    - reiciar docker
    - check WZD
* ingresar al Path del template de wzd y ejecutar:
    - docker exec $(docker-compose ps -q cypress) bash -c " . /home/automation/nvm/nvm.sh && nvm use && npm run cypress:run-headless:github-actions:wzd"

