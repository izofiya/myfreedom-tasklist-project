const util = require('util');
const fs = require('fs');
const path = require('path');
const { Database } = require('../src/database');

const testFilePath = path.resolve(__dirname, './test-db.json');

describe('Database class tests', () => {
    let database;

    beforeEach(() => {
        database = new Database(testFilePath);
    });

    afterEach(() => util.promisify(fs.unlink)(testFilePath));

    it('should write task to file', async () => {
        const description = 'some test task';
        const task = await database.addTask({ description: 'some test task' });

        expect(task).toMatchObject({ description, isDone: false });
        expect(task.id).toBeTruthy();
    });

    it('should return all tasks', async () => {
        const description1 = 'learn react';
        const description2 = 'buy milk';
        const [task1, task2] = await Promise.all([
            database.addTask({ description: description1 }),
            database.addTask({ description: description2 })
        ]);
        const allTasks = await database.getAllTasks();

        expect(allTasks).toEqual([task1, task2]);
    });

    it('should remove task', async () => {
        const description1 = 'learn react';
        const description2 = 'buy milk';
        const [task1, task2] = await Promise.all([
            database.addTask({ description: description1 }),
            database.addTask({ description: description2 })
        ]);

        await database.removeTask(task1.id);

        const allTasks = await database.getAllTasks();

        expect(allTasks).toEqual([task2]);
    });

    it('should return task by id', async () => {
        const description = 'test task';
        const task = await database.addTask({ description });
        const foundById = await database.getTaskById(task.id);

        expect(foundById).toEqual(task);
    });

    it('should update existing task', async () => {
        const description = 'test task';
        const changedDescription = 'changed description';
        const task = await database.addTask({ description });
        const updated = await database.updateTask({
            ...task,
            description: changedDescription
        });

        expect(updated).toEqual({...task, description: changedDescription});

        const reRead = await database.getTaskById(task.id);

        expect(updated).toEqual(reRead);
    });

    it('should not update not existing task', async () => {
        const description = 'test task';
        const changedDescription = 'changed description';
        const task = await database.addTask({ description });
        const updated = await database.updateTask({
            ...task,
            id: 1,
            description: changedDescription
        });

        const allTasks = await database.getAllTasks();

        expect(updated).toBeUndefined();
        expect(allTasks.length).toBe(1);
    });
});
