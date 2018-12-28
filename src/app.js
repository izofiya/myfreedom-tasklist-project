const {resolve} = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const uuid = require('uuid');
const File = require('./file');

const app = express();
const tasksRouter = new express.Router();

app.use(express.static('./static'));
app.use(bodyParser.json());

const file = new File(process.env.FILE || resolve(__dirname, '../tasks.json'));

const isNullOrUndefined = value => value === undefined || value === null;
const isTypeOrNotSupplied = (value, type) => isNullOrUndefined(value) || typeof value === type;

tasksRouter.get('/tasks', async (req, res) => {
    const tasks = await file.read();

    res.json(Object.values(tasks));
});

tasksRouter.get('/tasks/:id', async (req, res) => {
    const tasks = await file.read();
    const task = tasks[req.params.id];

    if (!task) {
        res.status(404);
        res.end();

        return;
    }

    res.json(task);
});

tasksRouter.post('/tasks', async (req, res) => {
    const {description} = req.body;

    if (typeof description !== 'string' || !(description.trim())) {
        res.status(400);
        res.end();

        return;
    }

    const task = {
        id: uuid(),
        description: description.trim(),
        isDone: false
    };

    const tasks = await file.read();

    tasks[task.id] = task;

    await file.write(tasks);

    res.json(task);
});

tasksRouter.put('/tasks/:id', async (req, res) => {
    const {isDone, description} = req.body;

    if (!isTypeOrNotSupplied(isDone, 'boolean') || !isTypeOrNotSupplied(description, 'string')) {
        res.status(400);
        res.end();
        return;
    }

    const tasks = await file.read();
    const task = tasks[req.params.id];

    if (!task) {
        res.status(404);
        res.end();
        return;
    }

    task.isDone = isNullOrUndefined(isDone) ? task.isDone : isDone;
    task.description = description ? description.trim() : task.description;

    await file.write(tasks);

    res.json(task);
});

tasksRouter.delete('/tasks/:id', async (req, res) => {
    const tasks = await file.read();

    if (tasks[req.params.id]) {
        delete tasks[req.params.id];
    }

    await file.write(tasks);

    res.status(200);
    res.end();
});

app.use('/api', tasksRouter);

module.exports = app;
