Репозиторий содержит бекэнд инструкции для задания на курсах по JS в Myfreedom.

## Установка

1. Скачать/склонировать репозиторий
2. Ввести `npm install`
3. Ввести `npm run start`. Сервер будет доступен на `http://localhost:3002`.
4. Для генерации небольшого количества тестовых задач вызовите `npm run generate`.

## Использование с [create-react-app](https://facebook.github.io/create-react-app)

Чтобы избежать неожиданных проблем с [Same-Origin Policy](https://en.wikipedia.org/wiki/Same-origin_policy) и [CORS](https://en.wikipedia.org/wiki/Cross-origin_resource_sharing), необходимо настроить
[proxy](https://facebook.github.io/create-react-app/docs/proxying-api-requests-in-development).

Для этого в `package.json` добавьте строчку

```
proxy: "http://localhost:3002",
```

Таким образом запросы вида `fetch('/api/tasks')` будут перенаправляться на бекенд.

## Ресурсы

### `/api/tasks` - коллекция задач

Одна задача описывается объектом:

```json
{
    "id": "adf98a7b-b8f8-461a-829f-142ade0af62f",
    "description": "Task 3",
    "isDone": false
},
```

Здесь
* `id` - уникальный иденетефикатор задачи. Автоматически генерируется сервером. Не может быть изменен.
* `description` - описание задачи. Не может быть пустым.
* `isDone` - признак завершенности задачи. Если `isDone` равно `true`, задача считается выполненной.

Доступные операции:

`GET /api/tasks` - получить список всех задач.

`GET /api/tasks/{taskId}` - получить одну задачу.

`POST /api/tasks/` - создать одну задачу. Обязательно отправить непустое поле `description`.

`PUT /api/tasks/{taskId}` - обновить одну задачу. Можно послать непустой `description` и/или `isDone`.

`DELETE /api/tasks/{taskId}` - удалить одну задачу.

### `/api/tasks/{taskId}/attachments` - коллекция файлов, прикрепленных к одной задаче.

С прикрепленным файлом связано 2 сущности. Одна из них - описание файла - объект вида
```json
 {
    "id": "213e3904-5104-493c-a543-0d065a65578b",
    "taskId": "1ebc60be-ab06-475a-98ca-e876da3e0b66",
    "name": "Stas Shiray CV.pdf",
    "mimeType": "application/pdf"
}
```
Здесь:
* `id` - уникальный идентефикатор файла. Автоматические назначается сервером.
* `taskId` - уникальный идентефикатор задачи, к которой прикреплен файл.
* `name` - имя файла.
* `mimeType` - тип данных в файле.

Вторая сущность - непосредственно содержимое файла.

Доступные операции:

`GET /api/tasks/{taskId}/attachments` - получить описания всех файлов, прикрепленных к задаче с `id` равным `taskId`.

`POST /api/tasks/{taskId}/attachments` - прикрепить один или нескольк файлов к задаче. Данные должны быть в формате `multipart/form-data` (смотрите последнее занятие).

`GET /api/tasks/{tasksId}/attachments/{attachmentId}` - получить содержимое файла с `id` равным `attachmentId`, прикрепленного к задаче с `id` равным `taskId`.

`DELETE /api/tasks/{tasksId}/attachments/{attachmentId}` - удалить файл с `id` равным `attachmentId`.

При удалении задачи все прикрепленные к ней файлы удаляются сервером автоматически.

# [Задание смотрите здесь](TASK.md)
