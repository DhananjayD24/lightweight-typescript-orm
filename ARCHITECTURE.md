# Architectural Deep Dive: Lightweight TypeScript ORM

This document provides a comprehensive technical breakdown of the architecture, design patterns, and type system mechanics powering `lightweight-ts-orm`.

---

## 🏛️ System Architecture Overview

`lightweight-ts-orm` is built with a modular, layered architecture designed specifically for serverless Postgres execution. It avoids monolithic singletons or heavy runtime generation steps.

```
┌─────────────────────────────────────────────────────────┐
│                    Developer Code                       │
│    (defineModel, createDatabase, db.todo.findMany)      │
└────────────────────────────┬────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────┐
│                    ORM Client & Proxy                   │
│        (Type-safe delegates & Model Registration)       │
└────────────────────────────┬────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────┐
│               Query Builder & Validation                │
│    (validateRecord, Fluent Chaining, Relation Include)  │
└────────────────────────────┬────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────┐
│                Parameterized SQL Generator              │
│       (buildSelectSql, buildInsertSql, DDL Sync)        │
└────────────────────────────┬────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────┐
│                 Postgres Driver Layer                   │
│   (pg Pool / Serverless Driver / Fallback Simulator)    │
└─────────────────────────────────────────────────────────┘
```

---

## ⚡ Core Technical Mechanisms

### 1. Zero-Codegen Type Inference Engine

Traditional ORMs require running a CLI generator command (e.g. `prisma generate`) every time the schema changes. `lightweight-ts-orm` achieves complete type safety dynamically in pure TypeScript using mapped conditional generics:

```typescript
export type InferColumnType<TBuilder> = TBuilder extends ColumnBuilder<infer TType, infer TOptional, any>
  ? TOptional extends true ? TType | null | undefined : TType
  : never;

export type InferModel<TSchema extends SchemaDefinition> = {
  [K in keyof TSchema]: InferColumnType<TSchema[K]>;
};
```

When you define:

```typescript
const Todo = defineModel('todo', {
  id: number().primaryKey(),
  title: string(),
  completed: boolean().default(false),
});
```

TypeScript automatically infers:
- **`SelectType`**: `{ id: number; title: string; completed: boolean }`
- **`InsertType`**: `{ title: string; id?: number; completed?: boolean }`
- **`UpdateType`**: `{ id?: number; title?: string; completed?: boolean }`

### 2. SQL Injection Prevention & Parameter Binding

All user input passed to `where`, `create`, or `update` methods is automatically separated from the SQL text string into parameterized variables (`$1`, `$2`, `$3`).

Example query:
```typescript
db.todo.findMany({ where: { completed: false, priority: 'high' } });
```
Generated SQL:
```sql
SELECT "todo"."id", "todo"."title", "todo"."completed", "todo"."priority", "todo"."categoryId"
FROM "todo"
WHERE "todo"."completed" = $1 AND "todo"."priority" = $2 ORDER BY "todo"."id" DESC;
```
Parameters array: `[false, 'high']`

### 3. Serverless SQL Compatibility

Serverless SQL environments like Neon and Supabase feature HTTP connection pooling and instant cold starts. Heavy ORMs with large binary engines often degrade serverless function response times. `lightweight-ts-orm` is zero-dependency (other than `pg`), lightweight (< 15KB compressed), and uses standard stateless connection pools.

### 4. Automatic DDL Schema Synchronization

The ORM includes an automatic DDL migration engine (`db.sync()`) that analyzes table dependency order (referential foreign keys) and emits idempotent `CREATE TABLE IF NOT EXISTS` statements with exact column types, primary key serial constraints, and foreign key rules.

---

## 🧪 Bonus Point Features Included

1. **Relational Joins (`belongsTo` & `hasMany`)**: Models can declare relationships that are resolved using `include: { category: true }`.
2. **Fluent Query Chaining**: `db.todo.query().where(...).orderBy(...).limit(...).execute()`.
3. **Schema Sync Engine**: Idempotent table DDL creation.
4. **Transaction Support**: `db.transaction(async (tx) => { ... })` wrapping execution inside `BEGIN` / `COMMIT` / `ROLLBACK`.
5. **Runtime Validation Layer**: Schema field constraints (`.validate()`) run before SQL generation to ensure data integrity.
6. **CLI Tooling**: `npx light-orm sync` command for table generation.
