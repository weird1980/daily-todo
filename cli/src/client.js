const BASE = `http://localhost:${process.env.TODO_API_PORT || 7847}`;

/**
 * Performs a GET request and returns parsed JSON.
 * @param {string} path - API path (e.g. '/api/tasks')
 * @returns {Promise<unknown>}
 */
export async function apiGet(path) {
  const res = await fetch(`${BASE}${path}`);

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `GET ${path} failed with status ${res.status}`);
  }

  return res.json();
}

/**
 * Performs a POST request with JSON body and returns parsed JSON.
 * @param {string} path - API path
 * @param {Record<string, unknown>} body - Request body
 * @returns {Promise<unknown>}
 */
export async function apiPost(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `POST ${path} failed with status ${res.status}`);
  }

  return res.json();
}

/**
 * Performs a PATCH request with JSON body and returns parsed JSON.
 * @param {string} path - API path
 * @param {Record<string, unknown>} body - Request body
 * @returns {Promise<unknown>}
 */
export async function apiPatch(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `PATCH ${path} failed with status ${res.status}`);
  }

  return res.json();
}

/**
 * Checks if the server is running by hitting the health endpoint.
 * @returns {Promise<boolean>}
 */
export async function checkServer() {
  try {
    await fetch(`${BASE}/health`);
    return true;
  } catch {
    return false;
  }
}
