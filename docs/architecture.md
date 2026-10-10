# QuickNotes System Architecture

## 1. Overview

QuickNotes is a note-taking application that allows users to create, view, and delete notes. The proposed production architecture is designed to support one million registered users while maintaining availability, performance, and data integrity.

The current frontend uses JSONPlaceholder as a mock API. The architecture below describes a proposed production system and is not a deployed infrastructure.

## 2. Requirements

### Functional Requirements

- Users can create, view, update, and delete notes.
- Users can view only notes they are authorized to access.
- The system validates note titles and request data.
- The system stores notes in a relational database.
- The system supports authentication and authorization.
- The system returns appropriate success and error responses.

### Non-Functional Requirements

- **Scalability:** Handle increasing users and requests by adding application servers and database capacity.
- **Availability:** Continue serving requests when an application server or other individual component fails.
- **Performance:** Return common note-reading requests quickly through caching and database indexing.
- **Security:** Use HTTPS, authentication, authorization, input validation, and secure secret management.
- **Consistency:** Preserve committed note data and handle replication lag appropriately.
- **Recoverability:** Use backups, monitoring, and tested recovery procedures.
- **Maintainability:** Keep the application, database, caching, and background processing responsibilities separate.

## 3. Load Estimates for One Million Users

### Assumptions

- There are 1,000,000 registered users.
- Each registered user generates an average of 20 read requests and 2 write requests per day.
- A write creates or updates a note.
- Each stored note and its associated metadata occupy approximately 2 KB.
- Each user creates two notes per day on average.
- Traffic is distributed evenly across 24 hours.
- Estimates exclude traffic spikes, indexes, backups, replication overhead, logs, and other infrastructure storage.

### Reads per Second

Daily read requests:

1,000,000 users × 20 reads = 20,000,000 reads/day

Average reads per second:

20,000,000 ÷ 86,400 ≈ **231.5 reads/second**

### Writes per Second

Daily write requests:

1,000,000 users × 2 writes = 2,000,000 writes/day

Average writes per second:

2,000,000 ÷ 86,400 ≈ **23.1 writes/second**

### Storage per Year

New notes per year:

1,000,000 users × 2 notes/day × 365 days = 730,000,000 notes/year

Estimated storage:

730,000,000 notes × 2 KB = 1,460,000,000 KB

Using decimal storage units, this is approximately **1.46 TB of new note data per year**.

This estimate assumes that each note, including its metadata, occupies 2 KB and that notes are not deleted. Actual infrastructure storage will be higher when indexes, backups, replicas, logs, and database overhead are included.

### Workload Classification

QuickNotes is expected to be **read-heavy** because the assumed 20 million daily reads exceed the 2 million daily writes by a factor of ten. Caching and read replicas can reduce the load on the primary database.

These figures are average estimates. Production capacity should also account for peak traffic, retries, and sudden increases in usage.

## 4. Proposed Architecture Diagram

```text
                       +------------------+
                       |      Client      |
                       | Browser / Mobile |
                       +--------+---------+
                                |
                                v
                       +------------------+
                       |       DNS        |
                       | Domain Resolution|
                       +--------+---------+
                                |
                                v
                       +------------------+
                       |       CDN        |
                       | Static Assets    |
                       +--------+---------+
                                |
                                v
                       +------------------+
                       | Load Balancer    |
                       | Health Checks    |
                       +--------+---------+
                                |
                   +------------+------------+
                   |                         |
                   v                         v
          +----------------+       +----------------+
          | App Server 1   |       | App Server 2   |
          | API / Business |       | API / Business |
          +-------+--------+       +-------+--------+
                  |                        |
                  +------------+-----------+
                               |
                +--------------+--------------+
                |                             |
                v                             v
        +---------------+             +------------------+
        | Cache Cluster |             | Primary Database |
        | Fast Reads    |             | Read / Write     |
        +---------------+             +--------+---------+
                                               |
                                               | Replication
                                               v
                                      +------------------+
                                      | Read Replica     |
                                      | Read Scaling     |
                                      +------------------+

          App Server 1 / 2
                  |
                  v
          +----------------+
          | Durable Queue  |
          | Async Jobs     |
          +-------+--------+
                  |
                  v
          +----------------+
          | Worker Service |
          | Background Jobs|
          +----------------+

          Database Backups --> Separate Durable Backup Storage
```

## 5. What Each Component Does

- **Client:** Provides the user interface for creating, viewing, and deleting notes.
- **DNS:** Resolves the application's domain name to its hosting endpoint.
- **CDN:** Delivers cacheable static assets, such as CSS, JavaScript, and images, from geographically distributed locations to reduce latency.
- **Load balancer:** Distributes incoming requests across healthy application servers and removes unhealthy instances from rotation.
- **Application servers:** Validate requests, enforce authentication and authorization, execute business logic, and communicate with the database and other services.
- **Cache:** Stores frequently requested data temporarily to reduce database queries and improve response times.
- **Primary database:** Stores authoritative note and user data and handles committed writes.
- **Read replica:** Serves eligible read queries to reduce read load on the primary database; replication lag must be considered.
- **Durable queue:** Stores background jobs so that work can be processed asynchronously and retried after transient failures.
- **Worker service:** Processes background jobs, such as sending notifications or performing other time-consuming tasks, without delaying API responses.
- **Backup storage:** Keeps independent database backups for disaster recovery.

