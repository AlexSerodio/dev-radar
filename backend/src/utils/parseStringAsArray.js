module.exports = function parseStringAsArray(arrayAsString) {
    if(!arrayAsString)
        return null;
    return arrayAsString.split(',').map(tech => tech.trim());
}