# QuickNotes API Design

## 1. Overview

The QuickNotes API allows users to create, view, update, and delete notes. It also supports user authentication and tags.

The frontend prototype uses JSONPlaceholder:
`https://jsonplaceholder.typicode.com/posts`

JSONPlaceholder is a testing API. The endpoints below describe the proposed REST API for a fully implemented QuickNotes backend.

## 2. REST Endpoints

| Method | Endpoint           | Description                       | Success Status |
| ------ | ------------------ | --------------------------------- | -------------- |
| POST   | /api/auth/register | Register a new user               | 201 Created    |
| POST   | /api/auth/login    | Authenticate a user               | 200 OK         |
| GET    | /api/notes         | Retrieve the current user's notes | 200 OK         |
| GET    | /api/notes/:id     | Retrieve one note                 | 200 OK         |
| POST   | /api/notes         | Create a note                     | 201 Created    |
| PUT    | /api/notes/:id     | Update an existing note           | 200 OK         |
| DELETE | /api/notes/:id     | Delete a note                     | 204 No Content |
| GET    | /api/tags          | Retrieve available tags           | 200 OK         |

## 3. Create a Note

### Request

`POST /api/notes`

Headers:

`Content-Type: application/json`

Request body:

```json
{
  "title": "Study Plan",
  "body": "Review JavaScript and SQL.",
  "tagIds": [1, 2]
}
```

### Successful response

Status: `201 Created`

```json
{
  "id": 101,
  "userId": 7,
  "title": "Study Plan",
  "body": "Review JavaScript and SQL.",
  "tags": [
    {
      "id": 1,
      "name": "Study"
    },
    {
      "id": 2,
      "name": "Work"
    }
  ],
  "createdAt": "2026-10-10T10:00:00Z",
  "updatedAt": "2026-10-10T10:00:00Z"
}
```

## 4. List Notes

### Request

`GET /api/notes?page=1&limit=10`

### Successful response

Status: `200 OK`

```json
{
  "data": [
    {
      "id": 101,
      "userId": 7,
      "title": "Study Plan",
      "body": "Review JavaScript and SQL.",
      "createdAt": "2026-10-10T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1
  }
}
```

## 5. Error Handling

The API returns an appropriate HTTP status code and a JSON error message when a request fails.

| Status | Meaning               | Example                                     |
| ------ | --------------------- | ------------------------------------------- |
| 400    | Bad Request           | Missing or invalid title                    |
| 401    | Unauthorized          | Missing or invalid login token              |
| 403    | Forbidden             | User attempts to access another user's note |
| 404    | Not Found             | Note does not exist                         |
| 500    | Internal Server Error | Unexpected server failure                   |

### Example error response

```json
{
  "error": {
    "code": 400,
    "message": "Title is required."
  }
}
```

## 6. API Conventions

- Use JSON for request and response bodies.
- Use standard HTTP methods and status codes.
- Validate all user input on the server.
- Require authentication for private notes.
- Return consistent error messages.
- Use pagination when retrieving large numbers of notes.
- Use HTTPS to protect data in transit.

## 7. Prototype Limitations

The frontend currently uses JSONPlaceholder for practice. Its sample API does not implement the complete QuickNotes authentication, tagging, or persistent database functionality described in this design. The endpoints above represent the proposed production API.
