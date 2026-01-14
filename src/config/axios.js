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

API.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem("auth_token") ||
      sessionStorage.getItem("auth_token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error("❌ [Axios] 401 détecté:", {
        url: error.config?.url,
        method: error.config?.method?.toUpperCase(),
        message: error.response?.data?.message,
        fullUrl: error.config?.baseURL + error.config?.url,
      });
    }

    if (error.response?.status === 403 && error.response.data?.requires_2fa) {
      console.log("🔐 [Axios] 2FA Requise -> Redirection");

      const currentPath = window.location.pathname;
      if (currentPath !== "/two-factor-verify" && currentPath !== "/login") {
        sessionStorage.setItem("redirect_after_2fa", currentPath);
      }

      window.location.href = "/two-factor-verify";
      return Promise.reject({ ...error, handled: true });
    }

    if (error.response?.status === 401) {
      const currentPath = window.location.pathname;

      if (currentPath === "/login") {
        return Promise.reject(error);
      }

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

      console.warn(
        "⚠️ [Axios] Token invalide (401) sur:",
        requestUrl,
        "-> Logout"
      );

      localStorage.removeItem("auth_token");
      localStorage.removeItem("user_data");
      localStorage.removeItem("just_logged_in");
      sessionStorage.removeItem("auth_token");
      sessionStorage.removeItem("user_data");
      sessionStorage.removeItem("just_logged_in");

      window.location.href = "/login";
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);

export default API;
