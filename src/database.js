const uuid = require('uuid');
const lowdb = require('lowdb');
const FileAsync = require('lowdb/adapters/FileAsync');
const fs = require('fs');
const path = require('path');
const utils = require('util');

const Collections = {
    TASKS: 'tasks',
    ATTACHMENTS: 'attachments'
};

const unlink = utils.promisify(fs.unlink);

class Database {
    constructor(filePath) {
        this._attachmentsPath = process.env.ATTACHMENTS_PATH;
        this._db = lowdb(new FileAsync(filePath, {
            defaultValue: {
                [Collections.TASKS]: [],
                [Collections.ATTACHMENTS]: []
            }
        }));
    }

    removeFile(filename) {
        return unlink(path.resolve(this._attachmentsPath, filename));
    }

    async getTasksCollection() {
        const db = await this._db;

        return db.get(Collections.TASKS);
    }
    
    async getAttachmentsCollection() {
        const db = await this._db;

        return db.get(Collections.ATTACHMENTS);
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

        await collection.remove({ id }).write();
        await this.removAttachmentsForTask(id);
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

    async getAttachmentsForTask(taskId) {
        const attachmentsCollection = await  this.getAttachmentsCollection();
        const attachmentsForTask = await attachmentsCollection.filter({taskId});

        return attachmentsForTask.value();
    }

    async getAttachmentById(attachemntId) {
        const attachmentsCollection = await this.getAttachmentsCollection();
        const collection = await attachmentsCollection.value();
        const value = collection.find(a => a.id === attachemntId);

        return value;
    }

    async addAttachments(taskId, attachments) {
        const task = await this.getTaskById(taskId);
       
        if (!task) {
            return null;
        }

        const attachmentsCollection = await this.getAttachmentsCollection();
        const attachmentIds = [];

        for (const attachment of attachments) {
            const {filename, originalname, mimetype} = attachment;
            const id = uuid();
            attachmentIds.push(id);
            await attachmentsCollection.push({
                id,
                taskId: task.id, 
                filename, 
                originalname, 
                mimetype
            }).write();
        }

        const attachmentsOfTask = await this.getAttachmentsForTask(taskId);

        return attachmentsOfTask.filter(({id}) => attachmentIds.includes(id));
    }

    async removeAttachment(id) {
        const attachementsCollection = await this.getAttachmentsCollection();
        const attachment = await attachementsCollection.find({id}).value();
        await this.removeFile(attachment.filename);
        await attachementsCollection.remove({id}).write();
    }

    async removAttachmentsForTask(taskId) {
        const attachementsCollection = await this.getAttachmentsCollection();
        const attachmentsForTask = await attachementsCollection.filter({taskId}).value();

        await Promise.all(
            attachmentsForTask.map(attachment => this.removeFile(attachment.filename)));
        await attachementsCollection.remove({taskId}).write();
    }
}

module.exports = {
    Database
};
