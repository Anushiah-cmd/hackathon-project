/**
 * CRIMVEXA WITNESS — Central API Service
 * All backend calls go through this module.
 * Base URL: http://127.0.0.1:5000
 */

const API_BASE = "http://127.0.0.1:5000/api";

async function _request(method, path, body = null) {
  const opts = {
    method,
    headers: { "Content-Type": "application/json" },
  };
  if (body) opts.body = JSON.stringify(body);

  try {
    const res = await fetch(`${API_BASE}${path}`, opts);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw { status: res.status, message: data.error || "Unknown error from server." };
    }
    return data;
  } catch (err) {
    if (err.status) throw err;
    throw { status: 0, message: "Cannot reach the backend. Make sure the server is running on port 5000." };
  }
}

export const api = {
  health:          ()           => _request("GET",   "/health"),
  submitComplaint: (payload)    => _request("POST",  "/complaints", payload),
  listComplaints:  ()           => _request("GET",   "/complaints"),
  getComplaint:    (id)         => _request("GET",   `/complaints/${id}`),
  analyzeComplaint:(id)         => _request("POST",  `/complaints/${id}/analyze`),
  updateStatus:    (id, status) => _request("PATCH", `/complaints/${id}/status`, { status }),
};
