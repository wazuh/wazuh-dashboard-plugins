var path = context.request.path;
var pathArray = path.split('/');
pathArray.splice(0, 4);
var pathFile = 'agents/configuration/' + pathArray.join('-') + '.json';

respond().withStatusCode(200).withFile(pathFile);
