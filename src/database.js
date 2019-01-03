const uuid = require('uuid');
const lowdb = require('lowdb');
const FileAsync = require('lowdb/adapters/FileAsync');

const Collections = {
    TASKS: 'tasks'
};

class Database {
    constructor(filePath) {
        this._db = lowdb(new FileAsync(filePath, {
            defaultValue: {
                [Collections.TASKS]: []
            }
        }));
    }

    async getTasksCollection() {
        const db = await this._db;

        return db.get(Collections.TASKS);
    }

    async getAllTasks() {
        const collection = await this.getTasksCollection();

        return collection.value();
    }

    async addTask({ description, isDone = false, ...other }) {
        const id = uuid();
        description = description.trim();

        const collection = await this.getTasksCollection();

        await collection.push({ id, description, isDone, ...other })
            .write();

        return this.getTaskById(id);
    }

    async getTaskById(id) {
        const collection = await this.getTasksCollection();

        return collection.find({ id }).value();
    }

    async removeTask(id) {
        const collection = await this.getTasksCollection();

        return collection.remove({ id }).write();
    }

    async updateTask({ id, ...other }) {
        const db = await this._db;
        const task = await this.getTaskById(id);

        if (!task) {
            return undefined;
        }

        let { isDone, description } = task;

        description = other.description ? other.description.trim() : description;
        isDone = other.isDone !== null && other.isDone !== undefined ?
            other.isDone :
            isDone;

        const collection = await this.getTasksCollection();

        await collection.find({ id })
            .assign({ description, isDone })
            .write();

        return this.getTaskById(id);
    }
}

module.exports = {
    Database
};
