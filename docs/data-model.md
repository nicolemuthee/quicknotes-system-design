# QuickNotes Data Model

## 1. Overview

QuickNotes stores user accounts, notes, tags, and the relationships between notes and tags. A relational database such as PostgreSQL can enforce data integrity through primary keys, foreign keys, and unique constraints.

## 2. Entities and Columns

### Users

Stores account information.

| Column        | Type         | Constraints      |
| ------------- | ------------ | ---------------- |
| id            | INTEGER      | Primary key      |
| name          | VARCHAR(100) | NOT NULL         |
| email         | VARCHAR(255) | UNIQUE, NOT NULL |
| password_hash | VARCHAR(255) | NOT NULL         |
| created_at    | TIMESTAMP    | NOT NULL         |

### Notes

Stores notes created by users.

| Column     | Type         | Constraints             |
| ---------- | ------------ | ----------------------- |
| id         | INTEGER      | Primary key             |
| user_id    | INTEGER      | Foreign key to users.id |
| title      | VARCHAR(100) | NOT NULL                |
| body       | TEXT         | Nullable                |
| created_at | TIMESTAMP    | NOT NULL                |
| updated_at | TIMESTAMP    | NOT NULL                |

### Tags

Stores labels that users can assign to notes.

| Column  | Type        | Constraints             |
| ------- | ----------- | ----------------------- |
| id      | INTEGER     | Primary key             |
| user_id | INTEGER     | Foreign key to users.id |
| name    | VARCHAR(50) | NOT NULL                |

### Note_Tags

Connects notes to tags.

| Column  | Type    | Constraints             |
| ------- | ------- | ----------------------- |
| note_id | INTEGER | Foreign key to notes.id |
| tag_id  | INTEGER | Foreign key to tags.id  |

The combination of `note_id` and `tag_id` forms the composite primary key.

## 3. Relationships

- **Users to Notes — One-to-Many (1:M):** One user can create many notes. Each note belongs to one user.
- **Users to Tags — One-to-Many (1:M):** One user can create many tags.
- **Notes to Tags — Many-to-Many (M:N):** A note can have multiple tags, and a tag can be assigned to multiple notes. The `note_tags` junction table implements this relationship.

## 4. SQL Table Definitions

The following statements use PostgreSQL-compatible SQL.

```sql
CREATE TABLE users (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE notes (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(100) NOT NULL,
    body TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tags (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    UNIQUE (user_id, name)
);

CREATE TABLE note_tags (
    note_id INTEGER NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
    tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (note_id, tag_id)
);
```

## 5. Example SQL Queries

### Query 1: Retrieve all notes for a user

```sql
SELECT id, title, body, created_at
FROM notes
WHERE user_id = 1
ORDER BY created_at DESC;
```

### Query 2: Retrieve notes with their tags (JOIN)

```sql
SELECT
    n.id,
    n.title,
    t.name AS tag_name
FROM notes n
LEFT JOIN note_tags nt ON n.id = nt.note_id
LEFT JOIN tags t ON nt.tag_id = t.id
WHERE n.user_id = 1
ORDER BY n.id;
```

### Query 3: Count notes belonging to each user

```sql
SELECT
    u.id,
    u.name,
    COUNT(n.id) AS total_notes
FROM users u
LEFT JOIN notes n ON u.id = n.user_id
GROUP BY u.id, u.name
ORDER BY total_notes DESC;
```

### Query 4: Find notes with a particular tag

```sql
SELECT n.id, n.title, n.body
FROM notes n
JOIN note_tags nt ON n.id = nt.note_id
JOIN tags t ON nt.tag_id = t.id
WHERE n.user_id = 1
  AND t.name = 'Study';
```

## 6. Indexing

```sql
CREATE INDEX idx_notes_user_created
ON notes (user_id, created_at DESC);
```

This index helps the application retrieve a user's notes in date order without scanning the entire notes table. It supports a common query used when opening the notes list.

The primary keys and unique constraints also create indexes where supported by the database.

## 7. SQL vs NoSQL

**SQL is the preferred choice for QuickNotes** because the application has structured entities and clear relationships between users, notes, and tags.

A relational database provides foreign-key constraints, transactions, and consistent relationships. These features help prevent orphaned records and invalid note-tag associations.

A NoSQL database could offer flexible document structures and horizontal scaling, but it would make enforcing these particular relationships less straightforward. PostgreSQL is a suitable starting point for the proposed system.

```

**When you've saved the file, reply “done.”** Then we'll create `architecture.md`, including the required one-million-user estimates and architecture diagram.
```
