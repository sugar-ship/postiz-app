export const linesToArray = (value?: string) =>
  (value || '')
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);

export const arrayToLines = (value?: unknown) =>
  Array.isArray(value) ? value.join('\n') : '';

export const objectToLines = (value?: unknown) =>
  value && typeof value === 'object'
    ? Object.entries(value as Record<string, unknown>)
        .map(([key, item]) => `${key}: ${String(item)}`)
        .join('\n')
    : '';

export const linesToObject = (value?: string) =>
  Object.fromEntries(
    (value || '')
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const separator = line.indexOf(':');
        return separator === -1
          ? [line, '']
          : [line.slice(0, separator).trim(), line.slice(separator + 1).trim()];
      })
  );

export async function readApiResponse<T>(response: Response): Promise<T> {
  if (response.ok) return response.json();
  const body = await response.json().catch(() => ({}));
  const message = Array.isArray(body?.message)
    ? body.message.join(', ')
    : body?.message || 'The request could not be completed.';
  throw new Error(message);
}
