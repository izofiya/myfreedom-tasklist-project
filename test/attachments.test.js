const path = require('path');
const { Database } = require('../src/database');
const supertest = require('supertest');
const {
    removeDirRecursively,
    createDirectoryIfNotExists,
    unlink,
    readdir,
    readFile
} = require('../src/fs.utils');

const testFilePath = path.resolve(__dirname, './test-db.json');
const attachmentsPath = path.resolve(__dirname, '../upload_test');
process.env.ATTACHMENTS_PATH = attachmentsPath;

const cleanAttachments = () => removeDirRecursively(attachmentsPath);
const createAttachmentsDirectory = () => createDirectoryIfNotExists(attachmentsPath);
const readAttachmentFiles = () => readdir(attachmentsPath);
const readAttachmentContent = file => readFile(path.resolve(attachmentsPath, file), 'utf-8');

describe('Attachments tests', () => {
    let database;

    process.env.FILE = testFilePath;

    const app = require('../src/app');

    beforeEach(async () => {
        await createAttachmentsDirectory();
        database = new Database(testFilePath);
    });

    afterEach(async () => {
        await Promise.all([
            unlink(testFilePath),
            cleanAttachments()
        ]);
    });

    it('should upload and return files for task', async () => {
        const task = await database.addTask({ description: 'Test task' });

        const { body: postBody } = await supertest(app)
            .post(`/api/tasks/${task.id}/attachments`)
            .attach('file1', path.resolve(__dirname, './resources/test-attachment.txt'))
            .attach('file2', path.resolve(__dirname, './resources/other-attachment.txt'))
            .expect('Content-Type', /json/)
            .expect(200);

        const assertFiles = body => {
            expect(body).toHaveLength(2);
            expect(body[0]).toMatchObject({
                name: 'test-attachment.txt',
                mimeType: 'text/plain',
                taskId: task.id
            });
            expect(body[1]).toMatchObject({
                name: 'other-attachment.txt',
                mimeType: 'text/plain',
                taskId: task.id
            });
            expect(body.every(attachment => attachment.id)).toBeTruthy();
        };

        assertFiles(postBody);

        const files = await readAttachmentFiles();

        expect(files.length).toBe(2);

        const { body: getBody } = await supertest(app)
            .get(`/api/tasks/${task.id}/attachments`)
            .expect('Content-Type', /application\/json/)
            .expect(200);

        assertFiles(getBody);
    });

    it('should remove file for task', async () => {
        const task = await database.addTask({ description: 'Test task' });

        const { body: [fileData] } = await supertest(app)
            .post(`/api/tasks/${task.id}/attachments`)
            .attach('file1', path.resolve(__dirname, './resources/test-attachment.txt'))
            .expect('Content-Type', /json/)
            .expect(200);

        const filesBeforeDelete = await readAttachmentFiles();

        expect(filesBeforeDelete).toHaveLength(1);

        await supertest(app)
            .delete(`/api/tasks/${task.id}/attachments/${fileData.id}`)
            .expect(200);

        const filesAfterDelete = await readAttachmentFiles();

        expect(filesAfterDelete).toHaveLength(0);
    });

    it('should return uploaded file', async () => {
        const task = await database.addTask({ description: 'Test task' });

        const { body: [fileData] } = await supertest(app)
            .post(`/api/tasks/${task.id}/attachments`)
            .attach('file1', path.resolve(__dirname, './resources/test-attachment.txt'))
            .expect('Content-Type', /json/)
            .expect(200);

        const { body: fileContent } = await supertest(app)
            .get(`/api/tasks/${task.id}/attachments/${fileData.id}`)
            .expect('Content-Type', /text/)
            .expect(200);

        const [file] = await readAttachmentFiles();
        const attachementContent = await readAttachmentContent(file);
        const expectedContent = await readFile(
            path.resolve(__dirname, './resources/test-attachment.txt'), 'utf-8');

        // TODO: check returned content

        expect(attachementContent).toBe(expectedContent);
    });

    it('should return 404 if task does not exists', async () => {
        await supertest(app)
            .get('/api/tasks/not_exists/attachments')
            .expect('Content-Type', /json/)
            .expect(404);

        await supertest(app)
            .post('/api/tasks/not_exists/attachments')
            .attach('file1', path.resolve(__dirname, './resources/test-attachment.txt'))
            .expect('Content-Type', /json/)
            .expect(404);

        await supertest(app)
            .delete('/api/tasks/not_exists/attachments/attachment_id')
            .expect('Content-Type', /json/)
            .expect(404);
        
        await supertest(app)
            .get('/api/tasks/not_exists/attachments/attachment_id')
            .expect('Content-Type', /json/)
            .expect(404);
    });
});
