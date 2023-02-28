/*
  Description: this script generates a file with the extrated data of Wazuh API 4.0, formatted to use in Wazuh app.

  Requirements:
    - Wazuh manager 4.0 up

  Use: node generate-api-4.0-info.js WAZUH_API_URL [-f filename]

  The generated files will be saved in OUTPUT_ENDPOINTS_PATH.

  Note: if new endpoints are created or are not defined in documentation file, add them with their links.
        The documentation file is a dependency of this script to get the documentation links.
*/

// Import required packages
const fs = require('fs');
const path = require('path');
const packageJSON = require('../../package.json');

// Constants
const WAZUH_API_URL = process.argv[2]; // Wazuh API url is a required argument
// Get console input as string
const consoleInput = [...process.argv].slice(2).join(' ');
// Regular expressions
const reFilename = /-f ([\S]+)/;
const reEndpointPathArgs = /\{([^}]+)\}/g; // Regular expresion to get the endpoint path arguments
const reFormatter = /--full/

const OUTPUT_MODE_FULL = consoleInput.match(reFormatter) && true;
const PLUGIN_VERSION_SHORT = packageJSON.version.split('.').splice(0,2).join('.');
const WAZUH_DOCUMENTATION_API_REFERENCE_URL = `https://documentation.wazuh.com/${PLUGIN_VERSION_SHORT}/user-manual/api/reference.html`;
const OUTPUT_ENDPOINTS_FILENAME = `${(consoleInput.match(reFilename) || [])[1] || 'endpoints'}.json`;
const OUTPUT_SECURITY_ACTIONS_FILENAME = 'security-actions.json';
const OUTPUT_DIRECTORY = path.join(__dirname, 'output');

// Define console color codes
const CONSOLE_COLORS_CODES = {
  BLACK: 30,
  RED: 31,
  GREEN: 32,
  YELLOW: 33,
  BLUE: 34,
  MAGENTA: 35,
  CYAN: 36,
  WHITE: 37
};

// Main method
const main = () => {
  // Check Wazuh API url argument is defined
  if(!WAZUH_API_URL){
    exitWithMessage('Wazuh API url is not defined.');
  };
  // Check Wazuh API url argument is valid
  if(!WAZUH_API_URL.startsWith('http') ){
    exitWithMessage(`Wazuh API url is not valid. It should start with "http". Example: https://172.16.1.2:55000`);
  };

  // Log the configuration:
  console.log('--------------- Configuration ---------------');
  console.log(`Wazuh API url: ${WAZUH_API_URL}`);
  console.log(`Output directory: ${OUTPUT_DIRECTORY}`);
  console.log(`Output endpoints mode: ${OUTPUT_MODE_FULL ? 'Full': 'Simple'}`);
  console.log('----------------------------------------------')

  if (!fs.existsSync(OUTPUT_DIRECTORY)){
    fs.mkdirSync(OUTPUT_DIRECTORY);
    logger.info(`Created ${OUTPUT_DIRECTORY} directory`);
  };

  generateAPIEndpointsInformation();
  generateAPISecurityActionsInformation();
}

// Genearate API endpoints information
const generateAPIEndpointsInformation = async () => {
  try{
    // Request to API swagger.json file
    const apiData = await request(`${WAZUH_API_URL}/openapi.json`);
    // Parse response to JSON
    const jsonData = JSON.parse(apiData);
    // Extract the endpoints, mapped as { [httpMethod: ('GET' | 'PUT' | 'POST' | 'DELETE' | 'HEAD')]: endpoint[]}
    const extractedEndpoints = Object.keys(jsonData.paths).reduce((accum, endpointPath) => {
      const endpointData = jsonData.paths[endpointPath];
      Object.keys(endpointData).forEach(httpMethod => {
        const httpMethodUppercase = httpMethod.toUpperCase();
        accum[httpMethodUppercase] = [...accum[httpMethodUppercase], formatEndpoint({...endpointData[httpMethod], path: endpointPath, method: httpMethodUppercase}, jsonData)]
      });
      return accum;
    }, ['GET', 'PUT', 'POST', 'DELETE'].reduce((accum, httpMethod) => ({...accum, [httpMethod]: []}), {}));
    // Map extracted endpoints to <{ method: ('GET' | 'PUT' | 'POST' | 'DELETE' | 'HEAD'), endpoints: endpoint[]}>[]
    const resultEndpoints = Object.keys(extractedEndpoints).map(httpMethod => ({method: httpMethod, endpoints: extractedEndpoints[httpMethod].sort(sortAlphabeticalByNameProp)}));

    // Save the formatted endpoints data to a file
    saveFileToOutputDir(OUTPUT_ENDPOINTS_FILENAME, JSON.stringify(resultEndpoints, null, 2));
  }catch(error){
    logger.error('An error appeared:', error);
  };

}

