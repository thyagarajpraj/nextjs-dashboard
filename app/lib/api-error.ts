export function toApiErrorResponse(error: unknown, fallbackMessage: string) {
  const message = error instanceof Error ? error.message : fallbackMessage;
  const validationMessages = new Set(['Title is required.', 'Title cannot be empty.']);
  const status = message.includes('Missing DB connection string')
    ? 503
    : validationMessages.has(message)
      ? 400
      : 500;
  return {
    error: message,
    status,
  };
}
