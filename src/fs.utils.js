const fs = require('fs');
const util = require('util');
const path = require('path');

const rmdir = util.promisify(fs.rmdir);
const mkdir = util.promisify(fs.mkdir);
const readdir = util.promisify(fs.readdir);
const exists = util.promisify(fs.exists);
const lstat = util.promisify(fs.lstat);
const unlink = util.promisify(fs.unlink);
const readFile = util.promisify(fs.readFile);

const createDirectoryIfNotExists = async path => {
    const pathExists = await exists(path);

    if (!pathExists) {
        await mkdir(path);
    }
};

const removeDirRecursively = async directoryPath => {
    const dirExists = await exists(directoryPath);

    if (!dirExists) {
        return;
    }

    const content = await readdir(directoryPath);

    await Promise.all(content.map(async file => {
        const innerPath = path.resolve(directoryPath, file);
        const stat = await lstat(innerPath);
        if (stat.isDirectory()) {
            return removeDirRecursively(innerPath);
        }
        
        return unlink(innerPath);
    }));

    await rmdir(directoryPath);
}

module.exports = {
    rmdir,
    mkdir,
    readdir,
    createDirectoryIfNotExists,
    unlink,
    removeDirRecursively,
    readFile
};
