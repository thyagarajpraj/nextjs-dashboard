import { NextResponse } from 'next/server';
import { removeTodo, updateTodo } from '@/app/lib/todo-store';
import type { UpdateTodoPayload } from '@/app/lib/todo-types';

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export const dynamic = 'force-dynamic';

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  let body: UpdateTodoPayload;

  try {
    body = (await request.json()) as UpdateTodoPayload;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const hasTitle = typeof body.title !== 'undefined';
  const hasCompleted = typeof body.completed !== 'undefined';

  if (!hasTitle && !hasCompleted) {
    return NextResponse.json(
      { error: 'At least one field is required.' },
      { status: 400 },
    );
  }

  if (hasTitle && typeof body.title !== 'string') {
    return NextResponse.json({ error: 'Title must be a string.' }, { status: 400 });
  }

  if (hasCompleted && typeof body.completed !== 'boolean') {
    return NextResponse.json(
      { error: 'Completed must be a boolean.' },
      { status: 400 },
    );
  }

  try {
    const todo = await updateTodo(id, body);
    if (!todo) {
      return NextResponse.json({ error: 'Todo not found.' }, { status: 404 });
    }
    return NextResponse.json({ todo });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to update todo.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const removed = await removeTodo(id);
  if (!removed) {
    return NextResponse.json({ error: 'Todo not found.' }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
