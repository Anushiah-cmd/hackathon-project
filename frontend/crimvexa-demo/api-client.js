(function () {
  const API_BASE = "http://127.0.0.1:5000/api";
  const SESSION_KEY = "crimvexa-session-v1";

  function session() {
    try {
      return JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
    } catch {
      return null;
    }
  }

  async function request(path, options = {}) {
    const headers = new Headers(options.headers || {});
    const saved = session();
    if (saved && saved.token) headers.set("Authorization", `Bearer ${saved.token}`);
    if (options.body && !(options.body instanceof FormData)) {
      headers.set("Content-Type", "application/json");
      options.body = JSON.stringify(options.body);
    }
    let response;
    try {
      response = await fetch(`${API_BASE}${path}`, { ...options, headers });
    } catch {
      throw new Error("Cannot reach the API. Start the backend on port 5000 and try again.");
    }
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || `Request failed (${response.status}).`);
    return data;
  }

  function saveSession(result) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(result));
  }

  async function requireUser(role) {
    const saved = session();
    if (!saved || !saved.token) {
      window.location.href = "login.html";
      return null;
    }
    try {
      const result = await request("/auth/me");
      if (role && result.user.role !== role && result.user.role !== "admin") {
        throw new Error("This account does not have permission to view this page.");
      }
      return result.user;
    } catch (error) {
      localStorage.removeItem(SESSION_KEY);
      if (error.message.includes("permission")) throw error;
      window.location.href = "login.html";
      return null;
    }
  }

  window.CrimvexaAPI = {
    session,
    request,
    async download(path) {
      const saved = session();
      const headers = saved && saved.token
        ? { Authorization: `Bearer ${saved.token}` } : {};
      const response = await fetch(`${API_BASE}${path}`, { headers });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || `Download failed (${response.status}).`);
      }
      return response.blob();
    },
    saveSession,
    requireUser,
    formatDate(value) {
      if (!value) return "—";
      const date = new Date(value);
      return Number.isNaN(date.getTime())
        ? value
        : date.toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
    },
    escapeHTML(value) {
      return String(value == null ? "" : value).replace(/[&<>"']/g, char => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
      })[char]);
    },
    logout() {
      localStorage.removeItem(SESSION_KEY);
      window.location.href = "index.html";
    }
  };
})();
