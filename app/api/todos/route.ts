import { NextResponse } from 'next/server';
import { createTodo, listTodos } from '@/app/lib/todo-store';
import { toApiErrorResponse } from '@/app/lib/api-error';
import type { CreateTodoPayload } from '@/app/lib/todo-types';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const todos = await listTodos();
    return NextResponse.json({ todos });
  } catch (error) {
    const apiError = toApiErrorResponse(error, 'Failed to load todos.');
    return NextResponse.json({ error: apiError.error }, { status: apiError.status });
  }
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
    const apiError = toApiErrorResponse(error, 'Failed to create todo.');
    return NextResponse.json({ error: apiError.error }, { status: apiError.status });
  }
}
