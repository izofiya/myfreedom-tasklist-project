const path = require('path');
const uuid = require('uuid');
const File = require('../file');

const file = new File(path.resolve(__dirname, '../../tasks.json'));
const tasks = {};

for (let index = 0; index < 10; ++index) {
    const task = {
        id: uuid(),
        description: `Task ${index + 1}`,
        isDone: index % 2 === 0
    };

    tasks[task.id] = task;
}

file.write(tasks);
