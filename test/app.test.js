const supertest = require('supertest');
const uuid = require('uuid');
const fs = require('fs');
const path = require('path');
const util = require('util');
const { Database } = require('../src/database');

const normalize = array => array.reduce((acc, entity) => ({ ...acc, [entity.id]: entity }), {});

describe('server integration tests', function () {
    let tasks;

    process.env.FILE = path.resolve(__dirname, './testtasks.json');

    const app = require('../src/app');

    beforeEach(async () => {
        const database = new Database(process.env.FILE);
        const descriptions = ['Some test task', 'Some other task'];

        tasks = await Promise.all(descriptions.map(description => database.addTask({ description })));
        tasks = normalize(tasks);
    });


    afterEach(() => util.promisify(fs.unlink)(process.env.FILE));

    test('should receive all tasks from file', async () => {
        const res = await supertest(app)
            .get('/api/tasks')
            .expect('Content-Type', /json/)
            .expect(200);

        expect(normalize(res.body)).toEqual(tasks)
    });

    test('should receive task by id', async () => {
        const task = Object.values(tasks)[0];

        const res = await supertest(app)
            .get(`/api/tasks/${task.id}`)
            .expect('Content-Type', /json/)
            .expect(200);

        expect(res.body).toEqual(task)
    });

    test('should return 404 if task not found on get', () => supertest(app)
        .get(`/api/tasks/${uuid()}`)
        .expect(404));

    test('should return new task on post', async () => {
        const description = 'Another test task';
        const res = await supertest(app)
            .post('/api/tasks')
            .send({description});

        expect(res.body.id).toBeDefined();
        expect(res.body.description).toBe(description);
        expect(res.body.isDone).toBe(false);

        const getResult = await supertest(app).get('/api/tasks');
        const expected = {...tasks, [res.body.id]: res.body};
        expect(normalize(getResult.body)).toEqual(expected);
    });

    test('should return 400 on post if description is empty', () => supertest(app)
        .post('/api/tasks')
        .send({description: ' '})
        .expect(400));

    test('should return 400 on post if description is not a string', () => supertest(app)
        .post('/api/tasks')
        .send({description: null})
        .expect(400));

    test('should update description if not empty on put', async () => {
        const task = Object.values(tasks)[0];
        const description = 'replaced description';

        const result = await supertest(app)
            .put(`/api/tasks/${task.id}`)
            .send({description})
            .expect(200);

        const expected = {...task, description};

        expect(result.body).toEqual(expected);

        const getAllResult = await supertest(app).get('/api/tasks');

        expect(normalize(getAllResult.body)[task.id]).toEqual(expected);
    });

    test('should update isDone if not empty on put', async () => {
        expect.assertions(4);

        for (let task of Object.values(tasks)) {
            const isDone = !task.isDone;

            const result = await supertest(app)
                .put(`/api/tasks/${task.id}`)
                .send({isDone})
                .expect(200);

            const expected = {...task, isDone};

            expect(result.body).toEqual(expected);

            const getAllResult = await supertest(app).get('/api/tasks');

            expect(normalize(getAllResult.body)[task.id]).toEqual(expected);
        }
    });

    test('should return 400 on put if description is not a string', () => supertest(app)
        .put(`/api/tasks/${Object.values(tasks)[0].id}`)
        .send({description: 10})
        .expect(400));

    test('should return 400 on put if isDons is not a boolean', () => supertest(app)
        .put(`/api/tasks/${Object.values(tasks)[0].id}`)
        .send({isDone: 10})
        .expect(400));

    test('should return 404 if task not found on put', () => supertest(app)
        .put(`/api/tasks/${uuid()}`)
        .send({description: 'test', isDone: true})
        .expect(404));

    test('should return 200 on delete of task and delete task', async () => {
        const tasksArray = Object.values(tasks);
        const task = tasksArray[0];
        const expected = {[tasksArray[1].id]: tasksArray[1]};

        await supertest(app)
            .delete(`/api/tasks/${task.id}`)
            .send({description: 'test', isDone: true})
            .expect(200);

        const result = await supertest(app).get('/api/tasks');

        expect(normalize(result.body)).toEqual(expected);
    });

    test('should return 200 on unknown task deletion', async () => {
        await supertest(app)
            .delete(`/api/tasks/${uuid()}`)
            .send({description: 'test', isDone: true})
            .expect(200);

        const result = await supertest(app).get('/api/tasks');

        expect(normalize(result.body)).toEqual(tasks);
    });
});
