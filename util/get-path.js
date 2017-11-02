module.exports = (wapiConfig) => {
    let path = wapiConfig.url;
    let protocol;
    if (wapiConfig.url.startsWith("https://")) {
        protocol = "https://";
    } else if (wapiConfig.url.startsWith("http://")) {
        protocol = "http://";
    }

    if (path.lastIndexOf("/") > protocol.length) {
        path = path.substr(0, path.substr(protocol.length).indexOf("/") + protocol.length) +
               ":" + wapiConfig.port + 
               path.substr(path.substr(protocol.length).indexOf("/") + protocol.length);
    } else {
        path = `${wapiConfig.url}:${wapiConfig.port}`;
    }
    return path;
};