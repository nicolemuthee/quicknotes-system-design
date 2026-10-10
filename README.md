# QuickNotes — System Design

## Project Overview

QuickNotes is a note-taking application prototype built with HTML, CSS, and JavaScript. It uses the JSONPlaceholder REST API to practise retrieving, creating, and deleting notes.

This project also documents the proposed REST API, relational data model, and scalable system architecture for a future production version.

## Features

- Load up to 10 notes from the API.
- Create notes using a POST request.
- Delete notes using a DELETE request.
- Validate note titles and limit them to 100 characters.
- Display loading, success, error, and empty states.
- Disable buttons while requests are running.
- Display note content safely using `textContent`.
- Document the proposed API, database schema, and system architecture.

## Technologies Used

- HTML5
- CSS3
- JavaScript (async/await and Fetch API)
- JSONPlaceholder REST API
- Markdown
- Git and GitHub

## How to Run the API Client

1. Clone or download this repository.
2. Open the project folder in Visual Studio Code.
3. Open `index.html` using the Live Server extension, or serve the folder using another local HTTP server.
4. Click **Load notes** to retrieve sample notes.
5. Enter a title and optional body, then click **Add note**.
6. Click **Delete** to remove a note from the current display.

Internet access is required for API requests.

### API Endpoint

The prototype uses:

`https://jsonplaceholder.typicode.com/posts`

JSONPlaceholder is a testing service. POST and DELETE requests simulate changes and do not permanently store them on a real application database.

## Project Documentation

- [API Design](docs/api-design.md) — REST endpoints, request and response examples, and error handling.
- [Data Model](docs/data-model.md) — database entities, relationships, SQL table definitions, queries, and indexing.
- [Architecture](docs/architecture.md) — requirements, scalability estimates, architecture diagram, request flows, and design trade-offs.

## What I Learned

1. How to make GET, POST, and DELETE requests using the Fetch API.
2. How to use async/await, try/catch/finally, and HTTP response status checks for API error handling.
3. How to validate user input and safely render content using `textContent`.
4. How to design REST endpoints and document request and response formats.
5. How to model relational data using primary keys, foreign keys, and many-to-many relationships.
6. How to estimate application traffic and plan a scalable architecture.

## Limitations and Future Improvements

- Add a real backend and persistent database.
- Implement user registration, authentication, and authorisation.
- Add note editing and tag management.
- Add automated tests and API integration tests.
- Deploy the application and production infrastructure.

## Author

Nicole Muthee
