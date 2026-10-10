# QuickNotes System Architecture

## 1. Overview

QuickNotes is a note-taking application that allows users to create, view, update, and delete notes. The proposed production architecture separates the frontend, application services, background processing, and database storage to support reliability and growth.

The current frontend prototype uses JSONPlaceholder. The architecture below describes the proposed production system, not infrastructure that has already been deployed.

## 2. Functional Requirements

- Users can register and log in securely.
- Users can create notes with a required title and optional body.
- Users can view, update, and delete their own notes.
- Users can organise notes using tags.
- Users receive clear loading, success, empty, and error messages.
- The application validates input and handles failed API requests.

## 3. Nonfunctional Requirements

- **Scalability:** Support approximately one million registered users.
- **Availability:** Minimise service interruptions and single points of failure.
- **Performance:** Return common note-list requests quickly.
- **Security:** Use HTTPS, authentication, authorisation, and secure password hashing.
- **Reliability:** Use database backups and monitored background jobs.
- **Maintainability:** Separate the frontend, API, and data layers.
- **Data integrity:** Use database transactions and relational constraints.

## 4. Load Estimates for One Million Users

These are planning assumptions, not measured traffic.

Assume:

- 1,000,000 registered users.
- 10% of users are active daily: 100,000 daily active users.
- Each active user performs 20 reads and 2 writes per day.
- Average note content and associated metadata require approximately 2 KB per note.
- Each active user creates 2 notes per day.

### Reads per second

Daily reads:

100,000 × 20 = 2,000,000 reads/day

Average reads per second:

2,000,000 ÷ 86,400 ≈ 23 reads/second

### Writes per second

Daily writes:

100,000 × 2 = 200,000 writes/day

Average writes per second:

200,000 ÷ 86,400 ≈ 2.3 writes/second

These are daily averages. Peak traffic may be several times higher, so capacity should be tested under realistic workloads.

### Storage per year

Assuming each active user creates two notes per day:

100,000 × 2 × 365 = 73,000,000 notes/year

At approximately 2 KB per note:

73,000,000 × 2 KB = approximately 146 GB/year.

This is a simplified estimate for note records and associated metadata. It excludes indexes, database overhead, backups, replication, logs, and other user data. Actual storage needs may be higher.

## 5. Proposed Architecture Diagram

```text
                    [ Users / Browsers ]
                             |
                           [ DNS ]
                             |
                           [ CDN ]
                             |
                     [ Load Balancer ]
                       /           \
                      /             \
             [ App Server 1 ]   [ App Server 2 ]
                      \             /
                       \           /
                        [ Cache ]
                            |
                    [ Primary Database ]
                            |
                     [ Read Replica ]

             [ App Servers ] ---> [ Message Queue ]
                                         |
                                      [ Worker ]
                                         |
                               [ Email / Notifications ]
```

## 6. Component Responsibilities

- **Users / Browsers:** Display the interface and send requests to the API.
- **DNS:** Resolves the application's domain name to the appropriate network destination.
- **CDN:** Serves static assets such as HTML, CSS, and JavaScript from locations closer to users.
- **Load Balancer:** Distributes API traffic across healthy application servers.
- **Application Servers:** Validate requests, authenticate users, apply business rules, and access data. At least two servers allow the application to continue operating if one fails.
- **Cache:** Stores frequently accessed data temporarily to reduce database load. Cached private data must be isolated by user and access permissions.
- **Primary Database:** Handles writes and maintains the authoritative application data.
- **Read Replica:** Serves eligible read queries and reduces read pressure on the primary database. Replication may introduce a short delay before new data appears.
- **Message Queue:** Stores background tasks so they can be processed asynchronously.
- **Worker:** Processes queued tasks such as email notifications and other non-urgent jobs.

## 7. GET /notes Request Flow

1. The user opens the notes page in the browser.
2. DNS resolves the application domain.
3. The browser retrieves static files through the CDN.
4. The browser sends `GET /api/notes` to the load balancer.
5. The load balancer forwards the request to a healthy application server.
6. The server authenticates the user and checks permissions.
7. The server checks the cache for eligible note-list data.
8. If the data is not cached, the server queries the database or a suitable read replica.
9. The server returns a JSON response with the notes and pagination information.
10. The browser renders the notes and displays a success or error status.

## 8. POST /notes Request Flow

1. The user submits a new note in the browser.
2. The browser sends `POST /api/notes` with a JSON body and authentication credentials.
3. The load balancer forwards the request to a healthy application server.
4. The server authenticates the user and validates the title and body.
5. The server writes the note to the primary database within a transaction.
6. The server invalidates or updates any affected cached note-list data.
7. The server returns `201 Created` with the created note.
8. If background work is required, such as a notification, the server queues a job for a worker.
9. The browser displays the new note and a success message.

## 9. Architecture Trade-offs

### SQL vs NoSQL

A relational database provides strong relationships, transactions, and integrity constraints for users, notes, and tags. The trade-off is that schema changes and complex joins require planning.

### Cache vs Data Freshness

Caching reduces repeated database reads and improves response times. However, cached data can become stale. The system should invalidate or update relevant cache entries after writes and use suitable expiration policies.

### Read Replicas vs Consistency

Read replicas distribute read traffic and can improve scalability. However, replication delay may mean a recent write is not immediately visible on a replica. Read-after-write requests may need to use the primary database.

### Background Jobs vs Immediate Processing

Queues let the API respond without waiting for slower tasks such as email delivery. However, workers introduce eventual processing and require retries, monitoring, and duplicate-safe job handling.

## 10. Avoiding Single Points of Failure

- Run at least two application servers across separate failure domains.
- Use a health-checked load balancer and redundant infrastructure where available.
- Configure database backups and test restoration regularly.
- Use database replication and a documented failover procedure.
- Configure the message queue for durable messages and monitor queue health.
- Monitor errors, latency, resource usage, and failed background jobs.
- Deploy changes gradually and maintain a rollback procedure.

## 11. Prototype Limitations

The current coursework prototype uses JSONPlaceholder and runs in the browser. It does not implement this production infrastructure, user authentication, caching, database replication, or background workers. These are proposed design components for a scalable future version.

```

### Important note about the estimates

The calculations use explicit assumptions so you can explain them during your presentation. They estimate **average** traffic, not peak load.

When you've saved `architecture.md`, reply **“done.”** Next, we'll create your `README.md` and prepare the project for GitHub.
```
