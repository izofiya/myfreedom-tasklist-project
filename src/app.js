const { resolve } = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const cors = require('cors');
const { Database } = require('./database');
const { createAsyncMiddleware } = require('./createAsyncMiddleware');

const app = express();
const attachmentsPath = process.env.ATTACHMENTS_PATH ||
    resolve(__dirname, '../upload')
const uploadMiddleware = multer({ dest: attachmentsPath });
const tasksRouter = new express.Router();
const attachmentsRouter = new express.Router({ mergeParams: true });

app.use(cors());
app.use(bodyParser.json());

const filePath = process.env.FILE || resolve(__dirname, '../tasks.json');
const isNullOrUndefined = value => value === undefined || value === null;
const isTypeOrNotSupplied = (value, type) => isNullOrUndefined(value) || typeof value === type;

const transformAttachmentInfo = attachments => attachments.map(({
    id, taskId, mimetype, originalname,
}) => ({
    id, taskId, mimeType: mimetype, name: originalname
}));

app.use((req, res, next) => {
    req.database = new Database(filePath);
    next();
});

class StatusError extends Error {
    constructor(message, status) {
        super(message);

        this.status = status;
    }
}

const findTaskMiddleware = createAsyncMiddleware(async (req, res, next) => {
    const {
        database,
        params: { taskId }
    } = req;
    const task = await database.getTaskById(taskId);

    if (!task) {
        throw new StatusError(`Task width id '${taskId}' is not found`, 404);
    }

    req.task = task;

    next();
});

attachmentsRouter.use(findTaskMiddleware);

attachmentsRouter.get('/', createAsyncMiddleware(async ({
    database,
    params: { taskId }
}, res) => {
    const attachments = await database.getAttachmentsForTask(taskId);

    res.json(transformAttachmentInfo(attachments));
}));

attachmentsRouter.get('/:attachmentId', createAsyncMiddleware(
    async ({
        database,
        params: { attachmentId }
    }, res) => {
        const attachment = await database.getAttachmentById(attachmentId);

        res.download(
            resolve(attachmentsPath, attachment.filename),
            attachment.originalname, {
                headers: {
                    'content-type': attachment.mimetype
                }
            });
    }));

attachmentsRouter.delete('/:attachmentId',
    createAsyncMiddleware(async ({
        database,
        params: { attachmentId }
    }, res) => {
        await database.removeAttachment(attachmentId);

        res.status(200);
        res.end();
    }));

attachmentsRouter.post('/', uploadMiddleware.any(),
    createAsyncMiddleware(async ({ files, database, params: { taskId } }, res) => {
        if (!files || !files.length) {
            res.status(400);
            res.end();
        }

        const attachments = await database.addAttachments(taskId, files)

        res.json(transformAttachmentInfo(attachments));
    }));

tasksRouter.use('/tasks/:taskId/attachments', attachmentsRouter);

tasksRouter.get('/tasks', createAsyncMiddleware(async ({ database }, res) => {
    const tasks = await database.getAllTasks();

    res.json(tasks);
}));

tasksRouter.get('/tasks/:taskId', findTaskMiddleware, createAsyncMiddleware(
    async ({ task }, res) => {
        res.json(task);
    }));

tasksRouter.post('/tasks', createAsyncMiddleware(
    async ({ database, body: { description } }, res) => {
        if (typeof description !== 'string' || !(description.trim())) {
            res.status(400);
            res.end();

            return;
        }

        const task = await database.addTask({ description });

        res.json(task);
    }));

tasksRouter.put('/tasks/:taskId', findTaskMiddleware, createAsyncMiddleware(
    async ({
        database,
        body: { isDone, description },
        task
    }, res) => {
        if (!isTypeOrNotSupplied(isDone, 'boolean') || !isTypeOrNotSupplied(description, 'string')) {
            res.status(400);
            res.end();
            return;
        }

        const updatedTask = await database.updateTask({
            id: task.id,
            description: description && description.trim(),
            isDone
        });

        if (!updatedTask) {
            throw new StatusError(`Task width id '${taskId}' is not found`, 404);
        }

        res.json(task);
    }));

tasksRouter.delete('/tasks/:taskId', createAsyncMiddleware(
    async ({ database, params: { taskId } }, res) => {
        await database.removeTask(taskId);

        res.status(200);
        res.end();
    }));

app.use('/api', tasksRouter);

app.use((error, req, res, next) => {
    res.status(error.status || 500);
    res.json({
        error: error.message || 'Unexpected error'
    });
});

module.exports = app;
