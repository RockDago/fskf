// config/axios.js
import axios from "axios";

export const API_URL = "http://127.0.0.1:8000";

const API = axios.create({
  baseURL: API_URL + "/api",
  timeout: 30000,

  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",

  },
});

// ✅ INTERCEPTEUR POUR AJOUTER LE TOKEN
API.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem("auth_token") ||
      sessionStorage.getItem("auth_token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // console.log(`[Axios] ${config.method.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => Promise.reject(error)
);

// ✅ INTERCEPTEUR POUR GÉRER LES RÉPONSES ET LA 2FA
API.interceptors.response.use(
  (response) => response,
  (error) => {
    // console.error("[Axios] ❌ Erreur:", error.response?.status, error.config?.url);

    // 1. GESTION 2FA (403 avec flag requires_2fa)
    if (error.response?.status === 403 && error.response.data?.requires_2fa) {
      console.log("🔐 [Axios] 2FA Requise -> Redirection");

      const currentPath = window.location.pathname;
      if (currentPath !== "/two-factor-verify" && currentPath !== "/login") {
        sessionStorage.setItem("redirect_after_2fa", currentPath);
      }

      window.location.href = "/two-factor-verify";
      return Promise.reject({ ...error, handled: true });
    }

    // 2. GESTION TOKEN INVALIDE (401)
    if (error.response?.status === 401) {
      console.warn("⚠️ [Axios] Token invalide (401) -> Logout");

      localStorage.removeItem("auth_token");
      localStorage.removeItem("user_data");
      sessionStorage.removeItem("auth_token");
      sessionStorage.removeItem("user_data");

      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);

export default API;