## 6. GET /notes Request Flow

1. The client sends a `GET /notes` request over HTTPS.
2. DNS resolves the application's domain, and the request reaches the load balancer.
3. The load balancer forwards the request to a healthy application server.
4. The application server authenticates the user and checks authorization.
5. The server checks the cache for the user's notes.
6. If valid cached data exists, the server returns it to the client.
7. If the cache misses or the data is invalid, the server queries the database. Eligible reads may go to the read replica, while consistency-sensitive reads go to the primary database.
8. The server caches the result according to the cache policy.
9. The server returns a successful JSON response with the appropriate HTTP status.
10. If the request fails, the server returns a suitable error status and message without exposing sensitive internal details.

## 7. POST /notes Request Flow

1. The client sends a `POST /notes` request containing the note title and body as JSON over HTTPS.
2. DNS resolves the domain, and the load balancer forwards the request to a healthy application server.
3. The application server authenticates the user and verifies permission to create a note.
4. The server validates the request, including checking that the title is present and does not exceed 100 characters.
5. The server writes the new note to the primary database inside a transaction where appropriate.
6. The database commits the write and returns the created note and its generated identifier.
7. The application server invalidates or updates affected cache entries so that subsequent reads do not rely on stale data.
8. The server returns `201 Created` with the created note in the JSON response.
9. If background work is needed, the application publishes a job to the durable queue for a worker to process asynchronously.
10. If validation, authorization, or database operations fail, the server returns the appropriate error response and does not report an unsuccessful write as successful.

## 8. Architectural Trade-Offs

### Trade-Off 1: Cache Performance vs. Data Freshness

Caching frequently requested notes reduces database load and improves response times. However, cached notes may become stale after a user creates, updates, or deletes a note.

**Mitigation:** Invalidate or update affected cache entries after successful writes and apply a short time-to-live (TTL) as a fallback. For read-after-write operations, read from the primary database until the updated value is available. Cache invalidation should be monitored because delayed invalidation can temporarily return outdated results.

### Trade-Off 2: Read Replicas vs. Immediate Consistency

Read replicas distribute read traffic and allow the system to scale beyond the primary database's read capacity. However, replication is often asynchronous, meaning a recently created or updated note may not immediately appear on a replica.

**Mitigation:** Route consistency-sensitive reads to the primary database, monitor replication lag, and use replica reads only when the expected consistency level permits them.

### Trade-Off 3: Availability vs. Cost

Running multiple application servers, database replicas, redundant cache nodes, and durable queues improves availability but increases infrastructure and operational costs.

**Mitigation:** Begin with a capacity appropriate to actual traffic, monitor performance and failure rates, and scale components as usage grows. Keep critical redundancy even when reducing non-essential capacity.

### Trade-Off 4: Synchronous vs. Asynchronous Processing

Performing every operation synchronously can make API requests slower, while using a queue allows background tasks to run independently. However, asynchronous processing introduces additional complexity, including retries, duplicate jobs, and eventual consistency.

**Mitigation:** Keep essential note creation and database commits synchronous. Use a durable queue for non-critical background work, make workers idempotent, and monitor failed jobs and queue depth.

## 9. Failure Modes and Single Points of Failure

### Primary Database Failure

If the primary database becomes unavailable, write requests may fail until recovery or failover completes. The system should detect the failure and promote a healthy, sufficiently up-to-date read replica to primary when automatic failover is supported.

Application servers must reconnect through a stable database endpoint or service discovery mechanism. Automated backups and transaction logs should be available to recover data if replication is incomplete. A failover may still cause a brief interruption, and any acknowledged writes not replicated before failure may require recovery procedures depending on the database configuration.

### Application Server Failure

If one application server crashes, the load balancer should stop routing traffic to it after health checks fail. Other healthy instances continue serving requests. Deploying servers across separate availability zones reduces the risk of one infrastructure failure affecting every instance.

### Cache Failure or Stale Data

If the cache is unavailable, application servers can fall back to the database while applying rate limits, connection pooling, and circuit breakers to avoid overwhelming it. Cache entries should be invalidated after successful writes, and TTLs provide a fallback when invalidation messages are delayed or lost.

### Queue or Worker Failure

A durable queue retains pending jobs while workers are unavailable. Multiple workers, retry policies with backoff, dead-letter handling, and idempotent processing reduce the impact of individual worker failures and duplicate delivery.

### Avoiding Single Points of Failure

- **Load balancer:** Use a managed highly available service or redundant load balancers.
- **Application servers:** Run multiple instances across separate availability zones and use automated health checks.
- **Database:** Maintain replication, automated backups, monitoring, and a tested failover procedure.
- **Cache:** Use a highly available cache configuration and a safe database fallback.
- **Queue and workers:** Use a durable queue and multiple worker instances.
- **Object and backup storage:** Use durable storage services with redundancy and access controls.

These measures reduce the chance that one component failure will cause a complete system outage. Recovery time, replication lag, and backup restoration should be tested regularly rather than assumed to work.

## 10. Conclusion

QuickNotes can scale by separating the client, application servers, database, cache, and background processing. Given the assumed ten-to-one ratio of reads to writes, caching and read replicas are important for reducing database load. Redundant application instances, database recovery procedures, durable queues, and tested backups improve resilience. Cache invalidation and replication lag must be managed carefully to balance performance, consistency, availability, and cost.
