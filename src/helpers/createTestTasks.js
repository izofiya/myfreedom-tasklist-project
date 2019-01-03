const path = require('path');
const { Database } = require('../database');

const database = new Database(path.resolve(__dirname, '../../tasks.json'));

async function generate() {
    for (let index = 0; index < 10; ++index) {
        const description = `Task ${index + 1}`;
        await database.addTask({description});
    }
}

generate();