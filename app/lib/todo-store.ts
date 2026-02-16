import { randomUUID } from 'crypto';
import { promises as fs } from 'fs';
import path from 'path';
import type { Todo, UpdateTodoPayload } from '@/app/lib/todo-types';

const dataFilePath = path.join(process.cwd(), 'data', 'todos.json');
let storeLock: Promise<unknown> = Promise.resolve();

async function ensureDataFile() {
  await fs.mkdir(path.dirname(dataFilePath), { recursive: true });
  try {
    await fs.access(dataFilePath);
  } catch {
    await fs.writeFile(dataFilePath, '[]', 'utf8');
  }
}

async function readTodos(): Promise<Todo[]> {
  await ensureDataFile();
  const raw = await fs.readFile(dataFilePath, 'utf8');
  const parsed: unknown = JSON.parse(raw);
  return Array.isArray(parsed) ? (parsed as Todo[]) : [];
}

async function writeTodos(todos: Todo[]) {
  await ensureDataFile();
  await fs.writeFile(dataFilePath, `${JSON.stringify(todos, null, 2)}\n`, 'utf8');
}

function withStoreLock<T>(task: () => Promise<T>): Promise<T> {
  const nextTask = storeLock.then(task, task);
  storeLock = nextTask.then(
    () => undefined,
    () => undefined,
  );
  return nextTask;
}

export async function listTodos(): Promise<Todo[]> {
  const todos = await readTodos();
  return todos.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function createTodo(title: string): Promise<Todo> {
  const normalizedTitle = title.trim();
  if (!normalizedTitle) {
    throw new Error('Title is required.');
  }

  return withStoreLock(async () => {
    const todos = await readTodos();
    const now = new Date().toISOString();
    const todo: Todo = {
      id: randomUUID(),
      title: normalizedTitle,
      completed: false,
      createdAt: now,
      updatedAt: now,
    };
    todos.push(todo);
    await writeTodos(todos);
    return todo;
  });
}

export async function updateTodo(
  id: string,
  updates: UpdateTodoPayload,
): Promise<Todo | null> {
  return withStoreLock(async () => {
    const todos = await readTodos();
    const index = todos.findIndex((todo) => todo.id === id);
    if (index < 0) {
      return null;
    }

    const existing = todos[index];
    const nextTitle =
      typeof updates.title === 'string' ? updates.title.trim() : existing.title;

    if (!nextTitle) {
      throw new Error('Title cannot be empty.');
    }

    const updated: Todo = {
      ...existing,
      title: nextTitle,
      completed:
        typeof updates.completed === 'boolean'
          ? updates.completed
          : existing.completed,
      updatedAt: new Date().toISOString(),
    };

    todos[index] = updated;
    await writeTodos(todos);
    return updated;
  });
}

export async function removeTodo(id: string): Promise<boolean> {
  return withStoreLock(async () => {
    const todos = await readTodos();
    const nextTodos = todos.filter((todo) => todo.id !== id);
    if (nextTodos.length === todos.length) {
      return false;
    }
    await writeTodos(nextTodos);
    return true;
  });
}
