console.log(context.request.queryParams)

switch (context.request.queryParams.agents_list) {
    case '001':
        respond()
            .withStatusCode(200)
            .withFile('agent.json')
            .skipDefaultBehaviour()
        break
    default:
        // default to bad request
        respond()
            .withStatusCode(500)
            .skipDefaultBehaviour()
        break
    
}