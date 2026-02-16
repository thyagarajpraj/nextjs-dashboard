import { NextResponse } from 'next/server';
import { createTodo, listTodos } from '@/app/lib/todo-store';
import type { CreateTodoPayload } from '@/app/lib/todo-types';

export const dynamic = 'force-dynamic';

export async function GET() {
  const todos = await listTodos();
  return NextResponse.json({ todos });
}

export async function POST(request: Request) {
  let body: CreateTodoPayload;

  try {
    body = (await request.json()) as CreateTodoPayload;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  if (!body?.title || typeof body.title !== 'string') {
    return NextResponse.json({ error: 'Title is required.' }, { status: 400 });
  }

  try {
    const todo = await createTodo(body.title);
    return NextResponse.json({ todo }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to create todo.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
