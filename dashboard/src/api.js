const API_BASE = '/api';

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || `Request failed: ${response.status}`);
  }

  return response.json();
}

// Tasks
export function fetchTasks(date, { includeCarryOver = false } = {}) {
  let params = date ? `?date=${date}` : '';
  if (includeCarryOver) params += `${params ? '&' : '?'}includeCarryOver=true`;
  return request(`/tasks${params}`);
}

export function createTask(data) {
  return request('/tasks', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function updateTaskStatus(id, status, summary) {
  return request(`/tasks/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status, summary }),
  });
}

export function moveTask(id, direction) {
  return request(`/tasks/${id}/move`, {
    method: 'PATCH',
    body: JSON.stringify({ direction }),
  });
}

export function changeTaskDate(id, date) {
  return request(`/tasks/${id}/date`, {
    method: 'PATCH',
    body: JSON.stringify({ date }),
  });
}

export function reopenTask(id) {
  return request(`/tasks/${id}/reopen`, {
    method: 'PATCH',
  });
}

export function fetchCompletedHistory(days = 30) {
  return request(`/tasks/history?days=${days}`);
}

// Categories
export function fetchCategories() {
  return request('/categories');
}

// Updates & Standups
export function generateUpdate(date, group) {
  return request('/updates/generate', {
    method: 'POST',
    body: JSON.stringify({ date, group }),
  });
}

export function fetchStandup(date) {
  const params = date ? `?date=${date}` : '';
  return request(`/standups${params}`);
}

export function fetchUpdates() {
  return request('/updates');
}

// WebSocket
export function connectWebSocket(onMessage) {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const url = `${protocol}//${window.location.hostname}:7847`;

  function connect() {
    const ws = new WebSocket(url);

    ws.addEventListener('message', (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage(data);
      } catch {
        // Ignore non-JSON messages
      }
    });

    ws.addEventListener('close', () => {
      setTimeout(connect, 2000);
    });

    ws.addEventListener('error', () => {
      ws.close();
    });

    return ws;
  }

  return connect();
}
