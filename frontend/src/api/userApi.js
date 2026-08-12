import axios from "axios";

const resolveBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  // Dev server (Vite): talk to FastAPI directly; CORS is enabled on the backend.
  if (import.meta.env.DEV) {
    return "http://127.0.0.1:8000";
  }
  // Production / desktop app: same origin as the served frontend.
  return "";
};

const API = axios.create({
  baseURL: resolveBaseUrl(),
  timeout: 15000,
});

const TOKEN_KEY = "nexus_access_token";
const USER_KEY = "nexus_user";

export const getStoredToken = () => localStorage.getItem(TOKEN_KEY);
export const getStoredUser = () => {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const setAuthSession = (accessToken, user) => {
  localStorage.setItem(TOKEN_KEY, accessToken);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  API.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
};

export const clearAuthSession = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  delete API.defaults.headers.common.Authorization;
};

const existingToken = getStoredToken();
if (existingToken) {
  API.defaults.headers.common.Authorization = `Bearer ${existingToken}`;
}

export default API;
