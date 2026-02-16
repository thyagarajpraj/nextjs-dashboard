'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import type { Todo } from '@/app/lib/todo-types';

type TodoResponse = {
  todos: Todo[];
};

type SingleTodoResponse = {
  todo: Todo;
};

type ErrorResponse = {
  error?: string;
};

async function readErrorMessage(response: Response) {
  try {
    const data = (await response.json()) as ErrorResponse;
    return data.error ?? 'Request failed.';
  } catch {
    return 'Request failed.';
  }
}

export function TodoApp() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const counts = useMemo(() => {
    const completed = todos.filter((todo) => todo.completed).length;
    return {
      total: todos.length,
      completed,
      pending: todos.length - completed,
    };
  }, [todos]);

  useEffect(() => {
    void fetchTodos();
  }, []);

  async function fetchTodos() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/todos', {
        method: 'GET',
        cache: 'no-store',
      });
      if (!response.ok) {
        throw new Error(await readErrorMessage(response));
      }
      const data = (await response.json()) as TodoResponse;
      setTodos(data.todos);
    } catch (fetchError) {
      const message =
        fetchError instanceof Error ? fetchError.message : 'Failed to load todos.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextTitle = title.trim();
    if (!nextTitle) {
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: nextTitle }),
      });
      if (!response.ok) {
        throw new Error(await readErrorMessage(response));
      }
      const data = (await response.json()) as SingleTodoResponse;
      setTodos((current) => [data.todo, ...current]);
      setTitle('');
    } catch (createError) {
      const message =
        createError instanceof Error ? createError.message : 'Failed to create todo.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggle(todo: Todo) {
    setError(null);
    const previousTodos = todos;
    const nextTodos = todos.map((item) =>
      item.id === todo.id ? { ...item, completed: !item.completed } : item,
    );
    setTodos(nextTodos);

    try {
      const response = await fetch(`/api/todos/${todo.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !todo.completed }),
      });
      if (!response.ok) {
        throw new Error(await readErrorMessage(response));
      }
    } catch (toggleError) {
      setTodos(previousTodos);
      const message =
        toggleError instanceof Error ? toggleError.message : 'Failed to update todo.';
      setError(message);
    }
  }

  async function handleDelete(id: string) {
    setError(null);
    const previousTodos = todos;
    setTodos((current) => current.filter((todo) => todo.id !== id));

    try {
      const response = await fetch(`/api/todos/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error(await readErrorMessage(response));
      }
    } catch (deleteError) {
      setTodos(previousTodos);
      const message =
        deleteError instanceof Error ? deleteError.message : 'Failed to delete todo.';
      setError(message);
    }
  }

  return (
    <section className="todo-card">
      <form className="todo-form" onSubmit={handleCreate}>
        <input
          type="text"
          placeholder="Add a new todo"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          maxLength={200}
          aria-label="Todo title"
        />
        <button type="submit" disabled={submitting || !title.trim()}>
          {submitting ? 'Adding...' : 'Add'}
        </button>
      </form>

      <div className="todo-meta">
        <span>Total: {counts.total}</span>
        <span>Pending: {counts.pending}</span>
        <span>Completed: {counts.completed}</span>
      </div>

      {error ? <p className="message error">{error}</p> : null}
      {loading ? <p className="message">Loading todos...</p> : null}

      {!loading && todos.length === 0 ? (
        <p className="message">No todos yet. Add your first task.</p>
      ) : null}

      {!loading && todos.length > 0 ? (
        <ul className="todo-list">
          {todos.map((todo) => (
            <li key={todo.id} className={todo.completed ? 'is-complete' : ''}>
              <label>
                <input
                  type="checkbox"
                  checked={todo.completed}
                  onChange={() => void handleToggle(todo)}
                />
                <span>{todo.title}</span>
              </label>
              <button
                type="button"
                className="danger"
                onClick={() => void handleDelete(todo.id)}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
