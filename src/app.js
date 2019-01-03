const { resolve } = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const { Database } = require('./database');

const app = express();
const tasksRouter = new express.Router();

app.use(express.static('./static'));
app.use(bodyParser.json());

const filePath = process.env.FILE || resolve(__dirname, '../tasks.json');
const isNullOrUndefined = value => value === undefined || value === null;
const isTypeOrNotSupplied = (value, type) => isNullOrUndefined(value) || typeof value === type;

tasksRouter.get('/tasks', async (req, res) => {
    const database = new Database(filePath);
    const tasks = await database.getAllTasks();

    res.json(tasks);
});

tasksRouter.get('/tasks/:id', async (req, res) => {
    const database = new Database(filePath);
    const task = await database.getTaskById(req.params.id);

    if (!task) {
        res.status(404);
        res.end();

        return;
    }

    res.json(task);
});

tasksRouter.post('/tasks', async (req, res) => {
    const database = new Database(filePath);
    const { description } = req.body;

    if (typeof description !== 'string' || !(description.trim())) {
        res.status(400);
        res.end();

        return;
    }

    const task = await database.addTask({ description });

    res.json(task);
});

tasksRouter.put('/tasks/:id', async (req, res) => {
    const database = new Database(filePath);
    const { isDone, description } = req.body;

    if (!isTypeOrNotSupplied(isDone, 'boolean') || !isTypeOrNotSupplied(description, 'string')) {
        res.status(400);
        res.end();
        return;
    }

    const { id } = req.params;
    const task = await database.updateTask({ 
        id, 
        description: description && description.trim(), 
        isDone 
    });

    if (!task) {
        res.status(404);
        res.end();
        return;
    }

    res.json(task);
});

tasksRouter.delete('/tasks/:id', async (req, res) => {
    const database = new Database(filePath);

    await database.removeTask(req.params.id);

    res.status(200);
    res.end();
});

app.use('/api', tasksRouter);

module.exports = app;
