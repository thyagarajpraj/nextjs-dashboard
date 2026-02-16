import { TodoApp } from '@/app/ui/todo-app';

export default function HomePage() {
  return (
    <main className="page">
      <section className="shell">
        <header className="page-header">
          <p className="eyebrow">Full Stack Next.js</p>
          <h1>Todo App</h1>
          <p className="subtitle">
            Frontend UI + backend API routes with persistent JSON storage.
          </p>
        </header>
        <TodoApp />
      </section>
    </main>
  );
}
