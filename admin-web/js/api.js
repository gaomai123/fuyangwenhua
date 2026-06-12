(function initApi(global) {
  const API_BASE = `${window.location.origin}/api`;
  const TOKEN_KEY = 'artist_admin_token';

  function getToken() {
    return localStorage.getItem(TOKEN_KEY) || '';
  }

  function setToken(token) {
    localStorage.setItem(TOKEN_KEY, token);
  }

  function clearToken() {
    localStorage.removeItem(TOKEN_KEY);
  }

  async function request(path, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };

    const token = getToken();

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers
    });
    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Request failed');
    }

    return data;
  }

  global.AdminApi = {
    API_BASE,
    clearToken,
    getToken,
    request,
    setToken
  };
})(window);
