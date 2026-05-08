const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";
const REQUEST_TIMEOUT_MS = 12000;
const UPLOAD_TIMEOUT_MS  = 60000; // uploads precisam de mais tempo (cold start + Cloudinary)

async function fetchWithTimeout(url, options = {}, timeoutMs = REQUEST_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new Error("A API demorou para responder. Verifique o deploy da API.");
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function apiFetch(path, options = {}) {
  const token = localStorage.getItem("admin_token");
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetchWithTimeout(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem("admin_token");
      localStorage.removeItem("admin_user");
      window.dispatchEvent(new Event("admin-logout"));
    }
    const body = await response.json().catch(() => ({}));
    throw new Error(body.message || "Erro na requisicao.");
  }
  if (response.status === 204) return null;
  return response.json();
}

export async function login(email, password) {
  return apiFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function uploadFiles(files) {
  const token = localStorage.getItem("admin_token");
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));

  const response = await fetchWithTimeout(
    `${API_URL}/admin/upload`,
    {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    },
    UPLOAD_TIMEOUT_MS, // 60s para uploads
  );

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.message || "Falha no upload.");
  }

  return response.json();
}

