var path = context.request.path;
var pathArray = path.split('/')
pathArray.splice(0,4)
var pathFile = 'cluster/configuration/'+pathArray.join('_')+'.json'

console.log(pathFile)

respond()
    .withStatusCode(200)
    .withFile(pathFile)
