import { randomUUID } from 'crypto';
import { createClient, createPool } from '@vercel/postgres';
import type { Todo, UpdateTodoPayload } from '@/app/lib/todo-types';

type TodoRow = {
  id: string;
  title: string;
  completed: boolean;
  created_at: string | Date;
  updated_at: string | Date;
};

let ensureTablePromise: Promise<void> | null = null;

function getConnectionStrings() {
  const candidates = [
    process.env.POSTGRES_URL_NON_POOLING ??
      null,
    process.env.DATABASE_URL_UNPOOLED ?? null,
    process.env.DATABASE_URL ?? null,
    process.env.POSTGRES_URL ?? null,
  ].filter((value): value is string => Boolean(value));

  return [...new Set(candidates)];
}

async function runQuery<T extends Record<string, unknown>>(
  query: string,
  params: Array<string | boolean | null>,
) {
  const connectionStrings = getConnectionStrings();
  if (connectionStrings.length === 0) {
    throw new Error(
      'Missing DB connection string. Set POSTGRES_URL_NON_POOLING or DATABASE_URL/DATABASE_URL_UNPOOLED.',
    );
  }

  let lastError: unknown = null;
  for (const connectionString of connectionStrings) {
    const isPooledConnection = connectionString.includes('-pooler.');
    try {
      if (isPooledConnection) {
        const pool = createPool({ connectionString });
        try {
          return await pool.query<T>(query, params);
        } finally {
          await pool.end();
        }
      }

      const client = createClient({ connectionString });
      await client.connect();
      try {
        return await client.query<T>(query, params);
      } finally {
        await client.end();
      }
    } catch (error) {
      lastError = error;
    }
  }

  if (lastError instanceof Error) {
    const errorCode =
      typeof (lastError as { code?: unknown }).code === 'string'
        ? (lastError as { code: string }).code
        : 'UNKNOWN';
    throw new Error(`Failed to connect to database: ${lastError.message} (${errorCode})`);
  }

  throw new Error('Failed to connect to database.');
}

function toIsoDate(value: string | Date): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function mapTodoRow(row: TodoRow): Todo {
  return {
    id: row.id,
    title: row.title,
    completed: row.completed,
    createdAt: toIsoDate(row.created_at),
    updatedAt: toIsoDate(row.updated_at),
  };
}

async function ensureTodosTable() {
  if (getConnectionStrings().length === 0) {
    throw new Error(
      'Missing DB connection string. Set POSTGRES_URL_NON_POOLING or DATABASE_URL/DATABASE_URL_UNPOOLED.',
    );
  }

  if (!ensureTablePromise) {
    ensureTablePromise = runQuery(
      `CREATE TABLE IF NOT EXISTS todos (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        completed BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );`,
      [],
    )
      .then(() => undefined)
      .catch((error) => {
        ensureTablePromise = null;
        throw error;
      });
  }

  await ensureTablePromise;
}

export async function listTodos(): Promise<Todo[]> {
  await ensureTodosTable();
  const { rows } = await runQuery<TodoRow>(
    `SELECT id, title, completed, created_at, updated_at
     FROM todos
     ORDER BY created_at DESC;`,
    [],
  );
  return rows.map(mapTodoRow);
}

export async function createTodo(title: string): Promise<Todo> {
  const normalizedTitle = title.trim();
  if (!normalizedTitle) {
    throw new Error('Title is required.');
  }

  await ensureTodosTable();
  const id = randomUUID();
  const { rows } = await runQuery<TodoRow>(
    `INSERT INTO todos (id, title)
     VALUES ($1, $2)
     RETURNING id, title, completed, created_at, updated_at;`,
    [id, normalizedTitle],
  );
  return mapTodoRow(rows[0]);
}

export async function updateTodo(
  id: string,
  updates: UpdateTodoPayload,
): Promise<Todo | null> {
  await ensureTodosTable();
  const hasTitleUpdate = typeof updates.title === 'string';
  const normalizedTitle = hasTitleUpdate ? updates.title?.trim() : undefined;

  if (hasTitleUpdate && !normalizedTitle) {
    throw new Error('Title cannot be empty.');
  }

  const hasCompletedUpdate = typeof updates.completed === 'boolean';
  const { rows } = await runQuery<TodoRow>(
    `UPDATE todos
     SET
       title = CASE
         WHEN $2::BOOLEAN THEN $3
         ELSE title
       END,
       completed = CASE
         WHEN $4::BOOLEAN THEN $5
         ELSE completed
       END,
       updated_at = NOW()
     WHERE id = $1
     RETURNING id, title, completed, created_at, updated_at;`,
    [
      id,
      hasTitleUpdate,
      normalizedTitle ?? null,
      hasCompletedUpdate,
      updates.completed ?? null,
    ],
  );

  if (rows.length === 0) {
    return null;
  }

  return mapTodoRow(rows[0]);
}

export async function removeTodo(id: string): Promise<boolean> {
  await ensureTodosTable();
  const result = await runQuery(
    `DELETE FROM todos WHERE id = $1;`,
    [id],
  );
  return result.rowCount > 0;
}
