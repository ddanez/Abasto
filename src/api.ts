export async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const userJson = localStorage.getItem('abasto_user');
  const user = userJson ? JSON.parse(userJson) : null;

  // Clone or build new headers to append user metadata for audit logging
  const headers = new Headers(options.headers || {});
  if (user && url.startsWith('/api')) {
    headers.set('x-user-username', user.username);
    headers.set('x-user-name', user.name);
  }

  return fetch(url, {
    ...options,
    headers
  });
}
