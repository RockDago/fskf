// config/axios.js
import axios from "axios";

//local
//export const API_URL = "http://127.0.0.1:8000";

//production
export const API_URL = "https://fosika.mesupres.edu.mg";

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
    // 🔍 LOGGING DIAGNOSTIC POUR IDENTIFIER LA ROUTE PROBLÉMATIQUE
    if (error.response?.status === 401) {
      console.error("❌ [Axios] 401 détecté:", {
        url: error.config?.url,
        method: error.config?.method?.toUpperCase(),
        message: error.response?.data?.message,
        fullUrl: error.config?.baseURL + error.config?.url,
      });
    }

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

    // 2. GESTION TOKEN INVALIDE (401) - PLUS INTELLIGENTE
    if (error.response?.status === 401) {
      const currentPath = window.location.pathname;

      // ⚠️ NE PAS LOGOUT SI DÉJÀ SUR LA PAGE LOGIN
      if (currentPath === "/login") {
        return Promise.reject(error);
      }

      // ⚠️ ROUTES QUI PEUVENT LÉGITIMEMENT RETOURNER 401 (pas de logout)
      const safeRoutes = [
        "/check-auth",
        "/auth/check",
        "/auth/user",
        "/debug/token-info",
      ];

      const requestUrl = error.config?.url || "";
      const isSafeRoute = safeRoutes.some((route) =>
        requestUrl.includes(route)
      );

      if (isSafeRoute) {
        console.warn(
          "⚠️ [Axios] 401 sur route safe:",
          requestUrl,
          "- pas de logout"
        );
        return Promise.reject(error);
      }

      // ✅ 401 SUR UNE ROUTE PROTÉGÉE -> LOGOUT NÉCESSAIRE
      console.warn(
        "⚠️ [Axios] Token invalide (401) sur:",
        requestUrl,
        "-> Logout"
      );

      // 🚨 NETTOYAGE CIBLÉ (pas localStorage.clear() qui efface tout)
      localStorage.removeItem("auth_token");
      localStorage.removeItem("user_data");
      localStorage.removeItem("just_logged_in");
      sessionStorage.removeItem("auth_token");
      sessionStorage.removeItem("user_data");
      sessionStorage.removeItem("just_logged_in");

      // ⚠️ GARDER remember_me et redirect_after_2fa intacts

      window.location.href = "/login";
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);

export default API;
