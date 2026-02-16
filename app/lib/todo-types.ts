export type Todo = {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateTodoPayload = {
  title: string;
};

export type UpdateTodoPayload = {
  title?: string;
  completed?: boolean;
};