// Generates security actions information
const generateAPISecurityActionsInformation = async () => {
  // Check Wazuh API url argument is defined
  if(!WAZUH_API_URL){
    exitWithMessage('Wazuh API url is not defined.');
  };
  // Check Wazuh API url argument is valid
  if(!WAZUH_API_URL.startsWith('http') ){
    exitWithMessage(`Wazuh API url is not valid. It should start with "http". Example: https://172.16.1.2:55000`);
  };
  const username = 'wazuh';
  const password = 'wazuh';
  try{
    const authenticationResponse = await request(`${WAZUH_API_URL}/security/user/authenticate`, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(username + ':' + password).toString('base64')
      }
    });
    // console.log(authenticationResponse, typeof authenticationResponse, JSON.parse(authenticationResponse), JSON.parse(authenticationResponse).data.token)
    const { token } = JSON.parse(authenticationResponse).data;
    const securityActionsResponse = await request(`${WAZUH_API_URL}/security/actions`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const securityActions = JSON.parse(securityActionsResponse).data;
    // Save the formatted endpoints data to a file
    saveFileToOutputDir(OUTPUT_SECURITY_ACTIONS_FILENAME, JSON.stringify(securityActions, null, 2));
  }catch(error){
    logger.error('An error appeared:', error);
  }
}

// Utilities
const request = (apiEndpoint, options = {}) => {
  let requestPackage;
  if(apiEndpoint.startsWith('http:')){
    requestPackage = require('http');
  }else if(apiEndpoint.startsWith('https:')){
    requestPackage = require('https');
  }else{
    exitWithMessage('Endpoint should start with "http" or "https"');
  };
  return new Promise((resolve, reject) => {
    requestPackage.get(apiEndpoint, {rejectUnauthorized: false, ...options}, (response) => {
      let data = '';

      // A chunk of data has been recieved
      response.on('data', chunk => {
        data += chunk;
      });

      // The whole response has been received. Print out the result
      response.on('end', () => {
        resolve(data);
      });

      // Manage the error
      response.on("error", (error) => {
        reject(error);
      });
    })
  })
}
// Formatters
// Format the endpoint to use in the Wazuh app
const formatEndpoint = (endpointData, jsonData) => {
  const formattedParameters = endpointData.parameters && endpointData.parameters
    .filter(parameter => parameter.$ref)
    .map(parameter => getNestedObject(jsonData, parameter.$ref.split('/').splice(1)))
    .map((parameter) => extendParamReference(parameter, jsonData))
  || [];
  const endpointPathParams = formattedParameters.filter(parameter => parameter.in === 'path');
  const endpointQueryParams = formattedParameters.filter(parameter => parameter.in === 'query');
  const endpointBodyParams = (
    endpointData.requestBody
      && endpointData.requestBody.content
      && endpointData.requestBody.content['application/json']
      && endpointData.requestBody.content['application/json'].schema
      && ((endpointData.requestBody.content['application/json'].schema.properties
          && Object.keys(endpointData.requestBody.content['application/json'].schema.properties)
            .map(bodyParamKey => ({name: bodyParamKey, ...endpointData.requestBody.content['application/json'].schema.properties[bodyParamKey]}))
            .map((parameter) => extendParamReference(parameter, jsonData))
        ) || (endpointData.requestBody.content['application/json'].schema
          && Object.keys(endpointData.requestBody.content['application/json'].schema)
            .map(bodyParamKey => ({name: bodyParamKey, ...endpointData.requestBody.content['application/json'].schema}))
            .map((parameter) => extendParamReference(parameter, jsonData))
        )
    )) || [];
  const endpointPath = formatEndpointPath(endpointData.path);
  const endpointDocumentation = generateEndpointDocumentationLink(endpointData);
  const endpointSummary = endpointData.summary || '';
  const endpointDescription = endpointData.description || '';
  const endpointTags = endpointData.tags || [];
  return {
      name: endpointPath,
      documentation: endpointDocumentation,
      ...(OUTPUT_MODE_FULL ? {description: endpointDescription} : {}),
      ...(OUTPUT_MODE_FULL ? {summary: endpointSummary} : {}),
      ...(OUTPUT_MODE_FULL ? {tags: endpointTags} : {}),
      ...(endpointPathParams.length ? {args: endpointPathParams.map(formatterEndpointParams).sort(sortAlphabeticalByNameProp).map(item => ({...item, name: `:${item.name}`}))} : {}),
      ...(endpointQueryParams.length ? {query: endpointQueryParams.map(formatterEndpointParams).sort(sortAlphabeticalByNameProp)} : {}),
      ...(endpointBodyParams.length ? {body: endpointBodyParams.map(formatterEndpointParams).sort(sortAlphabeticalByNameProp)} : {})
  };
};

