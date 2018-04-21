export default config => {
    let path = config.url;
    let protocol;
    if (config.url.startsWith("https://")) {
        protocol = "https://";
    } else if (config.url.startsWith("http://")) {
        protocol = "http://";
    }

    if (path.lastIndexOf("/") > protocol.length) {
        path = path.substr(0, path.substr(protocol.length).indexOf("/") + protocol.length) +
               ":" + config.port + 
               path.substr(path.substr(protocol.length).indexOf("/") + protocol.length);
    } else {
        path = `${config.url}:${config.port}`;
    }
    return path;
};