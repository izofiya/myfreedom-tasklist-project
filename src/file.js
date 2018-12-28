const {readFile, writeFile} = require('fs');
const {promisify} = require('util');

const readFileAsync = promisify(readFile);
const writeFileAsync = promisify(writeFile);

class File {
    constructor(filename) {
        this._filename = filename;
    }

    read() {
        return readFileAsync(this._filename, 'utf8').then(JSON.parse)
    }

    write(data) {
        return writeFileAsync(this._filename, JSON.stringify(data))
    }
}

module.exports = File;