const formatEndpointSimpleParams = ({name}) => ({name});
const formatEndpointFullParams = ({ in: typeParam, ...endpointData}) => endpointData;
const formatterEndpointParams = OUTPUT_MODE_FULL ? formatEndpointFullParams : formatEndpointSimpleParams;
const formatEndpointPath = endpointPath => endpointPath.replace(reEndpointPathArgs, (capture, group) => {
  return `:${group}`
});

// Sort by alphabetical
const sortAlphabetical = (a, b) => {
  if(a > b){
    return 1
  }else if(a < b){
    return -1
  };
  return 0
};

// Sort by alphabetical name property
const sortAlphabeticalByNameProp = (a, b) => sortAlphabetical(a.name, b.name);

// Get the endpoint arguments. Example: `/agents/{agent_id}` => args: agent_id
const getEndpointPathArgs = endpointPath => {
  let myArray;
  let tokens = [];
  while (capture = reEndpointPathArgs.exec(endpointPath)) {
    tokens.push(capture[1]);
  };
  return tokens;
};

// Extend the parameter with the reference data
const extendParamReference = (parameter, jsonData) => {
  if (parameter.$ref){
    return { ...(parameter.name && parameter.name !== '$ref'? {name: parameter.name} : {}),...getNestedObject(jsonData, parameter.$ref.split('/').splice(1)) }
  }else if(parameter.schema && parameter.schema.$ref){
    return { ...parameter, schema: {...getNestedObject(jsonData, parameter.schema.$ref.split('/').splice(1))}};
  }else if(parameter.schema && parameter.schema.items && parameter.schema.items.$ref){
    return { ...parameter, schema: {...parameter.schema, items: { ...getNestedObject(jsonData, parameter.schema.items.$ref.split('/').splice(1)) }}};
  }else{
    return parameter;
  };
};

// Get the nested object defined with a ordered arrays of keys
const getNestedObject = (obj, keys) => {
    if(!keys.length){
        return obj;
    };
    const key = keys.shift();
    return getNestedObject(obj[key], keys);
}

// Create a function to log with a [TAG] ...messages
const createLog = (tag, consoleColorCode) => (...args) => console.log(`\x1b[${consoleColorCode}m[${tag}]\x1b[0m`, ...args);

// Create the script logger
const logger = {
  info: createLog('INFO', CONSOLE_COLORS_CODES.BLUE),
  success: createLog('SUCCESS', CONSOLE_COLORS_CODES.GREEN),
  warning: createLog('WARNING', CONSOLE_COLORS_CODES.YELLOW),
  danger: createLog('DANGER', CONSOLE_COLORS_CODES.RED),
  error: createLog('ERROR', CONSOLE_COLORS_CODES.RED),
};

// Log a message and end script
const exitWithMessage = message => {
  logger.error(message);
  process.exit(1);
};

// Generate the endpoint documentation link
const generateEndpointDocumentationLink = endpointData => `${WAZUH_DOCUMENTATION_API_REFERENCE_URL}#operation/${endpointData.operationId}`;

// Save file
const saveFileToOutputDir = (filename, content) => {
  const filePath = path.join(OUTPUT_DIRECTORY, filename);
  fs.writeFile(filePath, content, function (error, data) {
    if (error) {
      return logger.error(`An error appeared saving the output file "${filePath}":`, error);
    }
    logger.success(`File was created! Path: ${filePath}`);
  });
};

// Run the method
main();
