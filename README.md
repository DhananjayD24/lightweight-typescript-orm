# Lightweight TypeScript ORM Monorepo & Todo Application

A type-safe, lightweight TypeScript ORM designed specifically for serverless Postgres SQL databases (such as Neon, Supabase, Railway, or standard Postgres instances). The ORM is developed within this monorepo and published as the reusable npm package [`lightweight-ts-orm`](https://www.npmjs.com/package/lightweight-ts-orm), paired with a full-stack Todo Application (React + Tailwind CSS frontend and Express.js backend).

---

## 🌐 Live Demo

**Todo Application:** ( https://lightweight-typescript-orm-client.vercel.app/ )

**Backend API:** ( https://lightweight-typescript-orm.onrender.com )

**ORM Package URL:** ( https://www.npmjs.com/package/lightweight-ts-orm )

## 🚀 Quick Start

### 1. Installation
Clone the repository and install dependencies from the monorepo root:

```bash
npm install
```

### 2. Configure Environment Variables
Environment configuration templates are included for both backend and frontend:

- **Backend API (`apps/todo-app/server/.env`)**:
  ```env
  PORT=5000
  NODE_ENV=development
  DATABASE_URL=postgres://user:password@ep-sample-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
  DB_SSL=true
  ```
  *(Note: If `DATABASE_URL` is left empty, the ORM automatically falls back to an in-memory SQL driver so the application works out-of-the-box!)*

- **Frontend UI (`apps/todo-app/client/.env`)**:
  ```env
  VITE_API_BASE_URL=http://localhost:5000/api
  ```

### 3. Run Development Servers

Run both backend and frontend concurrently:

```bash
npm run dev
```

- **Frontend UI**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:5000/api](http://localhost:5000/api)

---

## 🏗️ Monorepo Structure

```
lightweight-typescript-orm/
├── packages/
│   └── orm/                          # Published npm package: lightweight-ts-orm
│       ├── src/
│       │   ├── types.ts              # Generic type inference mechanics
│       │   ├── fields.ts             # Field type builders (number, string, boolean, date, json)
│       │   ├── schema.ts             # defineModel schema metadata
│       │   ├── query-builder.ts      # CRUD delegate & query chaining (.where, .orderBy, .limit)
│       │   ├── sql-generator.ts      # Parameterized Postgres SQL builder ($1, $2)
│       │   ├── relations.ts          # Relation definitions (belongsTo, hasMany)
│       │   ├── transaction.ts        # SQL Transaction runner (BEGIN / COMMIT / ROLLBACK)
│       │   ├── validation.ts         # Runtime schema validation layer
│       │   ├── migration.ts          # Automatic DDL Schema Sync (CREATE TABLE)
│       │   ├── client.ts             # createDatabase client factory
│       │   └── index.ts              # Re-exported package entry point
│       ├── package.json
│       └── tsconfig.json
│
├── apps/
│   └── todo-app/                     # Example Todo Application
│       ├── server/                   # Express.js REST API
│       │   ├── src/
│       │   │   ├── models.ts         # Todo & Category model definitions
│       │   │   ├── db.ts             # ORM Client instance & seeder
│       │   │   ├── routes.ts         # Express endpoints using ORM
│       │   │   └── server.ts         # Server bootstrapper
│       │   ├── .env & .env.example
│       │   ├── package.json
│       │   └── tsconfig.json
│       │
│       └── client/                   # React + Tailwind CSS UI
│           ├── src/
│           │   ├── components/       # Header, TodoFilters, TodoItem, Modals
│           │   ├── api.ts            # REST API client
│           │   ├── App.tsx           # React shell
│           │   └── index.css         # Tailwind directives & glassmorphism
│           ├── .env & .env.example
│           ├── package.json
│           └── tsconfig.json
│
├── package.json                      # Workspace root scripts
├── README.md                         # Documentation
└── ARCHITECTURE.md                  # Detailed design breakdown
```

---

## 📖 ORM API Design & Usage

### 1. Defining Models

Define models using type-safe field builders:

```typescript
import { defineModel, number, string, boolean, belongsTo } from 'lightweight-ts-orm';

export const Category = defineModel('category', {
  id: number().primaryKey(),
  name: string().validate(val => val.length > 0 || 'Name required'),
  color: string().default('#3b82f6'),
});

export const Todo = defineModel(
  'todo',
  {
    id: number().primaryKey(),
    title: string().validate(val => val.length > 0 || 'Title required'),
    completed: boolean().default(false),
    priority: string().default('medium'),
    categoryId: number().optional().references(Category, 'id'),
  },
  {
    relations: {
      category: belongsTo(Category, { foreignKey: 'categoryId' }),
    },
  }
);
```

### 2. Creating Database Client & Sync

```typescript
import { createDatabase } from 'lightweight-ts-orm';
import { Category, Todo } from './models';

export const db = createDatabase({
  connectionString: process.env.DATABASE_URL,
  ssl: true,
  models: { category: Category, todo: Todo },
});

// Sync database tables (CREATE TABLE IF NOT EXISTS)
await db.sync();
```

### 3. CRUD Operations & Query Filtering

```typescript
// Create a new record (Fully typed input & output)
const newTodo = await db.todo.create({
  title: 'Finish ORM assignment',
  completed: false,
  priority: 'high',
  categoryId: 1,
});

// Query filtering with relational include
const activeTodos = await db.todo.findMany({
  where: { completed: false, priority: 'high' },
  orderBy: { id: 'DESC' },
  include: { category: true },
});

// Update record
const updated = await db.todo.updateOne({
  where: { id: newTodo.id },
  data: { completed: true },
});

// Delete record
await db.todo.delete({ where: { id: newTodo.id } });
```

### 4. Fluent Query Chaining (Bonus)

```typescript
const result = await db.todo
  .query()
  .where({ completed: false })
  .orderBy({ id: 'DESC' })
  .limit(5)
  .execute();
```

### 5. Transactions & Aggregates (Bonus)

```typescript
// Transaction support
await db.transaction(async (tx) => {
  await db.todo.create({ title: 'Task 1', completed: false });
  await db.todo.create({ title: 'Task 2', completed: false });
});

// Aggregates
const totalCount = await db.todo.count();
```

---

## 🧠 TypeScript Architecture & Type Inference

### 1. How Types Are Inferred
The ORM uses conditional types and phantom type properties (`$inferSelect`, `$inferInsert`, `$inferUpdate`) on `ModelDefinition`.

- **Selection Type (`InferModel<TSchema>`)**: Maps each column builder to its scalar type (`number`, `string`, `boolean`, `Date`).
- **Insertion Type (`InferInsert<TSchema>`)**: Marks columns with default values, auto-increment primary keys, or `.optional()` as optional in the `create()` payload.
- **Update Type (`InferUpdate<TSchema>`)**: Makes all columns optional for patch updates.

### 2. Tradeoffs in Type System
- **Generics Complexity**: Provides strict type safety without needing heavy code generators (like Prisma CLI).
- **Compile-time vs Runtime**: Runtime validation (`validateRecord`) runs alongside TypeScript types to guarantee invalid inputs are rejected even when bypass attempts occur at API layer.

---

## 🔄 Query Execution Flow

```
Model API (db.todo.findMany)
       │
       ▼
Runtime Validation & Relation Resolver
       │
       ▼
Query Builder & SQL Generator (buildSelectSql / Parameter Binding $1, $2)
       │
       ▼
Database Driver (Postgres Pool / Serverless Client / Memory Fallback)
       │
       ▼
Mapped Typed Objects Returned to Developer
```


## ⚠️ Known Limitations & Future Improvements

1. **Migrations**: Supports schema auto-synchronization (`sync()`), but full step-by-step schema migration versioning files are optional/unimplemented.
2. **Complex Joins**: Relational queries (`include`) currently execute two-stage batched joins for maximum serverless query compatibility; deep multi-level recursive joins could be added in future iterations.
3. **Database Dialects**: Focused strictly on PostgreSQL and serverless Postgres extensions (Neon, Supabase).

## ⏱️ Time Spent

Approximately **8-10 hours** were spent designing, implementing, testing, documenting, and deploying the ORM and Todo application.

## 🤖 AI Tools Disclosure

AI tools were used during development for:

- Understanding TypeScript, ORM architecture, and database concepts
- Debugging and troubleshooting implementation issues
- Reviewing code structure and implementation decisions
- Improving documentation and README organization

The final implementation was reviewed and understood before submission.